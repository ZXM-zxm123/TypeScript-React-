import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameContextType, Player, Room, PlayerColor } from '../types';

const GameContext = createContext<GameContextType | undefined>(undefined);

const SERVER_URL = 'http://localhost:3001';

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [selfPlayerId, setSelfPlayerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableColors, setAvailableColors] = useState<PlayerColor[]>([]);
  const [movablePieceIds, setMovablePieceIds] = useState<string[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);

  const isMyTurn = room?.currentPlayerId === selfPlayerId && room?.status === 'playing';

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    const newSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('error', (data: { message: string }) => {
      setError(data.message);
      setTimeout(clearError, 3000);
    });

    newSocket.on('roomCreated', (data: { room: Room; selfPlayerId: string }) => {
      setRoom(data.room);
      setSelfPlayerId(data.selfPlayerId);
      setWinner(null);
    });

    newSocket.on('roomJoined', (data: { room: Room; selfPlayerId: string }) => {
      setRoom(data.room);
      setSelfPlayerId(data.selfPlayerId);
      setWinner(null);
    });

    newSocket.on('availableColors', (data: { colors: PlayerColor[] }) => {
      setAvailableColors(data.colors);
    });

    newSocket.on('playerJoined', (data: { player: Player }) => {
      setRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          players: [...prev.players, data.player]
        };
      });
    });

    newSocket.on('playerLeft', (data: { playerId: string }) => {
      setRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.filter(p => p.id !== data.playerId)
        };
      });
    });

    newSocket.on('playerReady', (data: { playerId: string }) => {
      setRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map(p => 
            p.id === data.playerId ? { ...p, status: 'ready' } : p
          )
        };
      });
    });

    newSocket.on('gameStarted', (data: { currentPlayerId: string }) => {
      setRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'playing',
          currentPlayerId: data.currentPlayerId
        };
      });
    });

    newSocket.on('diceRolled', (data: { 
      playerId: string; 
      diceValue: number;
      movablePieceIds: string[];
    }) => {
      setMovablePieceIds(data.movablePieceIds);
    });

    newSocket.on('turnChanged', (data: { currentPlayerId: string }) => {
      setMovablePieceIds([]);
    });

    newSocket.on('piecesCaptured', (data: { capturedPieces: any[] }) => {
    });

    newSocket.on('extraTurn', (data: { playerId: string }) => {
    });

    newSocket.on('gameOver', (data: { winner: Player }) => {
      setWinner(data.winner);
      setRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'finished'
        };
      });
    });

    newSocket.on('gameStateUpdated', (data: { room: Room }) => {
      setRoom(data.room);
    });

    newSocket.on('newMessage', (data: { message: any }) => {
      setRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          chatMessages: [...prev.chatMessages, data.message]
        };
      });
    });

    newSocket.on('autoRollNotification', (data: { playerId: string; diceValue: number }) => {
    });

    newSocket.on('autoMoveNotification', (data: { playerId: string; pieceId: string }) => {
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [clearError]);

  const createRoom = useCallback((playerName: string, maxPlayers: number) => {
    if (!socket) return;
    socket.emit('createRoom', { playerName, maxPlayers });
  }, [socket]);

  const joinRoom = useCallback((roomCode: string, playerName: string, color: PlayerColor) => {
    if (!socket) return;
    socket.emit('joinRoom', { roomCode, playerName, color });
  }, [socket]);

  const getAvailableColors = useCallback((roomCode: string) => {
    if (!socket) return;
    socket.emit('getAvailableColors', { roomCode });
  }, [socket]);

  const playerReady = useCallback(() => {
    if (!socket) return;
    socket.emit('playerReady');
  }, [socket]);

  const startGame = useCallback(() => {
    if (!socket) return;
    socket.emit('startGame');
  }, [socket]);

  const rollDice = useCallback(() => {
    if (!socket) return;
    socket.emit('rollDice');
  }, [socket]);

  const movePiece = useCallback((pieceId: string) => {
    if (!socket) return;
    socket.emit('movePiece', { pieceId });
  }, [socket]);

  const sendMessage = useCallback((content: string) => {
    if (!socket || !content.trim()) return;
    socket.emit('sendMessage', { content });
  }, [socket]);

  const leaveRoom = useCallback(() => {
    if (!socket) return;
    socket.emit('leaveRoom');
    setRoom(null);
    setSelfPlayerId(null);
    setMovablePieceIds([]);
    setWinner(null);
  }, [socket]);

  const value: GameContextType = {
    socket,
    room,
    selfPlayerId,
    isConnected,
    error,
    createRoom,
    joinRoom,
    getAvailableColors,
    availableColors,
    playerReady,
    startGame,
    rollDice,
    movePiece,
    sendMessage,
    leaveRoom,
    isMyTurn,
    movablePieceIds,
    winner,
    clearError
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
