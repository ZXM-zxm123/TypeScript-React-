export type PlayerColor = 'red' | 'blue' | 'green' | 'yellow';

export type PlayerStatus = 'waiting' | 'ready' | 'playing' | 'disconnected';

export type GameStatus = 'waiting' | 'playing' | 'finished';

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  status: PlayerStatus;
  lastActionTime: number;
}

export interface Piece {
  id: string;
  color: PlayerColor;
  position: number;
  isAtBase: boolean;
  isAtFinish: boolean;
  isOnHomeTrack: boolean;
}

export interface Room {
  id: string;
  roomCode: string;
  players: Map<string, Player>;
  pieces: Map<string, Piece>;
  status: GameStatus;
  currentPlayerId: string | null;
  currentDiceValue: number | null;
  chatMessages: ChatMessage[];
  createdAt: number;
  maxPlayers: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  content: string;
  timestamp: number;
}

export interface BoardConfig {
  totalSteps: number;
  safePositions: number[];
  homeStartPositions: Map<PlayerColor, number>;
  baseStartPositions: Map<PlayerColor, number>;
  homeTrackLength: number;
}

export interface MoveResult {
  success: boolean;
  capturedPieces: Piece[];
  movedPiece: Piece | null;
  canRollAgain: boolean;
}
