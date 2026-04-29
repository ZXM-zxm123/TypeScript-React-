import { Server, Socket } from 'socket.io';
import { RoomManager } from '../models/RoomManager';
import { Game } from '../models/Game';
import { PlayerColor, Room, Player, Piece, ChatMessage } from '../types';

interface PlayerSocketMap {
  [socketId: string]: {
    playerId: string;
    roomId: string;
  };
}

export class GameService {
  private io: Server;
  private roomManager: RoomManager;
  private games: Map<string, Game>;
  private playerSocketMap: PlayerSocketMap;
  private autoRollIntervals: Map<string, NodeJS.Timeout>;
  private readonly AUTO_ROLL_TIMEOUT = 30000;

  constructor(io: Server) {
    this.io = io;
    this.roomManager = new RoomManager();
    this.games = new Map();
    this.playerSocketMap = {};
    this.autoRollIntervals = new Map();
  }

  handleConnection(socket: Socket) {
    console.log(`Player connected: ${socket.id}`);

    socket.on('createRoom', (data: { playerName: string; maxPlayers: number }) => {
      this.handleCreateRoom(socket, data);
    });

    socket.on('joinRoom', (data: { roomCode: string; playerName: string; color: PlayerColor }) => {
      this.handleJoinRoom(socket, data);
    });

    socket.on('getAvailableColors', (data: { roomCode: string }) => {
      this.handleGetAvailableColors(socket, data);
    });

    socket.on('playerReady', () => {
      this.handlePlayerReady(socket);
    });

    socket.on('startGame', () => {
      this.handleStartGame(socket);
    });

    socket.on('rollDice', () => {
      this.handleRollDice(socket);
    });

    socket.on('movePiece', (data: { pieceId: string }) => {
      this.handleMovePiece(socket, data);
    });

    socket.on('sendMessage', (data: { content: string }) => {
      this.handleSendMessage(socket, data);
    });

    socket.on('leaveRoom', () => {
      this.handleLeaveRoom(socket);
    });

    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  private handleCreateRoom(socket: Socket, data: { playerName: string; maxPlayers: number }) {
    const { playerName, maxPlayers } = data;
    const room = this.roomManager.createRoom(Math.min(Math.max(maxPlayers, 2), 4));
    const game = new Game();
    
    this.games.set(room.id, game);
    
    const availableColors = this.roomManager.getAvailableColors(room);
    const firstColor = availableColors[0];
    
    const updatedRoom = this.roomManager.addPlayerToRoom(
      room.id,
      socket.id,
      playerName,
      firstColor
    );
    
    if (updatedRoom) {
      game.addPlayer(socket.id, playerName, firstColor);
      
      this.playerSocketMap[socket.id] = {
        playerId: socket.id,
        roomId: room.id
      };
      
      socket.join(room.id);
      
      const roomState = this.getRoomStateWithGame(room.id);
      socket.emit('roomCreated', {
        room: roomState,
        selfPlayerId: socket.id
      });
      
      console.log(`Room created: ${room.roomCode} by player ${socket.id}`);
    }
  }

  private handleJoinRoom(socket: Socket, data: { roomCode: string; playerName: string; color: PlayerColor }) {
    const { roomCode, playerName, color } = data;
    
    const room = this.roomManager.getRoomByCode(roomCode);
    if (!room) {
      socket.emit('error', { message: '房间不存在' });
      return;
    }
    
    if (room.players.size >= room.maxPlayers) {
      socket.emit('error', { message: '房间已满' });
      return;
    }
    
    if (!this.roomManager.getAvailableColors(room).includes(color)) {
      socket.emit('error', { message: '颜色已被占用' });
      return;
    }
    
    const game = this.games.get(room.id);
    if (!game) {
      socket.emit('error', { message: '游戏状态错误' });
      return;
    }
    
    const updatedRoom = this.roomManager.addPlayerToRoom(
      room.id,
      socket.id,
      playerName,
      color
    );
    
    if (updatedRoom) {
      game.addPlayer(socket.id, playerName, color);
      
      this.playerSocketMap[socket.id] = {
        playerId: socket.id,
        roomId: room.id
      };
      
      socket.join(room.id);
      
      const roomState = this.getRoomStateWithGame(room.id);
      socket.emit('roomJoined', {
        room: roomState,
        selfPlayerId: socket.id
      });
      
      this.io.to(room.id).emit('playerJoined', {
        player: {
          id: socket.id,
          name: playerName,
          color,
          status: 'waiting',
          lastActionTime: Date.now()
        }
      });
      
      console.log(`Player ${socket.id} joined room ${roomCode}`);
    }
  }

  private handleGetAvailableColors(socket: Socket, data: { roomCode: string }) {
    const room = this.roomManager.getRoomByCode(data.roomCode);
    if (room) {
      socket.emit('availableColors', {
        colors: this.roomManager.getAvailableColors(room)
      });
    } else {
      socket.emit('availableColors', { colors: [] });
    }
  }

  private handlePlayerReady(socket: Socket) {
    const mapping = this.playerSocketMap[socket.id];
    if (!mapping) return;
    
    const room = this.roomManager.getRoomById(mapping.roomId);
    if (!room) return;
    
    this.roomManager.setPlayerReady(room, socket.id);
    
    this.io.to(mapping.roomId).emit('playerReady', {
      playerId: socket.id
    });
    
    console.log(`Player ${socket.id} is ready`);
  }

  private handleStartGame(socket: Socket) {
    const mapping = this.playerSocketMap[socket.id];
    if (!mapping) return;
    
    const room = this.roomManager.getRoomById(mapping.roomId);
    const game = this.games.get(mapping.roomId);
    
    if (!room || !game) return;
    
    if (!this.roomManager.canStartGame(room)) {
      socket.emit('error', { message: '玩家不足或未准备' });
      return;
    }
    
    game.startGame();
    room.status = 'playing';
    room.currentPlayerId = game.getCurrentPlayerId();
    
    this.syncGameStateToRoom(mapping.roomId);
    
    this.io.to(mapping.roomId).emit('gameStarted', {
      currentPlayerId: room.currentPlayerId
    });
    
    this.startAutoRollTimer(mapping.roomId);
    
    console.log(`Game started in room ${room.roomCode}`);
  }

  private handleRollDice(socket: Socket) {
    const mapping = this.playerSocketMap[socket.id];
    if (!mapping) return;
    
    const room = this.roomManager.getRoomById(mapping.roomId);
    const game = this.games.get(mapping.roomId);
    
    if (!room || !game) return;
    
    if (room.status !== 'playing') {
      socket.emit('error', { message: '游戏未开始' });
      return;
    }
    
    if (room.currentPlayerId !== socket.id) {
      socket.emit('error', { message: '不是你的回合' });
      return;
    }
    
    if (room.currentDiceValue !== null) {
      socket.emit('error', { message: '已掷过骰子，请移动棋子' });
      return;
    }
    
    this.stopAutoRollTimer(mapping.roomId);
    
    const diceValue = game.rollDice();
    room.currentDiceValue = diceValue;
    
    const movablePieces = game.getMovablePieces(socket.id, diceValue);
    
    this.io.to(mapping.roomId).emit('diceRolled', {
      playerId: socket.id,
      diceValue,
      movablePieceIds: movablePieces.map(p => p.id)
    });
    
    this.syncGameStateToRoom(mapping.roomId);
    
    if (movablePieces.length === 0) {
      setTimeout(() => {
        if (diceValue !== 6) {
          game.nextPlayer();
          room.currentPlayerId = game.getCurrentPlayerId();
          room.currentDiceValue = null;
          
          this.io.to(mapping.roomId).emit('turnChanged', {
            currentPlayerId: room.currentPlayerId
          });
          
          this.syncGameStateToRoom(mapping.roomId);
          this.startAutoRollTimer(mapping.roomId);
        } else {
          room.currentDiceValue = null;
          this.startAutoRollTimer(mapping.roomId);
        }
      }, 1000);
    } else {
      this.startAutoRollTimer(mapping.roomId);
    }
    
    console.log(`Player ${socket.id} rolled ${diceValue}`);
  }

  private handleMovePiece(socket: Socket, data: { pieceId: string }) {
    const mapping = this.playerSocketMap[socket.id];
    if (!mapping) return;
    
    const room = this.roomManager.getRoomById(mapping.roomId);
    const game = this.games.get(mapping.roomId);
    
    if (!room || !game) return;
    
    if (room.status !== 'playing') {
      socket.emit('error', { message: '游戏未开始' });
      return;
    }
    
    if (room.currentPlayerId !== socket.id) {
      socket.emit('error', { message: '不是你的回合' });
      return;
    }
    
    if (room.currentDiceValue === null) {
      socket.emit('error', { message: '请先掷骰子' });
      return;
    }
    
    this.stopAutoRollTimer(mapping.roomId);
    
    const result = game.movePiece(socket.id, data.pieceId, room.currentDiceValue);
    
    if (!result.success) {
      const errorMessage = result.errorMessage || '无法移动该棋子';
      socket.emit('error', { message: errorMessage });
      this.startAutoRollTimer(mapping.roomId);
      return;
    }
    
    this.syncGameStateToRoom(mapping.roomId);
    
    if (result.capturedPieces.length > 0) {
      this.io.to(mapping.roomId).emit('piecesCaptured', {
        capturedPieces: result.capturedPieces
      });
    }
    
    if (game.checkGameOver()) {
      const winner = game.getWinner();
      room.status = 'finished';
      
      this.io.to(mapping.roomId).emit('gameOver', {
        winner
      });
      
      this.syncGameStateToRoom(mapping.roomId);
      this.stopAutoRollTimer(mapping.roomId);
      
      console.log(`Game over. Winner: ${winner?.name}`);
      return;
    }
    
    if (!result.canRollAgain) {
      game.nextPlayer();
      room.currentPlayerId = game.getCurrentPlayerId();
      room.currentDiceValue = null;
      
      this.io.to(mapping.roomId).emit('turnChanged', {
        currentPlayerId: room.currentPlayerId
      });
      
      this.syncGameStateToRoom(mapping.roomId);
      this.startAutoRollTimer(mapping.roomId);
    } else {
      room.currentDiceValue = null;
      this.io.to(mapping.roomId).emit('extraTurn', {
        playerId: socket.id
      });
      this.startAutoRollTimer(mapping.roomId);
    }
    
    console.log(`Player ${socket.id} moved piece ${data.pieceId}`);
  }

  private handleSendMessage(socket: Socket, data: { content: string }) {
    const mapping = this.playerSocketMap[socket.id];
    if (!mapping) return;
    
    const message = this.roomManager.addChatMessage(
      mapping.roomId,
      socket.id,
      data.content
    );
    
    if (message) {
      this.io.to(mapping.roomId).emit('newMessage', { message });
    }
  }

  private handleLeaveRoom(socket: Socket) {
    const mapping = this.playerSocketMap[socket.id];
    if (!mapping) return;
    
    const room = this.roomManager.getRoomById(mapping.roomId);
    if (room) {
      this.io.to(mapping.roomId).emit('playerLeft', {
        playerId: socket.id
      });
      
      socket.leave(mapping.roomId);
      
      this.roomManager.removePlayerFromRoom(mapping.roomId, socket.id);
      
      const game = this.games.get(mapping.roomId);
      if (game) {
        game.removePlayer(socket.id);
      }
      
      if (room.currentPlayerId === socket.id && room.status === 'playing') {
        if (game && this.games.has(mapping.roomId)) {
          game.nextPlayer();
          room.currentPlayerId = game.getCurrentPlayerId();
          room.currentDiceValue = null;
          
          this.io.to(mapping.roomId).emit('turnChanged', {
            currentPlayerId: room.currentPlayerId
          });
        }
      }
      
      if (room.players.size === 0) {
        this.games.delete(mapping.roomId);
        this.stopAutoRollTimer(mapping.roomId);
      }
    }
    
    delete this.playerSocketMap[socket.id];
    
    console.log(`Player ${socket.id} left room`);
  }

  private handleDisconnect(socket: Socket) {
    console.log(`Player disconnected: ${socket.id}`);
    this.handleLeaveRoom(socket);
  }

  private syncGameStateToRoom(roomId: string) {
    const room = this.roomManager.getRoomById(roomId);
    const game = this.games.get(roomId);
    
    if (!room || !game) return;
    
    const gamePieces = Array.from(game.getPieces().values());
    room.pieces = new Map(gamePieces.map(p => [p.id, p]));
    
    const roomState = this.getRoomStateWithGame(roomId);
    this.io.to(roomId).emit('gameStateUpdated', {
      room: roomState
    });
  }

  private getRoomStateWithGame(roomId: string) {
    const room = this.roomManager.getRoomById(roomId);
    const game = this.games.get(roomId);
    
    if (!room) return null;
    
    const playersArray = Array.from(room.players.values());
    const piecesArray = game ? Array.from(game.getPieces().values()) : [];
    
    return {
      id: room.id,
      roomCode: room.roomCode,
      players: playersArray,
      pieces: piecesArray,
      status: room.status,
      currentPlayerId: room.currentPlayerId,
      currentDiceValue: room.currentDiceValue,
      chatMessages: room.chatMessages,
      maxPlayers: room.maxPlayers,
      boardConfig: game?.getBoardConfig() || null
    };
  }

  private startAutoRollTimer(roomId: string) {
    this.stopAutoRollTimer(roomId);
    
    const interval = setTimeout(() => {
      this.handleAutoRoll(roomId);
    }, this.AUTO_ROLL_TIMEOUT);
    
    this.autoRollIntervals.set(roomId, interval);
  }

  private stopAutoRollTimer(roomId: string) {
    const interval = this.autoRollIntervals.get(roomId);
    if (interval) {
      clearTimeout(interval);
      this.autoRollIntervals.delete(roomId);
    }
  }

  private handleAutoRoll(roomId: string) {
    const room = this.roomManager.getRoomById(roomId);
    const game = this.games.get(roomId);
    
    if (!room || !game || room.status !== 'playing') return;
    
    const currentPlayerId = room.currentPlayerId;
    if (!currentPlayerId) return;
    
    if (room.currentDiceValue === null) {
      const diceValue = game.rollDice();
      room.currentDiceValue = diceValue;
      
      this.io.to(roomId).emit('diceRolled', {
        playerId: currentPlayerId,
        diceValue,
        movablePieceIds: []
      });
      
      this.io.to(roomId).emit('autoRollNotification', {
        playerId: currentPlayerId,
        diceValue
      });
      
      this.syncGameStateToRoom(roomId);
      
      setTimeout(() => {
        this.autoMoveOrSkip(roomId);
      }, 1000);
    } else {
      this.autoMoveOrSkip(roomId);
    }
  }

  private autoMoveOrSkip(roomId: string) {
    const room = this.roomManager.getRoomById(roomId);
    const game = this.games.get(roomId);
    
    if (!room || !game) return;
    
    const currentPlayerId = room.currentPlayerId;
    if (!currentPlayerId || room.currentDiceValue === null) return;
    
    const movablePieces = game.getMovablePieces(currentPlayerId, room.currentDiceValue);
    
    if (movablePieces.length > 0) {
      const randomPiece = movablePieces[Math.floor(Math.random() * movablePieces.length)];
      const result = game.movePiece(currentPlayerId, randomPiece.id, room.currentDiceValue);
      
      this.io.to(roomId).emit('autoMoveNotification', {
        playerId: currentPlayerId,
        pieceId: randomPiece.id
      });
      
      this.syncGameStateToRoom(roomId);
      
      if (result.capturedPieces.length > 0) {
        this.io.to(roomId).emit('piecesCaptured', {
          capturedPieces: result.capturedPieces
        });
      }
      
      if (game.checkGameOver()) {
        const winner = game.getWinner();
        room.status = 'finished';
        
        this.io.to(roomId).emit('gameOver', {
          winner
        });
        
        this.stopAutoRollTimer(roomId);
        return;
      }
      
      if (!result.canRollAgain) {
        game.nextPlayer();
        room.currentPlayerId = game.getCurrentPlayerId();
        room.currentDiceValue = null;
        
        this.io.to(roomId).emit('turnChanged', {
          currentPlayerId: room.currentPlayerId
        });
        
        this.syncGameStateToRoom(roomId);
        this.startAutoRollTimer(roomId);
      } else {
        room.currentDiceValue = null;
        this.startAutoRollTimer(roomId);
      }
    } else {
      if (room.currentDiceValue !== 6) {
        game.nextPlayer();
        room.currentPlayerId = game.getCurrentPlayerId();
        room.currentDiceValue = null;
        
        this.io.to(roomId).emit('turnChanged', {
          currentPlayerId: room.currentPlayerId
        });
        
        this.syncGameStateToRoom(roomId);
        this.startAutoRollTimer(roomId);
      } else {
        room.currentDiceValue = null;
        this.startAutoRollTimer(roomId);
      }
    }
  }
}
