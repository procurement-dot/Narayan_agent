import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'nryn';
  text: string;
  timestamp: string;
}

interface ChatState {
  messages: ChatMessage[];
  inputText: string;
  setInputText: (text: string) => void;
  sendMessage: (text: string) => void;
  clearMessages: () => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm-init',
    sender: 'nryn',
    text: 'What needs your attention? I can help with your day, training, people or plans.',
    timestamp: '09:00',
  },
];

export const useChatStore = create<ChatState>((set, get) => ({
  messages: INITIAL_MESSAGES,
  inputText: '',
  setInputText: (text) => set({ inputText: text }),

  sendMessage: (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      inputText: '',
    }));

    // Simulated NRYN response
    setTimeout(() => {
      let reply = "I've noted that. I can connect this across your calendar and notes.";
      const lower = trimmed.toLowerCase();
      if (lower.includes('email') || lower.includes('mail')) {
        reply = 'You have 3 requests needing attention in your Email space. 2 are high priority actions.';
      } else if (lower.includes('health') || lower.includes('marathon')) {
        reply = 'Your 12-week marathon build is 72% on track. Next key milestone is on 13 Dec 2026.';
      } else if (lower.includes('today') || lower.includes('day')) {
        reply = 'Next up on your day: AKC season planning at 10:00, followed by a quiet pause at 11:40.';
      }

      const botMsg: ChatMessage = {
        id: `n-${Date.now()}`,
        sender: 'nryn',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      set((state) => ({
        messages: [...state.messages, botMsg],
      }));
    }, 600);
  },

  clearMessages: () => set({ messages: INITIAL_MESSAGES }),
}));
