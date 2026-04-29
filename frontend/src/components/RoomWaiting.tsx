import React from 'react';
import { useGame } from '../context/GameContext';
import { Player, PlayerColor } from '../types';

const RoomWaiting: React.FC = () => {
  const { room, selfPlayerId, playerReady, startGame, leaveRoom, error } = useGame();

  if (!room) return null;

  const colorDisplay: Record<PlayerColor, { bg: string; name: string }> = {
    red: { bg: 'bg-red-500', name: '红色' },
    blue: { bg: 'bg-blue-500', name: '蓝色' },
    green: { bg: 'bg-green-500', name: '绿色' },
    yellow: { bg: 'bg-yellow-400', name: '黄色' }
  };

  const selfPlayer = room.players.find(p => p.id === selfPlayerId);
  const isSelfReady = selfPlayer?.status === 'ready';
  const canStart = room.players.filter(p => p.status === 'ready').length >= 2;
  const isHost = room.players[0]?.id === selfPlayerId;

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.roomCode).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-white/20">
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">等待房间</h2>
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
            <span className="text-white/70">房间码:</span>
            <span className="text-white font-mono text-xl font-bold tracking-wider">{room.roomCode}</span>
            <button
              onClick={copyRoomCode}
              className="text-white/70 hover:text-white transition-colors"
              title="复制房间码"
            >
              📋
            </button>
          </div>
          <p className="text-white/60 text-sm mt-2">
            {room.players.length}/{room.maxPlayers} 名玩家
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <h3 className="text-white/80 text-sm font-semibold mb-2">玩家列表</h3>
          {room.players.map((player: Player, index: number) => (
            <div
              key={player.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                player.id === selfPlayerId
                  ? 'bg-white/20 ring-2 ring-white/50'
                  : 'bg-white/5'
              }`}
            >
              <div className={`w-10 h-10 rounded-full ${colorDisplay[player.color].bg} flex items-center justify-center text-white font-bold shadow-lg`}>
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">{player.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white/70">
                    {colorDisplay[player.color].name}
                  </span>
                  {player.id === selfPlayerId && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200">
                      你
                    </span>
                  )}
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                player.status === 'ready'
                  ? 'bg-green-500/30 text-green-300'
                  : 'bg-white/10 text-white/50'
              }`}>
                {player.status === 'ready' ? '已准备' : '等待中'}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={leaveRoom}
            className="flex-1 py-3 px-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all font-medium"
          >
            离开房间
          </button>
          {!isSelfReady ? (
            <button
              onClick={playerReady}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all"
            >
              准备
            </button>
          ) : isHost ? (
            <button
              onClick={startGame}
              disabled={!canStart}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              开始游戏
            </button>
          ) : (
            <button
              disabled
              className="flex-1 py-3 px-4 bg-green-500/50 text-white/70 rounded-lg font-semibold cursor-not-allowed"
            >
              已准备
            </button>
          )}
        </div>

        {isHost && !canStart && (
          <p className="text-yellow-300/80 text-sm text-center mt-4">
            需要至少 2 名准备好的玩家才能开始游戏
          </p>
        )}
      </div>
    </div>
  );
};

export default RoomWaiting;
