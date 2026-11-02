import { IntegrationConnection } from './settings.types';

export const INTEGRATION_CONNECTIONS: IntegrationConnection[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    desc: 'Email summaries, drafts, extracted commitments',
    connected: false,
    type: 'oauth',
  },
  {
    id: 'wa_personal',
    name: 'WhatsApp · Personal',
    desc: 'Opt-in selected family chats',
    connected: false,
    type: 'system',
  },
  {
    id: 'wa_business',
    name: 'WhatsApp · Business',
    desc: 'Separate work conversations and partner threads',
    connected: false,
    type: 'system',
  },
  {
    id: 'calendar',
    name: 'Google Calendar',
    desc: 'Meeting and task two-way sync',
    connected: false,
    type: 'oauth',
  },
  {
    id: 'garmin',
    name: 'Garmin / Health Connect',
    desc: 'Running, heart rate, sleep and recovery vitals',
    connected: false,
    type: 'oauth',
  },
  {
    id: 'banking',
    name: 'Banking / Investments',
    desc: 'Read-only financial summaries (Account Aggregator)',
    connected: false,
    type: 'system',
  },
  {
    id: 'news',
    name: 'News / IMD Weather',
    desc: 'Trusted public weather and news feeds',
    connected: true,
    type: 'local',
  },
];
