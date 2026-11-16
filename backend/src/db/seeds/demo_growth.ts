import { supabase } from '../../config/supabase.js';

export async function seedDemoGrowth(userId = '00000000-0000-0000-0000-000000000001') {
  console.log('[Seed] Seeding demo growth data into Supabase...');

  // 1. Seed Skill Paths
  const pathsData = [
    {
      id: '00000000-0000-0000-0003-000000000001',
      user_id: userId,
      name: 'AI Product Design',
      category: 'Product & Tech',
      level: 'Advanced',
      progress: 65,
      modules: ['Context engineering', 'Human-in-the-loop UX', 'Local-first architecture'],
      status: 'in_progress',
    },
    {
      id: '00000000-0000-0000-0003-000000000002',
      user_id: userId,
      name: 'Endurance Coaching',
      category: 'Sport & Physiology',
      level: 'Practitioner',
      progress: 48,
      modules: ['Zone 2 aerobic base', 'Heart rate variability', 'Periodization for marathon'],
      status: 'in_progress',
    },
    {
      id: '00000000-0000-0000-0003-000000000003',
      user_id: userId,
      name: 'Systems Thinking',
      category: 'Leadership & Strategy',
      level: 'Intermediate',
      progress: 72,
      modules: ['Feedback loops', 'Leverage points', 'Mental models in organizations'],
      status: 'in_progress',
    },
  ];

  // 2. Seed Daily Habits
  const habitsData: any[] = [
    {
      id: '00000000-0000-0000-0003-000000000011',
      user_id: userId,
      title: 'Morning 20m: High-signal reading',
      category: 'Mindset',
      time_of_day: 'Morning',
      duration_mins: 20,
      is_completed_today: true,
      streak_days: 14,
      last_completed_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0003-000000000012',
      user_id: userId,
      title: 'Midday: Zone 2 easy aerobic training',
      category: 'Physical',
      time_of_day: 'Midday',
      duration_mins: 45,
      is_completed_today: true,
      streak_days: 6,
      last_completed_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0003-000000000013',
      user_id: userId,
      title: 'Evening 10m: Reflection without screens',
      category: 'Reflection',
      time_of_day: 'Evening',
      duration_mins: 10,
      is_completed_today: false,
      streak_days: 5,
      last_completed_at: null,
    },
  ];

  // 3. Seed Assessments
  const assessmentsData = [
    {
      id: '00000000-0000-0000-0003-000000000021',
      user_id: userId,
      title: 'Systems Thinking Maturity',
      category: 'Cognitive & Strategy',
      score: 78,
      max_score: 100,
      summary: 'High score in recognizing feedback delays and unintended consequences.',
      strengths: ['Feedback loop identification', 'Second-order consequence mapping', 'Stock & Flow analysis'],
      growth_areas: ['Stochastic modeling in high-entropy markets', 'Organizational boundary resistance'],
    },
    {
      id: '00000000-0000-0000-0003-000000000022',
      user_id: userId,
      title: 'Deep Work & Focus Quotient',
      category: 'Productivity & Habits',
      score: 84,
      max_score: 100,
      summary: 'Exceptional morning block discipline; room for improvement in afternoon context-switching.',
      strengths: ['Morning 90-min uninterrupted blocks', 'Zero notification phone setup'],
      growth_areas: ['Post-lunch energy dip management', 'Synchronous messaging discipline'],
    },
  ];

  // 4. Seed Library Items
  const libraryData = [
    {
      id: '00000000-0000-0000-0003-000000000031',
      user_id: userId,
      title: 'Thinking in Systems',
      author: 'Donella Meadows',
      media_type: 'Book',
      category: 'Systems Thinking',
      reading_status: 'Reading',
      summary: 'Fundamental primer on stocks, flows and systemic leverage points.',
      key_takeaways: [
        'A system is an interconnected set of elements coherently organized in a way that achieves something.',
        'Information holds systems together and plays a great role in determining how they operate.',
        'The highest leverage point is the mindset or paradigm out of which the system arises.',
      ],
    },
    {
      id: '00000000-0000-0000-0003-000000000032',
      user_id: userId,
      title: 'The Great Mental Models Vol. 1',
      author: 'Shane Parrish (Farnam Street)',
      media_type: 'Book',
      category: 'Cognitive Frameworks',
      reading_status: 'Completed',
      summary: 'General thinking concepts including Inversion, First Principles, and Second-Order Thinking.',
      key_takeaways: [
        'First principles thinking cuts through dogma and shared convention.',
        'Invert, always invert: think backward to solve tricky problems.',
        'Hanlon\'s razor: Never attribute to malice that which is adequately explained by carelessness.',
      ],
    },
    {
      id: '00000000-0000-0000-0003-000000000033',
      user_id: userId,
      title: 'The Drive: Zone 2 Training & Longevity',
      author: 'Dr. Peter Attia & Iñigo San-Millán',
      media_type: 'Podcast',
      category: 'Sport & Physiology',
      reading_status: 'Completed',
      summary: 'Mitochondrial health, lactate clearance, and base aerobic capacity building.',
      key_takeaways: [
        'Zone 2 improves mitochondrial efficiency and fat oxidation.',
        'Optimal volume: 3 to 4 hours per week split across sessions.',
      ],
    },
  ];

  try {
    for (const p of pathsData) {
      await supabase.from('growth_skill_paths').upsert(p, { onConflict: 'id' });
    }
    console.log(`✓ Seeded ${pathsData.length} skill pathways`);

    for (const h of habitsData) {
      await supabase.from('growth_habits').upsert(h, { onConflict: 'id' });
    }
    console.log(`✓ Seeded ${habitsData.length} habits`);

    for (const a of assessmentsData) {
      await supabase.from('growth_assessments').upsert(a, { onConflict: 'id' });
    }
    console.log(`✓ Seeded ${assessmentsData.length} assessments`);

    for (const l of libraryData) {
      await supabase.from('growth_library_items').upsert(l, { onConflict: 'id' });
    }
    console.log(`✓ Seeded ${libraryData.length} library items`);

    console.log('[Seed] Demo growth seed completed successfully!');
  } catch (err) {
    console.warn('[Seed] Supabase seed skipped or error (in-memory will be used):', err);
  }
}

if (process.argv[1]?.includes('demo_growth')) {
  seedDemoGrowth();
}

