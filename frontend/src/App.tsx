import React from 'react';
import { useGame } from './context/GameContext';
import Lobby from './components/Lobby';
import RoomWaiting from './components/RoomWaiting';
import GameRoom from './components/GameRoom';

const App: React.FC = () => {
  const { room, error, clearError } = useGame();

  return (
    <div className="min-h-screen">
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <span>⚠️</span>
            <span>{error}</span>
            <button
              onClick={clearError}
              className="ml-4 hover:text-red-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {!room ? (
        <Lobby />
      ) : room.status === 'waiting' ? (
        <RoomWaiting />
      ) : (
        <GameRoom />
      )}
    </div>
  );
};

export default App;
