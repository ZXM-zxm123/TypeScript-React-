import { PlayerColor } from '../types';

export const colorMap: Record<PlayerColor, string> = {
  red: '#FF4444',
  blue: '#4444FF',
  green: '#44AA44',
  yellow: '#FFCC00'
};

export const colorNameMap: Record<PlayerColor, string> = {
  red: '红色',
  blue: '蓝色',
  green: '绿色',
  yellow: '黄色'
};

export const getColorClass = (color: PlayerColor): string => {
  return `bg-${color}-500`;
};

export const getBorderColorClass = (color: PlayerColor): string => {
  return `border-${color}-500`;
};
