import React from 'react';
import { useGame } from '../context/GameContext';
import GameBoard from './GameBoard';
import Dice from './Dice';
import Chat from './Chat';
import { Player, PlayerColor } from '../types';

const GameRoom: React.FC = () => {
  const { room, selfPlayerId, leaveRoom, winner } = useGame();

  if (!room) return null;

  const colorMap: Record<PlayerColor, string> = {
    red: '#EF4444',
    blue: '#3B82F6',
    green: '#22C55E',
    yellow: '#EAB308'
  };

  const selfPlayer = room.players.find(p => p.id === selfPlayerId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 p-4">
      {winner && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-8 text-center shadow-2xl transform animate-bounce">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-3xl font-bold text-white mb-2">游戏结束！</h2>
            <p className="text-xl text-white/90 mb-4">
              <span className="font-bold">{winner.name}</span> 获胜！
            </p>
            <div 
              className="inline-block w-12 h-12 rounded-full mb-6"
              style={{ backgroundColor: colorMap[winner.color] }}
            />
            <div className="flex gap-3 justify-center">
              <button
                onClick={leaveRoom}
                className="px-6 py-3 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-all"
              >
                离开房间
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">✈️ 飞行棋</h1>
            <div className="bg-white/10 rounded-lg px-3 py-1">
              <span className="text-white/70 text-sm">房间码: </span>
              <span className="text-white font-mono font-bold">{room.roomCode}</span>
            </div>
          </div>
          <button
            onClick={leaveRoom}
            className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all text-sm"
          >
            离开房间
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
              <h3 className="text-white/80 text-sm font-semibold mb-3">玩家</h3>
              <div className="space-y-2">
                {room.players.map((player: Player) => (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                      player.id === room.currentPlayerId
                        ? 'bg-white/10 ring-2 ring-yellow-400/50'
                        : player.id === selfPlayerId
                        ? 'bg-white/10'
                        : 'bg-white/5'
                    }`}
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: colorMap[player.color] }}
                    >
                      {player.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium truncate">
                          {player.name}
                        </span>
                        {player.id === selfPlayerId && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-300">
                            你
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-white/50">
                        {player.id === room.currentPlayerId ? '当前回合' : '等待中'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
              <h3 className="text-white/80 text-sm font-semibold mb-3">骰子</h3>
              <div className="flex justify-center">
                <Dice />
              </div>
            </div>

            <div className="mt-4 bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
              <h3 className="text-white/80 text-sm font-semibold mb-2">规则提示</h3>
              <ul className="text-xs text-white/60 space-y-1">
                <li>• 掷出 6 可起飞或再掷一次</li>
                <li>• 踩到对方棋子使其回基地</li>
                <li>• ★ 位置为安全格</li>
                <li>• 连续 30 秒无操作自动掷骰子</li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10 h-full flex items-center justify-center">
              <GameBoard />
            </div>
          </div>

          <div className="lg:col-span-1">
            <Chat />
            
            <div className="mt-4 bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
              <h3 className="text-white/80 text-sm font-semibold mb-2">棋子状态</h3>
              {selfPlayer && room.pieces && (
                <div className="space-y-1">
                  {(() => {
                    const selfPieces = room.pieces.filter(p => p.color === selfPlayer.color);
                    const atBase = selfPieces.filter(p => p.isAtBase).length;
                    const onTrack = selfPieces.filter(p => !p.isAtBase && !p.isAtFinish && !p.isOnHomeTrack).length;
                    const onHomeTrack = selfPieces.filter(p => p.isOnHomeTrack).length;
                    const finished = selfPieces.filter(p => p.isAtFinish).length;
                    
                    return (
                      <>
                        <div className="flex justify-between text-xs text-white/70">
                          <span>基地中:</span>
                          <span>{atBase}/4</span>
                        </div>
                        <div className="flex justify-between text-xs text-white/70">
                          <span>轨道上:</span>
                          <span>{onTrack}/4</span>
                        </div>
                        <div className="flex justify-between text-xs text-white/70">
                          <span>回家路:</span>
                          <span>{onHomeTrack}/4</span>
                        </div>
                        <div className="flex justify-between text-xs text-green-400">
                          <span>已到达:</span>
                          <span>{finished}/4</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
