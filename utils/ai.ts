import { GamePiece, Player, GameState } from '@/types/game';
import { validateMove, placePiece, checkGameEnd } from '@/utils/gameLogic';

export interface AiMove {
  row: number;
  col: number;
  piece: number | 'n';
}

const LINES: Array<Array<{ row: number; col: number }>> = [
  // rows
  [ {row:0,col:0},{row:0,col:1},{row:0,col:2},{row:0,col:3} ],
  [ {row:1,col:0},{row:1,col:1},{row:1,col:2},{row:1,col:3} ],
  [ {row:2,col:0},{row:2,col:1},{row:2,col:2},{row:2,col:3} ],
  [ {row:3,col:0},{row:3,col:1},{row:3,col:2},{row:3,col:3} ],
  // cols
  [ {row:0,col:0},{row:1,col:0},{row:2,col:0},{row:3,col:0} ],
  [ {row:0,col:1},{row:1,col:1},{row:2,col:1},{row:3,col:1} ],
  [ {row:0,col:2},{row:1,col:2},{row:2,col:2},{row:3,col:2} ],
  [ {row:0,col:3},{row:1,col:3},{row:2,col:3},{row:3,col:3} ],
  // diagonals
  [ {row:0,col:0},{row:1,col:1},{row:2,col:2},{row:3,col:3} ],
  [ {row:0,col:3},{row:1,col:2},{row:2,col:1},{row:3,col:0} ],
];

function cloneBoard(board: (GamePiece | null)[][]) {
  return board.map(r => r.map(c => c ? { ...c } : null));
}

export type AiLevel = 'beginner' | 'advanced' | 'oni';

