export interface IntegrationConnection {
  id: string;
  name: string;
  desc: string;
  connected: boolean;
  type: 'oauth' | 'system' | 'local';
}

export type AiModelChoice =
  | 'GPT-6 · Instant'
  | 'GPT-6 · Medium'
  | 'GPT-6 · High'
  | 'Local on-device model';
