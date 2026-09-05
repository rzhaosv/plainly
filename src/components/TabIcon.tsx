import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

export type TabIconName = 'tables' | 'people' | 'pairs' | 'chats' | 'you';

export default function TabIcon({ name, color, size = 24 }: { name: TabIconName; color: string; size?: number }) {
  const sw = 1.9;
  switch (name) {
    case 'tables':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x={3.5} y={9} width={17} height={4} rx={1.5} stroke={color} strokeWidth={sw} />
          <Line x1={7} y1={13} x2={6} y2={19} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={17} y1={13} x2={18} y2={19} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Circle cx={8.5} cy={5.5} r={1.6} stroke={color} strokeWidth={sw} />
          <Circle cx={15.5} cy={5.5} r={1.6} stroke={color} strokeWidth={sw} />
        </Svg>
      );
    case 'people':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={8} r={3.6} stroke={color} strokeWidth={sw} />
          <Path d="M4.5 20c.8-4 4-6 7.5-6s6.7 2 7.5 6" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'pairs':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={8.5} cy={8.5} r={3} stroke={color} strokeWidth={sw} />
          <Circle cx={15.5} cy={8.5} r={3} stroke={color} strokeWidth={sw} />
          <Path d="M2.5 19.5c.6-3.2 3-5 6-5 1.3 0 2.5.3 3.5 1 1-.7 2.2-1 3.5-1 3 0 5.4 1.8 6 5" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'chats':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V16H6.5A2.5 2.5 0 0 1 4 13.5z" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
          <Line x1={8} y1={9} x2={16} y2={9} stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <Line x1={8} y1={12.5} x2={13} y2={12.5} stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'you':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x={4} y={4} width={16} height={16} rx={5} stroke={color} strokeWidth={sw} />
          <Circle cx={12} cy={10.5} r={2.6} stroke={color} strokeWidth={sw} />
          <Path d="M7.5 17.5c.9-2 2.5-3 4.5-3s3.6 1 4.5 3" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
  }
}
