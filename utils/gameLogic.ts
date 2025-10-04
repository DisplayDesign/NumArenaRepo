import { GameState, GamePiece, Player } from '@/types/game';

export const initializeGame = (player1: Player, player2: Player): GameState => {
  return {
    board: Array(4).fill(null).map(() => Array(4).fill(null)),
    players: [
      { ...player1, pieces: [1, 2, 3, 4, 5, 6, 7, 8], nPieces: 0 },
      { ...player2, pieces: [1, 2, 3, 4, 5, 6, 7, 8], nPieces: 0 }
    ],
    currentPlayer: Math.floor(Math.random() * 2),
    gameStatus: 'playing',
    winner: null,
    scores: { player1: 0, player2: 0 },
    moveHistory: []
  };
};

export const getAdjacentCells = (row: number, col: number) => {
  const adjacent = [];
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // 上下左右
  
  for (const [dRow, dCol] of directions) {
    const newRow = row + dRow;
    const newCol = col + dCol;
    
    if (newRow >= 0 && newRow < 4 && newCol >= 0 && newCol < 4) {
      adjacent.push({ row: newRow, col: newCol });
    }
  }
  
  return adjacent;
};

export const resolveBattle = (piece1: number | 'n', piece2: number | 'n') => {
  // 「n」は全ての数字に負ける
  if (piece1 === 'n' && piece2 !== 'n') return { winner: 'adjacent' };
  if (piece2 === 'n' && piece1 !== 'n') return { winner: 'current' };
  if (piece1 === 'n' && piece2 === 'n') return { winner: 'none' };
  
  // 数字同士の比較
  if (typeof piece1 === 'number' && typeof piece2 === 'number') {
    if (piece1 > piece2) return { winner: 'current' };
    if (piece2 > piece1) return { winner: 'adjacent' };
  }
  
  return { winner: 'none' }; // 同じ数字の場合
};

export interface PlacePieceResult {
  board: (GamePiece | null)[][];
  nGains: { [playerId: number]: number };
}

export const placePiece = (
  board: (GamePiece | null)[][],
  row: number,
  col: number,
  value: number | 'n',
  playerId: number
): PlacePieceResult => {
  // 1. 盤面のコピー
  const newBoard = board.map(r => [...r]);
  const nGains: { [playerId: number]: number } = { 0: 0, 1: 0 };

  // 2. 既存コマの上書き処理（相手のみ）
  const targetCell = newBoard[row][col];
  if (targetCell && targetCell.playerId !== playerId) {
    const defender = targetCell;
    let canOverwrite = false;
    if (defender.value === 'n' && typeof value === 'number') {
      canOverwrite = true;
    } else if (typeof value === 'number' && typeof defender.value === 'number' && value > defender.value) {
      canOverwrite = true;
    }
    if (canOverwrite) {
      // 上書き成立: 防御側は n コマを得る
      nGains[defender.playerId] = (nGains[defender.playerId] || 0) + 1;
      newBoard[row][col] = { value, playerId };
    } else {
      // 上書き不可だが、ここに来ない想定（validateMoveで弾く）
      return { board, nGains };
    }
  } else {
    // 空マス、または同じプレイヤーのマス（後者はvalidateで弾く想定）
    newBoard[row][col] = { value, playerId };
  }

  // 隣接バトルは今回の仕様では行わない（上書きのみ）

  return { board: newBoard, nGains };
};

export const checkGameEnd = (gameState: GameState) => {
  const { board, players } = gameState;
  // 0. 直線（縦・横・斜め）の勝利判定
  const checkLine = (cells: (GamePiece | null)[]) => {
    const first = cells[0];
    if (!first) return null;
    const pid = first.playerId;
    for (let i = 1; i < cells.length; i++) {
      if (!cells[i] || cells[i]!.playerId !== pid) return null;
    }
    return pid;
  };

  // 縦
  for (let col = 0; col < 4; col++) {
    const colCells = [board[0][col], board[1][col], board[2][col], board[3][col]];
    const winPid = checkLine(colCells);
    if (winPid !== null) return { isGameEnd: true, reason: 'column_win', winner: winPid } as const;
  }

  // 横
  for (let row = 0; row < 4; row++) {
    const rowCells = [board[row][0], board[row][1], board[row][2], board[row][3]];
    const winPid = checkLine(rowCells);
    if (winPid !== null) return { isGameEnd: true, reason: 'row_win', winner: winPid } as const;
  }

  // 斜め2本
  const diag1 = [board[0][0], board[1][1], board[2][2], board[3][3]];
  const d1 = checkLine(diag1);
  if (d1 !== null) return { isGameEnd: true, reason: 'diag_win', winner: d1 } as const;
  const diag2 = [board[0][3], board[1][2], board[2][1], board[3][0]];
  const d2 = checkLine(diag2);
  if (d2 !== null) return { isGameEnd: true, reason: 'diag_win', winner: d2 } as const;
  
  // 2. ボードが満杯かチェック（全マス埋まりでスコア判定へ）
  const isBoardFull = board.every(row => row.every(cell => cell !== null));
  
  if (isBoardFull) {
    return { isGameEnd: true, reason: 'board_full' };
  }
  
  return { isGameEnd: false };
};

export const calculateFinalScores = (board: (GamePiece | null)[][]) => {
  let player1Score = 0;
  let player2Score = 0;
  
  board.forEach(row => {
    row.forEach(cell => {
      if (cell && typeof cell.value === 'number') {
        if (cell.playerId === 0) {
          player1Score += cell.value;
        } else {
          player2Score += cell.value;
        }
      }
      // 「n」コマは合計に含めない
    });
  });
  
  return { player1Score, player2Score };
};

export const validateMove = (board: (GamePiece | null)[][], row: number, col: number, piece: number | 'n', playerId: number, players: Player[]): boolean => {
  
  // セル範囲チェック
  if (row < 0 || row >= 4 || col < 0 || col >= 4) {
    return false;
  }
  
  // セル空き/上書きチェック
  const occupying = board[row][col];
  if (occupying) {
    // 自分のコマには上書き不可
    if (occupying.playerId === playerId) {
      return false;
    }
    // n での上書きは不可
    if (piece === 'n') {
      return false;
    }
    // 相手の n は任意の数字で上書き可
    if (occupying.value === 'n' && typeof piece === 'number') {
      return true;
    } else if (typeof piece === 'number' && typeof occupying.value === 'number') {
      return piece > occupying.value;
    } else {
      return false;
    }
  }
  
  // コマ利用可能性チェック
  const player = players[playerId];
  if (typeof piece === 'number' && !player.pieces.includes(piece)) {
    return false;
  }
  
  if (piece === 'n' && player.nPieces <= 0) {
    return false;
  }
  
  return true;
};