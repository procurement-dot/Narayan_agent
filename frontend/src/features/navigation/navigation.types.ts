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
  { id: 'kickstart', label: 'Kickstart', icon: 'sun', color: '#c6d5d1' },
  { id: 'health', label: 'Health', icon: 'activity', color: '#bf9c86' },
  { id: 'inbox', label: 'People', icon: 'chat', color: '#8bbbaa' },
  { id: 'email', label: 'Email', icon: 'inbox', color: '#aab8ca' },
  { id: 'finance', label: 'Money', icon: 'wallet', color: '#bed4ae' },
  { id: 'work', label: 'Work', icon: 'briefcase', color: '#a1c1cc' },
  { id: 'prayan', label: 'Prayan', icon: 'trend', color: '#ddb59c' },
  { id: 'travel', label: 'Travel', icon: 'arrow', color: '#aebdc8' },
  { id: 'spirit', label: 'Spirituality', icon: 'leaf', color: '#b9cdb6' },
  { id: 'growth', label: 'Better Me', icon: 'sun', color: '#e8c680' },
  { id: 'notes', label: 'Notes', icon: 'note', color: '#deb5aa' },
  { id: 'settings', label: 'Settings', icon: 'settings', color: '#d0cfc7' },
];
