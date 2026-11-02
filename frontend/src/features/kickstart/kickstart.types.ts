export type KickstartTab = 'today' | 'weather' | 'news' | 'astro';

export interface KickstartItem {
  id: string;
  num: string;
  title: string;
  detail?: string;
  emph?: boolean;
}
