import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { PlayerColor } from '../types';

const Lobby: React.FC = () => {
  const { createRoom, joinRoom, getAvailableColors, availableColors, error, isConnected } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [selectedColor, setSelectedColor] = useState<PlayerColor | null>(null);
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [maxPlayers, setMaxPlayers] = useState(4);

  const handleCreateRoom = () => {
    if (!playerName.trim()) return;
    createRoom(playerName.trim(), maxPlayers);
  };

  const handleJoinRoom = () => {
    if (!playerName.trim() || !roomCode.trim() || !selectedColor) return;
    joinRoom(roomCode.trim().toUpperCase(), playerName.trim(), selectedColor);
  };

  const handleCheckColors = () => {
    if (roomCode.trim()) {
      getAvailableColors(roomCode.trim().toUpperCase());
    }
  };

  const colorDisplay: Record<PlayerColor, { bg: string; name: string }> = {
    red: { bg: 'bg-red-500', name: '红色' },
    blue: { bg: 'bg-blue-500', name: '蓝色' },
    green: { bg: 'bg-green-500', name: '绿色' },
    yellow: { bg: 'bg-yellow-400', name: '黄色' }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">连接服务器中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full shadow-2xl border border-white/20">
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {mode === 'menu' && (
          <>
            <h1 className="text-4xl font-bold text-white text-center mb-8">
              ✈️ 飞行棋
            </h1>
            <div className="space-y-4">
              <button
                onClick={() => setMode('create')}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-105 shadow-lg"
              >
                创建房间
              </button>
              <button
                onClick={() => setMode('join')}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg"
              >
                加入房间
              </button>
            </div>
          </>
        )}

        {mode === 'create' && (
          <>
            <h2 className="text-2xl font-bold text-white text-center mb-6">
              创建房间
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm mb-2">你的昵称</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="输入昵称..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={10}
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm mb-2">最大玩家数</label>
                <div className="flex gap-2">
                  {[2, 3, 4].map(num => (
                    <button
                      key={num}
                      onClick={() => setMaxPlayers(num)}
                      className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                        maxPlayers === num
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {num} 人
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setMode('menu')}
                  className="flex-1 py-3 px-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                >
                  返回
                </button>
                <button
                  onClick={handleCreateRoom}
                  disabled={!playerName.trim()}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  创建
                </button>
              </div>
            </div>
          </>
        )}

        {mode === 'join' && (
          <>
            <h2 className="text-2xl font-bold text-white text-center mb-6">
              加入房间
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm mb-2">房间码</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value);
                    setSelectedColor(null);
                  }}
                  onBlur={handleCheckColors}
                  placeholder="输入房间码..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  maxLength={6}
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm mb-2">你的昵称</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="输入昵称..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={10}
                />
              </div>
              {roomCode.trim() && (
                <div>
                  <label className="block text-white/80 text-sm mb-2">选择颜色</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(availableColors.length > 0 ? availableColors : (['red', 'blue', 'green', 'yellow'] as PlayerColor[])).map(color => {
                      const isAvailable = availableColors.length === 0 || availableColors.includes(color);
                      return (
                        <button
                          key={color}
                          onClick={() => isAvailable && setSelectedColor(color)}
                          disabled={!isAvailable}
                          className={`p-3 rounded-lg flex flex-col items-center gap-1 transition-all ${
                            selectedColor === color
                              ? 'ring-2 ring-white scale-110'
                              : isAvailable
                              ? 'hover:scale-105'
                              : 'opacity-30 cursor-not-allowed'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full ${colorDisplay[color].bg}`}></div>
                          <span className="text-xs text-white/80">{colorDisplay[color].name}</span>
                        </button>
                      );
                    })}
                  </div>
                  {availableColors.length === 0 && roomCode.trim() && (
                    <p className="text-yellow-400 text-sm mt-2">点击颜色框刷新可用颜色</p>
                  )}
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setMode('menu')}
                  className="flex-1 py-3 px-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                >
                  返回
                </button>
                <button
                  onClick={handleJoinRoom}
                  disabled={!playerName.trim() || !roomCode.trim() || !selectedColor}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  加入
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Lobby;
