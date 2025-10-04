export interface Player {
  id: number;
  name: string;
  rating: number;
  pieces: number[];
  nPieces: number;
  isConnected?: boolean;
}

export interface GamePiece {
  value: number | 'n';
  playerId: number;
}

export interface GameState {
  board: (GamePiece | null)[][];
  players: Player[];
  currentPlayer: number;
  gameStatus: 'waiting' | 'playing' | 'finished';
  winner: number | null;
  scores: { player1: number; player2: number };
  moveHistory: GameMove[];
}

export interface GameMove {
  row: number;
  col: number;
  piece: number | 'n';
  playerId: number;
  timestamp: number;
}

export interface PlayerData {
  playerId: string;
  displayName: string;
  rating: number;
  wins: number;
  losses: number;
  totalGames: number;
  gameHistory: GameResult[];
  createdAt: string;
  lastPlayed: string;
  winStreak?: number;
  ratingHistory: RatingHistoryEntry[];
}

export interface GameResult {
  gameId: string;
  opponent: string;
  result: 'win' | 'loss' | 'draw';
  myScore: number;
  opponentScore: number;
  ratingChange: number;
  playedAt: string;
}

export interface RatingHistoryEntry {
  rating: number;
  timestamp: string;
  change: number;
}

export type GameAction = 
  | { type: 'PLACE_PIECE'; payload: { row: number; col: number; value: number | 'n'; playerId: number } }
  | { type: 'SWITCH_PLAYER' }
  | { type: 'END_GAME'; payload: { winner: number | null; scores: { player1: number; player2: number } } }
  | { type: 'RESET_GAME' }
  | { type: 'UPDATE_PLAYER_PIECES'; payload: { playerId: number; pieces: number[]; nPieces: number } }
  | { type: 'SET_STATE'; payload: GameState };