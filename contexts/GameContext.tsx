import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { GameState, GameAction, Player, GameMove } from '@/types/game';
import { initializeGame, placePiece, checkGameEnd, calculateFinalScores, validateMove } from '@/utils/gameLogic';

interface GameContextType {
  gameState: GameState;
  startGame: (player1: Player, player2: Player) => void;
  makeMove: (row: number, col: number, value: number | 'n') => boolean;
  resetGame: () => void;
  isValidMove: (row: number, col: number, value: number | 'n') => boolean;
  passTurn: () => void;
  syncState: (state: GameState) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const initialGameState: GameState = {
  board: Array(4).fill(null).map(() => Array(4).fill(null)),
  players: [],
  currentPlayer: 0,
  gameStatus: 'waiting',
  winner: null,
  scores: { player1: 0, player2: 0 },
  moveHistory: []
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'SET_STATE':
      try {
        // 変更なしなら同じ参照を返して再レンダを抑制
        if (JSON.stringify(state) === JSON.stringify(action.payload)) {
          return state;
        }
      } catch {}
      return { ...action.payload };
    case 'PLACE_PIECE': {
      const { row, col, value, playerId } = action.payload;
      
      // バリデーション
      if (!validateMove(state.board, row, col, value, playerId, state.players)) {
        return state;
      }
      
      const placeResult = placePiece(state.board, row, col, value, playerId);
      const newBoard = placeResult.board;
      const currentPlayer = state.players[playerId];
      
      // プレイヤーのコマを更新
      const updatedPlayers = [...state.players];
      if (typeof value === 'number') {
        updatedPlayers[playerId] = {
          ...currentPlayer,
          pieces: currentPlayer.pieces.filter(p => p !== value)
        };
      } else if (value === 'n') {
        updatedPlayers[playerId] = {
          ...currentPlayer,
          nPieces: Math.max(0, currentPlayer.nPieces - 1)
        };
      }

      // バトル結果に応じて各プレイヤーの nPieces を増やす
      Object.entries(placeResult.nGains).forEach(([pid, gain]) => {
        const playerIndex = Number(pid);
        if (gain > 0 && updatedPlayers[playerIndex]) {
          updatedPlayers[playerIndex] = {
            ...updatedPlayers[playerIndex],
            nPieces: updatedPlayers[playerIndex].nPieces + (gain as number)
          };
        }
      });
      
      // 移動履歴を追加
      const move: GameMove = {
        row,
        col,
        piece: value,
        playerId,
        timestamp: Date.now()
      };
      
      const newState = {
        ...state,
        board: newBoard,
        players: updatedPlayers,
        moveHistory: [...state.moveHistory, move]
      };
      
      // ゲーム終了チェック
      const gameEndCheck = checkGameEnd(newState);
      if (gameEndCheck.isGameEnd) {
        // 列完成勝利がある場合は即終了
        if ((gameEndCheck as any).winner !== undefined) {
          const fs = calculateFinalScores(newBoard);
          return {
            ...newState,
            gameStatus: 'finished',
            winner: (gameEndCheck as any).winner,
            scores: { player1: fs.player1Score, player2: fs.player2Score },
            currentPlayer: state.currentPlayer
          };
        }
        const scores = calculateFinalScores(newBoard);
        let winner: number | null = null;
        if (scores.player1Score > scores.player2Score) winner = 0;
        else if (scores.player2Score > scores.player1Score) winner = 1;
        return {
          ...newState,
          gameStatus: 'finished',
          winner,
          scores: { player1: scores.player1Score, player2: scores.player2Score },
          currentPlayer: state.currentPlayer
        };
      }
      
      // 次のプレイヤーに交代（片方のプレイヤーがコマを持たない場合は、もう一方のプレイヤーの連続手番）
      const hasPieces = (pid: number) => newState.players[pid].pieces.length > 0 || newState.players[pid].nPieces > 0;
      let next = state.currentPlayer === 0 ? 1 : 0;
      if (!hasPieces(next) && hasPieces(state.currentPlayer)) {
        next = state.currentPlayer; // 相手がコマ無し→現手番の連続
      }
      return {
        ...newState,
        currentPlayer: next
      };
    }
    
    case 'SWITCH_PLAYER':
      return {
        ...state,
        currentPlayer: state.currentPlayer === 0 ? 1 : 0
      };
    
    case 'END_GAME':
      return {
        ...state,
        gameStatus: 'finished',
        winner: action.payload.winner,
        scores: action.payload.scores
      };
    
    case 'RESET_GAME':
      return initialGameState;
    
    case 'UPDATE_PLAYER_PIECES': {
      const { playerId, pieces, nPieces } = action.payload;
      const updatedPlayers = [...state.players];
      updatedPlayers[playerId] = {
        ...updatedPlayers[playerId],
        pieces,
        nPieces
      };
      
      return {
        ...state,
        players: updatedPlayers
      };
    }
    
    default:
      return state;
  }
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
  
  const startGame = useCallback((player1: Player, player2: Player) => {
    const newGameState = initializeGame(player1, player2);
    dispatch({ type: 'SET_STATE', payload: newGameState });
  }, []);
  
  const makeMove = useCallback((row: number, col: number, value: number | 'n'): boolean => {
    if (gameState.gameStatus !== 'playing') {
      return false;
    }

    const isValid = validateMove(
      gameState.board,
      row,
      col,
      value,
      gameState.currentPlayer,
      gameState.players
    );

    if (isValid) {
      dispatch({
        type: 'PLACE_PIECE',
        payload: { row, col, value, playerId: gameState.currentPlayer }
      });
      return true;
    } else {
    }

    return false;
  }, [dispatch, gameState.board, gameState.currentPlayer, gameState.gameStatus, gameState.players]);
  
  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  const passTurn = useCallback(() => {
    if (gameState.gameStatus !== 'playing') return;
    dispatch({ type: 'SWITCH_PLAYER' });
  }, [gameState.gameStatus]);
  
  const isValidMove = useCallback((row: number, col: number, value: number | 'n'): boolean => {
    return validateMove(
      gameState.board,
      row,
      col,
      value,
      gameState.currentPlayer,
      gameState.players
    );
  }, [gameState.board, gameState.currentPlayer, gameState.players]);

  const syncState = useCallback((state: GameState) => {
    dispatch({ type: 'SET_STATE', payload: state });
  }, [dispatch]);
  
  const value = React.useMemo(() => ({
    gameState,
    startGame,
    makeMove,
    resetGame,
    isValidMove,
    passTurn,
    syncState
  }), [gameState, startGame, makeMove, resetGame, isValidMove, passTurn, syncState]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};