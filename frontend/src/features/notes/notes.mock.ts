import { NoteItem } from './notes.types';

export const INITIAL_NOTES: NoteItem[] = [
  {
    id: 'n-voice-1',
    title: '🎙️ Manjalpur Sports School Partnership',
    body: 'Full minutes and decisions recorded via voice meeting assistant.',
    area: 'Work',
    date: 'Today · 2 Nov 2026',
    source: 'Voice Meeting (32 mins)',
    source_type: 'voice_meeting',
    is_pinned: true,
    transcript: 'Partner meeting regarding building wing lease, 5-year terms and athletic programs.',
    mom_data: {
      summary: 'Discussed land lease terms with trustees, academic affiliation guidelines, and sports infrastructure funding roadmap.',
      decisions: [
        'Agreed to 5-year lease term with 8% escalation clause.',
        'Primary building wing reserved strictly for athletic coaching facilities.'
      ],
      actions: [
        { task: 'Send revised agreement draft to legal team', assignee: 'Abhijit', due: 'Nov 5' },
        { task: 'Finalize structural fire safety NOC with architect', assignee: 'Self', due: 'Nov 7' }
      ]
    }
  },
  {
    id: 'n1',
    title: 'Manjalpur academic partnership clause',
    body: 'Clarify school entity agreement, rent clause and revised floor areas before Friday council.',
    area: 'Work',
    date: '28 Oct 2026',
    source: 'Meeting · sample',
    source_type: 'text',
  },
  {
    id: 'n2',
    title: 'Prayan asked about robots',
    body: 'Find a beginner-friendly maker workshop and visit with him.',
    area: 'Prayan',
    date: '27 Oct 2026',
    source: 'Conversation · sample',
    source_type: 'text',
  },
  {
    id: 'n3',
    title: 'Long-run recovery',
    body: 'Hydrate, prepare post-run protein, confirm sleep quality.',
    area: 'Health',
    date: '26 Oct 2026',
    source: 'Voice note · sample',
    source_type: 'text',
  },
  {
    id: 'n4',
    title: 'Winter family travel',
    body: 'Check passports, visas and Pune-Delhi fare alert.',
    area: 'Travel',
    date: '25 Oct 2026',
    source: 'Email · sample',
    source_type: 'text',
  },
];
