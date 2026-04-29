import { v4 as uuidv4 } from 'uuid';
import { 
  PlayerColor, 
  Player, 
  Piece, 
  BoardConfig, 
  MoveResult,
  PlayerStatus,
  GameStatus
} from '../types';

export class Game {
  private boardConfig: BoardConfig;
  private players: Map<string, Player>;
  private pieces: Map<string, Piece>;
  private currentPlayerId: string | null;
  private status: GameStatus;
  private currentDiceValue: number | null;

  constructor() {
    this.boardConfig = this.initializeBoardConfig();
    this.players = new Map();
    this.pieces = new Map();
    this.currentPlayerId = null;
    this.status = 'waiting';
    this.currentDiceValue = null;
  }

  private initializeBoardConfig(): BoardConfig {
    const homeStartPositions = new Map<PlayerColor, number>();
    homeStartPositions.set('red', 0);
    homeStartPositions.set('blue', 13);
    homeStartPositions.set('green', 26);
    homeStartPositions.set('yellow', 39);

    const baseStartPositions = new Map<PlayerColor, number>();
    baseStartPositions.set('red', 4);
    baseStartPositions.set('blue', 17);
    baseStartPositions.set('green', 30);
    baseStartPositions.set('yellow', 43);

    const safePositions = [0, 8, 13, 21, 26, 34, 39, 47];

    return {
      totalSteps: 52,
      safePositions,
      homeStartPositions,
      baseStartPositions,
      homeTrackLength: 6
    };
  }

  getBoardConfig(): BoardConfig {
    return this.boardConfig;
  }

  getPlayers(): Map<string, Player> {
    return this.players;
  }

  getPieces(): Map<string, Piece> {
    return this.pieces;
  }

  getCurrentPlayerId(): string | null {
    return this.currentPlayerId;
  }

  getStatus(): GameStatus {
    return this.status;
  }

  getCurrentDiceValue(): number | null {
    return this.currentDiceValue;
  }

  addPlayer(playerId: string, playerName: string, color: PlayerColor): Player {
    const player: Player = {
      id: playerId,
      name: playerName,
      color,
      status: 'waiting',
      lastActionTime: Date.now()
    };

    this.players.set(playerId, player);
    this.createPiecesForPlayer(playerId, color);
    
    return player;
  }

  removePlayer(playerId: string): void {
    this.players.delete(playerId);
    
    const piecesToRemove: string[] = [];
    this.pieces.forEach((piece, pieceId) => {
      if (this.getPlayerIdFromPieceColor(piece.color) === playerId) {
        piecesToRemove.push(pieceId);
      }
    });
    
    piecesToRemove.forEach(id => this.pieces.delete(id));
  }

  private getPlayerIdFromPieceColor(color: PlayerColor): string | null {
    for (const [playerId, player] of this.players) {
      if (player.color === color) {
        return playerId;
      }
    }
    return null;
  }

  private createPiecesForPlayer(playerId: string, color: PlayerColor): void {
    for (let i = 0; i < 4; i++) {
      const pieceId = `${playerId}-${i}`;
      const piece: Piece = {
        id: pieceId,
        color,
        position: -1,
        isAtBase: true,
        isAtFinish: false,
        isOnHomeTrack: false
      };
      this.pieces.set(pieceId, piece);
    }
  }

  getAvailableColors(): PlayerColor[] {
    const usedColors: PlayerColor[] = [];
    this.players.forEach(player => {
      usedColors.push(player.color);
    });
    
    const allColors: PlayerColor[] = ['red', 'blue', 'green', 'yellow'];
    return allColors.filter(color => !usedColors.includes(color));
  }

  isColorAvailable(color: PlayerColor): boolean {
    return this.getAvailableColors().includes(color);
  }

  setPlayerReady(playerId: string): void {
    const player = this.players.get(playerId);
    if (player) {
      player.status = 'ready';
    }
  }

  canStartGame(): boolean {
    if (this.players.size < 2) return false;
    
    let readyCount = 0;
    this.players.forEach(player => {
      if (player.status === 'ready') readyCount++;
    });
    
    return readyCount >= 2;
  }

  startGame(): void {
    if (!this.canStartGame()) {
      throw new Error('Cannot start game: Not enough players ready');
    }

    this.status = 'playing';
    
    const playersArray = Array.from(this.players.values());
    playersArray.forEach(player => {
      player.status = 'playing';
    });
    
    this.currentPlayerId = playersArray[0].id;
  }

  rollDice(): number {
    const value = Math.floor(Math.random() * 6) + 1;
    this.currentDiceValue = value;
    
    const currentPlayer = this.players.get(this.currentPlayerId!);
    if (currentPlayer) {
      currentPlayer.lastActionTime = Date.now();
    }
    
    return value;
  }

