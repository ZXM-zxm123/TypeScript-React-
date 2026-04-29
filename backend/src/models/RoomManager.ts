import { v4 as uuidv4 } from 'uuid';
import { Room, Player, PlayerColor, ChatMessage, GameStatus, PlayerStatus } from '../types';
import { Game } from './Game';

export class RoomManager {
  private rooms: Map<string, Room>;
  private roomCodeToId: Map<string, string>;

  constructor() {
    this.rooms = new Map();
    this.roomCodeToId = new Map();
  }

  generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    if (this.roomCodeToId.has(code)) {
      return this.generateRoomCode();
    }
    
    return code;
  }

  createRoom(maxPlayers: number = 4): Room {
    const roomId = uuidv4();
    const roomCode = this.generateRoomCode();
    
    const room: Room = {
      id: roomId,
      roomCode,
      players: new Map(),
      pieces: new Map(),
      status: 'waiting',
      currentPlayerId: null,
      currentDiceValue: null,
      chatMessages: [],
      createdAt: Date.now(),
      maxPlayers
    };
    
    this.rooms.set(roomId, room);
    this.roomCodeToId.set(roomCode, roomId);
    
    return room;
  }

  getRoomById(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getRoomByCode(roomCode: string): Room | undefined {
    const roomId = this.roomCodeToId.get(roomCode);
    if (roomId) {
      return this.rooms.get(roomId);
    }
    return undefined;
  }

  addPlayerToRoom(roomId: string, playerId: string, playerName: string, color: PlayerColor): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    
    if (room.players.size >= room.maxPlayers) return null;
    
    const usedColors: PlayerColor[] = [];
    room.players.forEach(player => {
      usedColors.push(player.color);
    });
    
    if (usedColors.includes(color)) return null;
    
    const player: Player = {
      id: playerId,
      name: playerName,
      color,
      status: 'waiting',
      lastActionTime: Date.now()
    };
    
    room.players.set(playerId, player);
    
    return room;
  }

  removePlayerFromRoom(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    
    room.players.delete(playerId);
    
    if (room.players.size === 0) {
      this.deleteRoom(roomId);
    }
  }

  deleteRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      this.roomCodeToId.delete(room.roomCode);
      this.rooms.delete(roomId);
    }
  }

  getAvailableColors(room: Room): PlayerColor[] {
    const usedColors: PlayerColor[] = [];
    room.players.forEach(player => {
      usedColors.push(player.color);
    });
    
    const allColors: PlayerColor[] = ['red', 'blue', 'green', 'yellow'];
    return allColors.filter(color => !usedColors.includes(color));
  }

  addChatMessage(roomId: string, playerId: string, content: string): ChatMessage | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    
    const player = room.players.get(playerId);
    if (!player) return null;
    
    const message: ChatMessage = {
      id: uuidv4(),
      playerId,
      playerName: player.name,
      content,
      timestamp: Date.now()
    };
    
    room.chatMessages.push(message);
    
    if (room.chatMessages.length > 100) {
      room.chatMessages = room.chatMessages.slice(-100);
    }
    
    return message;
  }

  canStartGame(room: Room): boolean {
    if (room.players.size < 2) return false;
    
    let readyCount = 0;
    room.players.forEach(player => {
      if (player.status === 'ready') readyCount++;
    });
    
    return readyCount >= 2;
  }

  setPlayerReady(room: Room, playerId: string): boolean {
    const player = room.players.get(playerId);
    if (!player) return false;
    
    player.status = 'ready';
    return true;
  }

  getRoomState(room: Room) {
    const playersArray = Array.from(room.players.values());
    const piecesArray = Array.from(room.pieces.values());
    
    return {
      id: room.id,
      roomCode: room.roomCode,
      players: playersArray,
      pieces: piecesArray,
      status: room.status,
      currentPlayerId: room.currentPlayerId,
      currentDiceValue: room.currentDiceValue,
      chatMessages: room.chatMessages,
      maxPlayers: room.maxPlayers
    };
  }
}
