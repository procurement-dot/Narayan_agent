export type SpaceId =
  | 'today'
  | 'kickstart'
  | 'health'
  | 'inbox'
  | 'email'
  | 'finance'
  | 'work'
  | 'prayan'
  | 'travel'
  | 'spirit'
  | 'growth'
  | 'notes'
  | 'settings';

export interface DockSpaceItem {
  id: SpaceId;
  label: string;
  icon: string;
  color: string;
}

export const DOCK_SPACES: DockSpaceItem[] = [
  { id: 'today', label: 'Calendar', icon: 'clock', color: '#eac2a9' },
  { id: 'email', label: 'Email', icon: 'inbox', color: '#aab8ca' },
  { id: 'finance', label: 'Money', icon: 'wallet', color: '#bed4ae' },
  { id: 'settings', label: 'Settings', icon: 'settings', color: '#d0cfc7' },
];