  getMovablePieces(playerId: string, diceValue: number): Piece[] {
    const player = this.players.get(playerId);
    if (!player) return [];

    const playerPieces: Piece[] = [];
    this.pieces.forEach(piece => {
      if (piece.color === player.color) {
        playerPieces.push(piece);
      }
    });

    return playerPieces.filter(piece => {
      if (piece.isAtFinish) return false;
      
      if (piece.isAtBase) {
        return diceValue === 6;
      }
      
      if (piece.isOnHomeTrack) {
        const newHomeTrackPos = piece.position + diceValue;
        return newHomeTrackPos <= this.boardConfig.homeTrackLength;
      }
      
      const homeStartPos = this.boardConfig.homeStartPositions.get(player.color)!;
      const baseStartPos = this.boardConfig.baseStartPositions.get(player.color)!;
      
      let distanceToHomeStart = homeStartPos - piece.position;
      if (distanceToHomeStart < 0) {
        distanceToHomeStart += this.boardConfig.totalSteps;
      }
      
      if (distanceToHomeStart <= diceValue) {
        const remainingSteps = diceValue - distanceToHomeStart;
        return remainingSteps <= this.boardConfig.homeTrackLength;
      }
      
      return true;
    });
  }

  movePiece(playerId: string, pieceId: string, diceValue: number): MoveResult {
    const player = this.players.get(playerId);
    const piece = this.pieces.get(pieceId);
    
    if (!player || !piece) {
      return {
        success: false,
        capturedPieces: [],
        movedPiece: null,
        canRollAgain: false
      };
    }
    
    if (piece.color !== player.color) {
      return {
        success: false,
        capturedPieces: [],
        movedPiece: null,
        canRollAgain: false
      };
    }
    
    const movablePieces = this.getMovablePieces(playerId, diceValue);
    if (!movablePieces.some(p => p.id === pieceId)) {
      return {
        success: false,
        capturedPieces: [],
        movedPiece: null,
        canRollAgain: false
      };
    }

    player.lastActionTime = Date.now();
    this.currentDiceValue = null;
    
    const capturedPieces: Piece[] = [];
    let canRollAgain = diceValue === 6;

    if (piece.isAtBase) {
      const baseStartPos = this.boardConfig.baseStartPositions.get(player.color)!;
      piece.isAtBase = false;
      piece.position = baseStartPos;
      
      capturedPieces.push(...this.checkCapture(piece));
    } else if (piece.isOnHomeTrack) {
      piece.position += diceValue;
      if (piece.position === this.boardConfig.homeTrackLength) {
        piece.isAtFinish = true;
      }
    } else {
      const homeStartPos = this.boardConfig.homeStartPositions.get(player.color)!;
      let distanceToHomeStart = homeStartPos - piece.position;
      if (distanceToHomeStart < 0) {
        distanceToHomeStart += this.boardConfig.totalSteps;
      }
      
      if (distanceToHomeStart <= diceValue) {
        const remainingSteps = diceValue - distanceToHomeStart;
        piece.isOnHomeTrack = true;
        piece.position = remainingSteps;
        
        if (piece.position === this.boardConfig.homeTrackLength) {
          piece.isAtFinish = true;
        }
      } else {
        piece.position = (piece.position + diceValue) % this.boardConfig.totalSteps;
        
        capturedPieces.push(...this.checkCapture(piece));
      }
    }

    if (capturedPieces.length > 0) {
      canRollAgain = true;
    }

    if (this.checkGameOver()) {
      this.status = 'finished';
    }

    return {
      success: true,
      capturedPieces,
      movedPiece: piece,
      canRollAgain
    };
  }

  private checkCapture(piece: Piece): Piece[] {
    if (this.boardConfig.safePositions.includes(piece.position)) {
      return [];
    }

    const capturedPieces: Piece[] = [];
    
    this.pieces.forEach(otherPiece => {
      if (otherPiece.id === piece.id) return;
      if (otherPiece.color === piece.color) return;
      if (otherPiece.isAtBase || otherPiece.isAtFinish || otherPiece.isOnHomeTrack) return;
      
      if (otherPiece.position === piece.position) {
        otherPiece.isAtBase = true;
        otherPiece.position = -1;
        otherPiece.isOnHomeTrack = false;
        capturedPieces.push(otherPiece);
      }
    });

    return capturedPieces;
  }

  nextPlayer(): string | null {
    if (this.players.size === 0) return null;
    
    const playersArray = Array.from(this.players.values());
    const currentIndex = playersArray.findIndex(p => p.id === this.currentPlayerId);
    
    let nextIndex = (currentIndex + 1) % playersArray.length;
    this.currentPlayerId = playersArray[nextIndex].id;
    
    return this.currentPlayerId;
  }

  checkGameOver(): boolean {
    const playersWithAllFinished: string[] = [];
    
    this.players.forEach((player, playerId) => {
      const playerPieces: Piece[] = [];
      this.pieces.forEach(piece => {
        if (piece.color === player.color) {
          playerPieces.push(piece);
        }
      });
      
      const allFinished = playerPieces.every(piece => piece.isAtFinish);
      if (allFinished) {
        playersWithAllFinished.push(playerId);
      }
    });
    
    return playersWithAllFinished.length > 0;
  }

  getWinner(): Player | null {
    if (this.status !== 'finished') return null;
    
    for (const [playerId, player] of this.players) {
      const playerPieces: Piece[] = [];
      this.pieces.forEach(piece => {
        if (piece.color === player.color) {
          playerPieces.push(piece);
        }
      });
      
      const allFinished = playerPieces.every(piece => piece.isAtFinish);
      if (allFinished) {
        return player;
      }
    }
    
    return null;
  }

  getPlayerPieces(playerColor: PlayerColor): Piece[] {
    const pieces: Piece[] = [];
    this.pieces.forEach(piece => {
      if (piece.color === playerColor) {
        pieces.push(piece);
      }
    });
    return pieces;
  }
}
