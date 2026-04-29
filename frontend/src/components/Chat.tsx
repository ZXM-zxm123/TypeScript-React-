import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';

const Chat: React.FC = () => {
  const { room, sendMessage, selfPlayerId } = useGame();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room?.chatMessages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!room) return null;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-80 bg-white/10 backdrop-blur rounded-xl overflow-hidden border border-white/20">
      <div className="px-4 py-2 bg-white/10 border-b border-white/10">
        <h3 className="text-white font-semibold">💬 聊天</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {room.chatMessages.length === 0 ? (
          <div className="text-white/40 text-center text-sm py-8">
            暂无消息
          </div>
        ) : (
          room.chatMessages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.playerId === selfPlayerId ? 'items-end' : 'items-start'
              }`}
            >
              <div className={`flex items-center gap-2 mb-1 ${
                msg.playerId === selfPlayerId ? 'flex-row-reverse' : ''
              }`}>
                <span className="text-xs text-white/60">{msg.playerName}</span>
                <span className="text-xs text-white/40">{formatTime(msg.timestamp)}</span>
              </div>
              <div
                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  msg.playerId === selfPlayerId
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-white/20 text-white rounded-bl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            maxLength={100}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
