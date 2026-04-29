import React, { useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { Piece, PlayerColor, BoardConfig, Player } from '../types';

interface PieceOnBoard {
  piece: Piece;
  x: number;
  y: number;
  isMovable: boolean;
}

const GameBoard: React.FC = () => {
  const { room, movePiece, movablePieceIds } = useGame();

  if (!room || !room.boardConfig) return null;

  const { boardConfig, pieces, players, currentPlayerId } = room;

  const colorStyles: Record<PlayerColor, { main: string; light: string; dark: string }> = {
    red: { main: '#EF4444', light: '#FECACA', dark: '#991B1B' },
    blue: { main: '#3B82F6', light: '#BFDBFE', dark: '#1E3A8A' },
    green: { main: '#22C55E', light: '#BBF7D0', dark: '#14532D' },
    yellow: { main: '#EAB308', light: '#FEF08A', dark: '#713F12' }
  };

  const colorMap: Record<PlayerColor, string> = {
    red: '#EF4444',
    blue: '#3B82F6',
    green: '#22C55E',
    yellow: '#EAB308'
  };

  const getBasePosition = (color: PlayerColor, pieceIndex: number): { x: number; y: number } => {
    const baseLayouts: Record<PlayerColor, { x: number; y: number }[]> = {
      red: [
        { x: 1.5, y: 1.5 },
        { x: 3.5, y: 1.5 },
        { x: 1.5, y: 3.5 },
        { x: 3.5, y: 3.5 }
      ],
      blue: [
        { x: 10.5, y: 1.5 },
        { x: 12.5, y: 1.5 },
        { x: 10.5, y: 3.5 },
        { x: 12.5, y: 3.5 }
      ],
      green: [
        { x: 10.5, y: 10.5 },
        { x: 12.5, y: 10.5 },
        { x: 10.5, y: 12.5 },
        { x: 12.5, y: 12.5 }
      ],
      yellow: [
        { x: 1.5, y: 10.5 },
        { x: 3.5, y: 10.5 },
        { x: 1.5, y: 12.5 },
        { x: 3.5, y: 12.5 }
      ]
    };
    return baseLayouts[color][pieceIndex];
  };

  const getTrackPosition = useMemo(() => {
    const positions: { x: number; y: number }[] = [];
    
    for (let i = 0; i < 6; i++) positions.push({ x: 4 + i, y: 5 });
    for (let i = 0; i < 6; i++) positions.push({ x: 9, y: 5 + i });
    for (let i = 0; i < 6; i++) positions.push({ x: 9 - i, y: 9 });
    for (let i = 0; i < 6; i++) positions.push({ x: 5, y: 9 - i });
    for (let i = 0; i < 6; i++) positions.push({ x: 5 + i, y: 5 });
    
    for (let i = 13; i < 26; i++) {
      const basePos = positions[i - 13];
      positions.push({ x: 14 - basePos.x, y: basePos.y });
    }
    
    for (let i = 26; i < 39; i++) {
      const basePos = positions[i - 26];
      positions.push({ x: 14 - basePos.x, y: 14 - basePos.y });
    }
    
    for (let i = 39; i < 52; i++) {
      const basePos = positions[i - 39];
      positions.push({ x: basePos.x, y: 14 - basePos.y });
    }
    
    return positions;
  }, []);

  const getHomeTrackPosition = (color: PlayerColor, position: number): { x: number; y: number } => {
    const starts: Record<PlayerColor, { x: number; y: number; dx: number; dy: number }> = {
      red: { x: 5, y: 6, dx: 1, dy: 0 },
      blue: { x: 8, y: 5, dx: 0, dy: 1 },
      green: { x: 9, y: 8, dx: -1, dy: 0 },
      yellow: { x: 6, y: 9, dx: 0, dy: -1 }
    };
    
    const start = starts[color];
    return {
      x: start.x + start.dx * position,
      y: start.y + start.dy * position
    };
  };

  const getFinishPosition = (): { x: number; y: number } => {
    return { x: 7, y: 7 };
  };

  const piecesOnBoard = useMemo((): PieceOnBoard[] => {
    const result: PieceOnBoard[] = [];
    const colorPieceCount: Record<PlayerColor, number> = { red: 0, blue: 0, green: 0, yellow: 0 };

    pieces.forEach(piece => {
      let x: number, y: number;
      const isMovable = movablePieceIds.includes(piece.id);

      if (piece.isAtBase) {
        const pieceIndex = colorPieceCount[piece.color]++;
        const pos = getBasePosition(piece.color, pieceIndex);
        x = pos.x;
        y = pos.y;
      } else if (piece.isAtFinish) {
        const pos = getFinishPosition();
        x = pos.x;
        y = pos.y;
      } else if (piece.isOnHomeTrack) {
        const pos = getHomeTrackPosition(piece.color, piece.position);
        x = pos.x;
        y = pos.y;
      } else {
        const pos = getTrackPosition[piece.position];
        x = pos.x;
        y = pos.y;
      }

      result.push({ piece, x, y, isMovable });
    });

    return result;
  }, [pieces, movablePieceIds, getTrackPosition]);

  const handlePieceClick = (pieceOnBoard: PieceOnBoard) => {
    if (pieceOnBoard.isMovable) {
      movePiece(pieceOnBoard.piece.id);
    }
  };

  const safePositions = new Set(boardConfig.safePositions);

  const renderBase = (color: PlayerColor, x: number, y: number) => {
    const style = colorStyles[color];
    return (
      <g key={`base-${color}`}>
        <rect
          x={x}
          y={y}
          width={5}
          height={5}
          fill={style.light}
          stroke={style.dark}
          strokeWidth={0.2}
        />
        <rect
          x={x + 0.5}
          y={y + 0.5}
          width={4}
          height={4}
          fill={style.main}
          stroke={style.dark}
          strokeWidth={0.15}
        />
        <circle
          cx={x + 2.5}
          cy={y + 2.5}
          r={1}
          fill={style.light}
          stroke={style.dark}
          strokeWidth={0.1}
        />
      </g>
    );
  };

  const renderHomeTrack = (color: PlayerColor, startX: number, startY: number, isHorizontal: boolean) => {
    const style = colorStyles[color];
    return (
      <g key={`home-${color}`}>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <rect
            key={i}
            x={isHorizontal ? startX + i : startX}
            y={isHorizontal ? startY : startY + i}
            width={1}
            height={1}
            fill={style.light}
            stroke={style.main}
            strokeWidth={0.05}
          />
        ))}
      </g>
    );
  };

  const renderMainTrack = () => {
    const cells: JSX.Element[] = [];
    
    for (let i = 0; i < 52; i++) {
      const pos = getTrackPosition[i];
      const isSafe = safePositions.has(i);
      
      let fill = '#F5F5F5';
      let stroke = '#D1D5DB';
      
      const colorPositions: Record<PlayerColor, number[]> = {
        red: [1, 2, 3, 4, 5],
        blue: [14, 15, 16, 17, 18],
        green: [27, 28, 29, 30, 31],
        yellow: [40, 41, 42, 43, 44]
      };
      
      for (const [color, positions] of Object.entries(colorPositions)) {
        if (positions.includes(i)) {
          fill = colorStyles[color as PlayerColor].light;
          stroke = colorStyles[color as PlayerColor].main;
        }
      }
      
      if (isSafe) {
        stroke = '#F59E0B';
      }
      
      cells.push(
        <rect
          key={i}
          x={pos.x}
          y={pos.y}
          width={1}
          height={1}
          fill={fill}
          stroke={stroke}
          strokeWidth={0.05}
        />
      );
      
      if (isSafe) {
        cells.push(
          <text
            key={`safe-${i}`}
            x={pos.x + 0.5}
            y={pos.y + 0.7}
            textAnchor="middle"
            fontSize={0.4}
            fill="#F59E0B"
          >
            ★
          </text>
        );
      }
    }
    
    return <g key="main-track">{cells}</g>;
  };

  const renderCenter = () => {
    return (
      <g key="center">
        <polygon
          points="7,5 9,7 7,9 5,7"
          fill="#FFF"
          stroke="#9CA3AF"
          strokeWidth={0.1}
        />
        <polygon
          points="5,7 7,5 7,7"
          fill={colorStyles.red.main}
        />
        <polygon
          points="7,5 9,7 7,7"
          fill={colorStyles.blue.main}
        />
        <polygon
          points="9,7 7,9 7,7"
          fill={colorStyles.green.main}
        />
        <polygon
          points="7,9 5,7 7,7"
          fill={colorStyles.yellow.main}
        />
      </g>
    );
  };

  const renderPieces = () => {
    const positionGroups: Record<string, PieceOnBoard[]> = {};
    
    piecesOnBoard.forEach(pob => {
      const key = `${pob.x}-${pob.y}`;
      if (!positionGroups[key]) {
        positionGroups[key] = [];
      }
      positionGroups[key].push(pob);
    });

    return (
      <g key="pieces">
        {Object.entries(positionGroups).map(([key, group]) => {
          const baseX = group[0].x;
          const baseY = group[0].y;
          
          const offsets = [
            { dx: 0, dy: 0 },
            { dx: 0.3, dy: 0 },
            { dx: 0, dy: 0.3 },
            { dx: 0.3, dy: 0.3 }
          ];
          
          return group.map((pob, i) => {
            const offset = offsets[i];
            const color = colorMap[pob.piece.color];
            const opacity = pob.isMovable ? 1 : 0.8;
            const strokeWidth = pob.isMovable ? 0.15 : 0.05;
            const stroke = pob.isMovable ? '#000' : '#666';
            
            return (
              <g
                key={pob.piece.id}
                onClick={() => handlePieceClick(pob)}
                style={{ cursor: pob.isMovable ? 'pointer' : 'default' }}
              >
                <circle
                  cx={baseX + 0.35 + offset.dx}
                  cy={baseY + 0.35 + offset.dy}
                  r={0.28}
                  fill={color}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  opacity={opacity}
                />
                <circle
                  cx={baseX + 0.35 + offset.dx}
                  cy={baseY + 0.35 + offset.dy}
                  r={0.15}
                  fill="rgba(255,255,255,0.4)"
                />
                {pob.isMovable && (
                  <circle
                    cx={baseX + 0.35 + offset.dx}
                    cy={baseY + 0.35 + offset.dy}
                    r={0.35}
                    fill="none"
                    stroke="#FFD700"
                    strokeWidth={0.08}
                    strokeDasharray="0.15 0.08"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      values="0;0.23"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            );
          });
        })}
      </g>
    );
  };

  const currentPlayer = players.find(p => p.id === currentPlayerId);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      <div className="flex-1 flex flex-col items-center">
        <div className="mb-4 text-center">
          {currentPlayer && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: colorMap[currentPlayer.color] }}
              />
              <span className="text-white font-semibold">
                {currentPlayer.name} 的回合
              </span>
            </div>
          )}
        </div>
        
        <div className="w-full max-w-xl aspect-square">
          <svg viewBox="0 0 15 15" className="w-full h-full drop-shadow-2xl">
            <rect x={0} y={0} width={15} height={15} fill="#E5E7EB" rx={0.3} />
            
            {renderBase('red', 0, 0)}
            {renderBase('blue', 10, 0)}
            {renderBase('green', 10, 10)}
            {renderBase('yellow', 0, 10)}
            
            {renderHomeTrack('red', 5, 6, true)}
            {renderHomeTrack('blue', 8, 5, false)}
            {renderHomeTrack('green', 9, 8, true)}
            {renderHomeTrack('yellow', 6, 9, false)}
            
            {renderMainTrack()}
            {renderCenter()}
            {renderPieces()}
          </svg>
        </div>
        
        <div className="mt-4 text-center text-white/60 text-sm">
          房间码: {room.roomCode}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
