export type PeopleTab = 'people' | 'circles' | 'groups' | 'foryou' | 'sync';

export interface Person {
  id: string;
  name: string;
  role: string;
  scope: 'personal' | 'work';
  initial: string;
  note: string;
  cue: string;
  detail: string;
}

export interface ConversationMessage {
  id: string;
  name: string;
  platform: string;
  scope: 'personal' | 'work';
  time: string;
  text: string;
  tag: string;
  reply: string;
}
