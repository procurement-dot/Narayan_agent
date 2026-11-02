import { create } from 'zustand';
import { AiModelChoice, IntegrationConnection } from './settings.types';
import { INTEGRATION_CONNECTIONS } from './settings.mock';

interface SettingsState {
  connections: IntegrationConnection[];
  selectedModel: AiModelChoice;
  usagePeriod: 'daily' | 'monthly';
  tokensUsed: number;
  costInr: number;
  setModel: (model: AiModelChoice) => void;
  setUsagePeriod: (period: 'daily' | 'monthly') => void;
  toggleConnection: (id: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  connections: INTEGRATION_CONNECTIONS,
  selectedModel: 'GPT-6 · Instant',
  usagePeriod: 'daily',
  tokensUsed: 0,
  costInr: 0,

  setModel: (selectedModel) => set({ selectedModel }),
  setUsagePeriod: (usagePeriod) => set({ usagePeriod }),
  toggleConnection: (id) =>
    set((state) => ({
      connections: state.connections.map((c) =>
        c.id === id ? { ...c, connected: !c.connected } : c
      ),
    })),
}));