export function chooseAiMove(
  board: (GamePiece | null)[][],
  players: Player[],
  aiId: number,
  level: AiLevel = 'advanced'
): AiMove | null {
  const ai = players[aiId];
  const opponentId = aiId === 0 ? 1 : 0;
  const opponent = players[opponentId];

  const numericPiecesDesc = [...ai.pieces].sort((a, b) => b - a);

  // helper: list all valid moves for given piece set and player
  const listValidMoves = (pid: number, pieceList: number[] | ('n' | number)[]) => {
    const res: AiMove[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        for (const p of pieceList) {
          if (typeof p === 'number') {
            if (validateMove(board, r, c, p, pid, players)) {
              res.push({ row: r, col: c, piece: p });
            }
          } else {
            if (players[pid].nPieces > 0 && validateMove(board, r, c, 'n', pid, players)) {
              res.push({ row: r, col: c, piece: 'n' });
            }
          }
        }
      }
    }
    return res;
  };

  // 1) beginner: まずはランダム性高めに単純手
  if (level === 'beginner') {
    const simpleList: Array<number | 'n'> = [...numericPiecesDesc];
    if (ai.nPieces > 0) simpleList.push('n');
    const valids = listValidMoves(aiId, simpleList);
    if (valids.length === 0) return null;
    // 空マス優先、たまに中央寄り
    const shuffled = valids.sort(() => Math.random() - 0.5);
    return shuffled[0];
  }

  // 2) advanced: 直近勝利→ブロック→上書き重視
  // 直ちに勝てる手
  const aiPiecesForWin: Array<number | 'n'> = [...numericPiecesDesc];
  if (ai.nPieces > 0) aiPiecesForWin.push('n');
  const candidates = listValidMoves(aiId, aiPiecesForWin);
  for (const mv of candidates) {
    const simBoard = cloneBoard(board);
    const placed = placePiece(simBoard, mv.row, mv.col, mv.piece, aiId).board;
    const gs: GameState = {
      board: placed,
      players,
      currentPlayer: opponentId,
      gameStatus: 'playing',
      winner: null,
      scores: { player1: 0, player2: 0 },
      moveHistory: []
    };
    const end = checkGameEnd(gs) as any;
    if (end.isGameEnd && end.winner === aiId) return mv;
  }

  // ブロック
  const oppPiecesDesc = [...opponent.pieces].sort((a, b) => b - a);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      for (const p of oppPiecesDesc) {
        if (!validateMove(board, r, c, p, opponentId, players)) continue;
        const simBoard = cloneBoard(board);
        const placed = placePiece(simBoard, r, c, p, opponentId).board;
        const gs: GameState = {
          board: placed,
          players,
          currentPlayer: aiId,
          gameStatus: 'playing',
          winner: null,
          scores: { player1: 0, player2: 0 },
          moveHistory: []
        };
        const end = checkGameEnd(gs) as any;
        if (end.isGameEnd && end.winner === opponentId) {
          // try to occupy this cell to block
          // choose smallest valid numeric, else 'n'
          const numericAsc = [...ai.pieces].sort((a, b) => a - b);
          for (const myp of numericAsc) {
            if (validateMove(board, r, c, myp, aiId, players)) return { row: r, col: c, piece: myp };
          }
          if (ai.nPieces > 0 && validateMove(board, r, c, 'n', aiId, players)) return { row: r, col: c, piece: 'n' };
        }
      }
    }
  }

  // 上書き重視
  let best: { mv: AiMove; score: number } | null = null;
  for (const mv of candidates) {
    const target = board[mv.row][mv.col];
    let score = 0;
    if (target && target.playerId !== aiId) {
      score = typeof target.value === 'number' ? target.value * 2 : 1; // prefer big overwrites
    } else {
      // center preference
      const centerDist = Math.abs(mv.row - 1.5) + Math.abs(mv.col - 1.5);
      score = 3 - centerDist;
    }
    // prefer larger piece slightly
    score += typeof mv.piece === 'number' ? mv.piece / 10 : 0.1;
    if (!best || score > best.score) best = { mv, score };
  }
  if (level !== 'oni' && best) return best.mv;

  // 3) oni: 簡易ミニマックス（深さ2）
  if (level === 'oni') {
    const lineScore = (b: (GamePiece | null)[][]) => {
      let score = 0;
      for (const line of LINES) {
        let a = 0, o = 0, e = 0;
        for (const { row, col } of line) {
          const cell = b[row][col];
          if (!cell) { e++; continue; }
          if (cell.playerId === aiId) a++; else o++;
        }
        if (a > 0 && o > 0) continue; // 混在は価値薄
        if (a > 0) score += Math.pow(10, a); // 1,10,100,1000
        if (o > 0) score -= Math.pow(10, o) * 1.1; // 相手ラインはやや重めに減点
      }
      // 中央寄り加点
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const cell = b[r][c];
          if (!cell) continue;
          const w = 0.2 * (2 - (Math.abs(r - 1.5) + Math.abs(c - 1.5)));
          if (cell.playerId === aiId) score += w; else score -= w;
        }
      }
      return score;
    };

    // アルファベータ探索（深さ3）
    const orderMoves = (ms: AiMove[]) => {
      return ms
        .map(m => {
          const tgt = board[m.row][m.col];
          const w = tgt && tgt.playerId !== aiId ? (typeof tgt.value === 'number' ? tgt.value : 1) + 3 : 0;
          const center = 2 - (Math.abs(m.row - 1.5) + Math.abs(m.col - 1.5));
          return { m, k: w + center };
        })
        .sort((a, b) => b.k - a.k)
        .slice(0, 10) // 枝刈り
        .map(x => x.m);
    };

    const ab = (b: (GamePiece | null)[][], depth: number, alpha: number, beta: number, maximizing: boolean): number => {
      if (depth === 0) return lineScore(b);
      const pid = maximizing ? aiId : opponentId;
      const plist = maximizing ? ai.pieces : opponent.pieces;
      const moves = orderMoves(listValidMoves(pid, plist));
      if (moves.length === 0) return lineScore(b);
      if (maximizing) {
        let value = -Infinity;
        for (const mv of moves) {
          const nb = cloneBoard(b);
          const after = placePiece(nb, mv.row, mv.col, mv.piece, pid).board;
          value = Math.max(value, ab(after, depth - 1, alpha, beta, false));
          alpha = Math.max(alpha, value);
          if (alpha >= beta) break;
        }
        return value;
      } else {
        let value = Infinity;
        for (const mv of moves) {
          const nb = cloneBoard(b);
          const after = placePiece(nb, mv.row, mv.col, mv.piece, pid).board;
          value = Math.min(value, ab(after, depth - 1, alpha, beta, true));
          beta = Math.min(beta, value);
          if (alpha >= beta) break;
        }
        return value;
      }
    };

    let bestMm: { mv: AiMove; score: number } | null = null;
    const ordered = candidates.length ? orderMoves(candidates) : [];
    for (const mv of ordered) {
      const b1 = cloneBoard(board);
      const after1 = placePiece(b1, mv.row, mv.col, mv.piece, aiId).board;
      const sc = ab(after1, 2, -Infinity, Infinity, false); // 合計深さ3 (自分1手+相手2手)
      if (!bestMm || sc > bestMm.score) bestMm = { mv, score: sc };
    }
    if (bestMm) return bestMm.mv;
  }

  return null;
}

