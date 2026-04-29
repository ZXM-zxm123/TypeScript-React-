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
  homeStartPositions: Record<PlayerColor, number>;
  baseStartPositions: Record<PlayerColor, number>;
  homeTrackLength: number;
}

export interface Room {
  id: string;
  roomCode: string;
  players: Player[];
  pieces: Piece[];
  status: GameStatus;
  currentPlayerId: string | null;
  currentDiceValue: number | null;
  chatMessages: ChatMessage[];
  maxPlayers: number;
  boardConfig: BoardConfig | null;
}

export interface GameContextType {
  socket: any;
  room: Room | null;
  selfPlayerId: string | null;
  isConnected: boolean;
  error: string | null;
  createRoom: (playerName: string, maxPlayers: number) => void;
  joinRoom: (roomCode: string, playerName: string, color: PlayerColor) => void;
  getAvailableColors: (roomCode: string) => void;
  availableColors: PlayerColor[];
  playerReady: () => void;
  startGame: () => void;
  rollDice: () => void;
  movePiece: (pieceId: string) => void;
  sendMessage: (content: string) => void;
  leaveRoom: () => void;
  isMyTurn: boolean;
  movablePieceIds: string[];
  winner: Player | null;
  clearError: () => void;
}
