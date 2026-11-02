import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 22,
  color = '#384b40',
  strokeWidth = 1.65,
}) => {
  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'clock':
      return (
        <Svg {...commonProps}>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M12 7v5l3 2" />
        </Svg>
      );
    case 'sun':
      return (
        <Svg {...commonProps}>
          <Circle cx="12" cy="12" r="4" />
          <Path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
        </Svg>
      );
    case 'activity':
      return (
        <Svg {...commonProps}>
          <Path d="M3 12h4l3-8 4 16 3-8h4" />
        </Svg>
      );
    case 'chat':
    case 'users':
      return (
        <Svg {...commonProps}>
          <Path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.9 8.9 0 0 1-4-.9L3 21l1.9-5.2A8.9 8.9 0 0 1 4 11.5a8.5 8.5 0 0 1 17 0Z" />
        </Svg>
      );
    case 'inbox':
    case 'mail':
      return (
        <Svg {...commonProps}>
          <Rect x="3" y="4" width="18" height="16" rx="3" />
          <Path d="M3 13h5l2 3h4l2-3h5" />
        </Svg>
      );
    case 'wallet':
      return (
        <Svg {...commonProps}>
          <Rect x="2" y="5" width="20" height="16" rx="3" />
          <Path d="M2 9h20M16 15h3" />
        </Svg>
      );
    case 'briefcase':
      return (
        <Svg {...commonProps}>
          <Rect x="3" y="7" width="18" height="14" rx="2" />
          <Path d="M9 7V4h6v3M3 13h18" />
        </Svg>
      );
    case 'trend':
    case 'smile':
      return (
        <Svg {...commonProps}>
          <Path d="m3 17 6-6 4 4 8-8M15 7h6v6" />
        </Svg>
      );
    case 'arrow':
    case 'compass':
      return (
        <Svg {...commonProps}>
          <Path d="M4 12h16m-6-6 6 6-6 6" />
        </Svg>
      );
    case 'leaf':
    case 'feather':
      return (
        <Svg {...commonProps}>
          <Path d="M20 4C9 4 4 10 4 16a4 4 0 0 0 4 4c6 0 12-5 12-16ZM4 20c3-5 6-8 12-11" />
        </Svg>
      );
    case 'note':
    case 'file-text':
      return (
        <Svg {...commonProps}>
          <Path d="M5 3h11l4 4v14H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM16 3v5h5M8 12h8M8 16h8" />
        </Svg>
      );
    case 'settings':
      return (
        <Svg {...commonProps}>
          <Circle cx="12" cy="12" r="3" />
          <Path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.5-2.3 1a8 8 0 0 0-2-1.2L14.2 3H9.8l-.4 2.6a8 8 0 0 0-2 1.2l-2.3-1-2 3.5 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.5 2.3-1a8 8 0 0 0 2 1.2l.4 2.6h4.4l.4-2.6a8 8 0 0 0 2-1.2l2.3 1 2-3.5-2-1.5c.1-.4.1-.8.1-1.2Z" />
        </Svg>
      );
    case 'spark':
      return (
        <Svg {...commonProps}>
          <Path d="m12 2 1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2ZM19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8L19 17Z" />
        </Svg>
      );
    case 'menu':
      return (
        <Svg {...commonProps}>
          <Path d="M4 7h16M4 12h16M4 17h16" />
        </Svg>
      );
    case 'search':
      return (
        <Svg {...commonProps}>
          <Circle cx="11" cy="11" r="7" />
          <Path d="m16 16 5 5" />
        </Svg>
      );
    default:
      return (
        <Svg {...commonProps}>
          <Circle cx="12" cy="12" r="4" />
        </Svg>
      );
  }
};
