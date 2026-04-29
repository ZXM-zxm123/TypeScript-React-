import React from 'react';
import { useGame } from '../context/GameContext';

const Dice: React.FC = () => {
  const { room, isMyTurn, rollDice, currentDiceValue, movablePieceIds } = useGame();

  if (!room || room.status !== 'playing') return null;

  const hasRolled = currentDiceValue !== null;
  const hasMovablePieces = movablePieceIds.length > 0;
  const canRoll = isMyTurn && !hasRolled;

  const diceFaces = [
    [<div key="center" className="w-3 h-3 bg-white rounded-full" />],
    [
      <div key="top" className="w-3 h-3 bg-white rounded-full" />,
      <div key="bottom" className="w-3 h-3 bg-white rounded-full" />
    ],
    [
      <div key="top" className="w-3 h-3 bg-white rounded-full" />,
      <div key="center" className="w-3 h-3 bg-white rounded-full" />,
      <div key="bottom" className="w-3 h-3 bg-white rounded-full" />
    ],
    [
      <div key="top-left" className="w-3 h-3 bg-white rounded-full" />,
      <div key="top-right" className="w-3 h-3 bg-white rounded-full" />,
      <div key="bottom-left" className="w-3 h-3 bg-white rounded-full" />,
      <div key="bottom-right" className="w-3 h-3 bg-white rounded-full" />
    ],
    [
      <div key="top-left" className="w-3 h-3 bg-white rounded-full" />,
      <div key="top-right" className="w-3 h-3 bg-white rounded-full" />,
      <div key="center" className="w-3 h-3 bg-white rounded-full" />,
      <div key="bottom-left" className="w-3 h-3 bg-white rounded-full" />,
      <div key="bottom-right" className="w-3 h-3 bg-white rounded-full" />
    ],
    [
      <div key="top-left" className="w-3 h-3 bg-white rounded-full" />,
      <div key="top-right" className="w-3 h-3 bg-white rounded-full" />,
      <div key="middle-left" className="w-3 h-3 bg-white rounded-full" />,
      <div key="middle-right" className="w-3 h-3 bg-white rounded-full" />,
      <div key="bottom-left" className="w-3 h-3 bg-white rounded-full" />,
      <div key="bottom-right" className="w-3 h-3 bg-white rounded-full" />
    ]
  ];

  const getDiceFace = (value: number | null) => {
    if (value === null) {
      return <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">?</div>;
    }
    
    const faces = diceFaces[value - 1];
    
    return (
      <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-2 shadow-lg grid grid-cols-3 gap-1">
        {value === 1 && (
          <>
            <div />
            <div />
            <div />
            <div />
            <div className="w-3 h-3 bg-white rounded-full self-center justify-self-center" />
            <div />
            <div />
            <div />
            <div />
          </>
        )}
        {value === 2 && (
          <>
            <div />
            <div />
            <div className="w-3 h-3 bg-white rounded-full self-end justify-self-end" />
            <div />
            <div />
            <div />
            <div className="w-3 h-3 bg-white rounded-full self-start justify-self-start" />
            <div />
            <div />
          </>
        )}
        {value === 3 && (
          <>
            <div />
            <div />
            <div className="w-3 h-3 bg-white rounded-full self-end justify-self-end" />
            <div />
            <div className="w-3 h-3 bg-white rounded-full self-center justify-self-center" />
            <div />
            <div className="w-3 h-3 bg-white rounded-full self-start justify-self-start" />
            <div />
            <div />
          </>
        )}
        {value === 4 && (
          <>
            <div className="w-3 h-3 bg-white rounded-full self-end justify-self-start" />
            <div />
            <div className="w-3 h-3 bg-white rounded-full self-end justify-self-end" />
            <div />
            <div />
            <div />
            <div className="w-3 h-3 bg-white rounded-full self-start justify-self-start" />
            <div />
            <div className="w-3 h-3 bg-white rounded-full self-start justify-self-end" />
          </>
        )}
        {value === 5 && (
          <>
            <div className="w-3 h-3 bg-white rounded-full self-end justify-self-start" />
            <div />
            <div className="w-3 h-3 bg-white rounded-full self-end justify-self-end" />
            <div />
            <div className="w-3 h-3 bg-white rounded-full self-center justify-self-center" />
            <div />
            <div className="w-3 h-3 bg-white rounded-full self-start justify-self-start" />
            <div />
            <div className="w-3 h-3 bg-white rounded-full self-start justify-self-end" />
          </>
        )}
        {value === 6 && (
          <>
            <div className="w-3 h-3 bg-white rounded-full self-center justify-self-start" />
            <div />
            <div className="w-3 h-3 bg-white rounded-full self-center justify-self-end" />
            <div className="w-3 h-3 bg-white rounded-full self-center justify-self-start" />
            <div />
            <div className="w-3 h-3 bg-white rounded-full self-center justify-self-end" />
            <div className="w-3 h-3 bg-white rounded-full self-center justify-self-start" />
            <div />
            <div className="w-3 h-3 bg-white rounded-full self-center justify-self-end" />
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="transform transition-transform hover:scale-110">
        {getDiceFace(currentDiceValue)}
      </div>
      
      {canRoll ? (
        <button
          onClick={rollDice}
          className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg font-bold shadow-lg hover:from-yellow-500 hover:to-orange-600 transition-all transform hover:scale-105 active:scale-95"
        >
          掷骰子
        </button>
      ) : hasRolled && hasMovablePieces ? (
        <div className="text-white/80 text-sm text-center">
          点击闪烁的棋子移动
        </div>
      ) : hasRolled && !hasMovablePieces ? (
        <div className="text-yellow-300/80 text-sm text-center">
          没有可移动的棋子
        </div>
      ) : (
        <div className="text-white/50 text-sm">等待其他玩家...</div>
      )}
    </div>
  );
};

export default Dice;
