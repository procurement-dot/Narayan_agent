import { create } from 'zustand';
import { ConversationMessage, PeopleTab, Person } from './people.types';
import { CONVERSATION_MESSAGES, PEOPLE_MOCK } from './people.mock';

interface PeopleState {
  currentTab: PeopleTab;
  people: Person[];
  messages: ConversationMessage[];
  selectedPerson: Person | null;
  selectedMessage: ConversationMessage | null;
  setTab: (tab: PeopleTab) => void;
  selectPerson: (p: Person | null) => void;
  selectMessage: (m: ConversationMessage | null) => void;
}

export const usePeopleStore = create<PeopleState>((set) => ({
  currentTab: 'people',
  people: PEOPLE_MOCK,
  messages: CONVERSATION_MESSAGES,
  selectedPerson: null,
  selectedMessage: null,

  setTab: (tab) => set({ currentTab: tab }),
  selectPerson: (selectedPerson) => set({ selectedPerson }),
  selectMessage: (selectedMessage) => set({ selectedMessage }),
}));
