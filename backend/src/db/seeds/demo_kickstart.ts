import { supabase } from '../../config/supabase.js';

export async function seedDemoKickstart(userId = '00000000-0000-0000-0000-000000000001') {
  console.log('[Seed] Seeding demo kickstart data into Supabase...');

  // 1. Timeline Items
  const timelineData: any[] = [
    {
      id: '00000000-0000-0000-0005-000000000001',
      user_id: userId,
      time_slot: '07:00',
      title: 'Move with intention',
      detail: 'Zone 2 running or mobility session',
      is_emphasized: false,
      is_completed: true,
      order_index: 1,
    },
    {
      id: '00000000-0000-0000-0005-000000000002',
      user_id: userId,
      time_slot: '08:30',
      title: 'Your day, in motion',
      detail: 'Review top 3 high-leverage outcomes',
      is_emphasized: true,
      is_completed: false,
      order_index: 2,
    },
    {
      id: '00000000-0000-0000-0005-000000000003',
      user_id: userId,
      time_slot: '09:00',
      title: 'World headlines',
      detail: 'Tech and economy synthesis',
      is_emphasized: false,
      is_completed: false,
      order_index: 3,
    },
    {
      id: '00000000-0000-0000-0005-000000000004',
      user_id: userId,
      time_slot: '11:00',
      title: 'Pune weather',
      detail: 'Forecast: 28°C, Clear skies',
      is_emphasized: false,
      is_completed: false,
      order_index: 4,
    },
    {
      id: '00000000-0000-0000-0005-000000000005',
      user_id: userId,
      time_slot: '13:00',
      title: 'One thing worth noticing',
      detail: 'Midday observation & mindfulness',
      is_emphasized: false,
      is_completed: false,
      order_index: 5,
    },
    {
      id: '00000000-0000-0000-0005-000000000006',
      user_id: userId,
      time_slot: '18:00',
      title: 'Slow down and reconnect',
      detail: 'Evening walk & family time',
      is_emphasized: false,
      is_completed: false,
      order_index: 6,
    },
    {
      id: '00000000-0000-0000-0005-000000000007',
      user_id: userId,
      time_slot: '21:00',
      title: 'Reflect',
      detail: 'Journaling without screens',
      is_emphasized: false,
      is_completed: false,
      order_index: 7,
    },
  ];

  // 2. Weather
  const weatherData: any[] = [
    {
      id: '00000000-0000-0000-0005-000000000011',
      city: 'Pune',
      temp_c: 24.0,
      high_temp_c: 31.0,
      low_temp_c: 19.0,
      condition: 'Clear skies',
      humidity_pct: 48,
      aqi: 68,
      aqi_status: 'Moderate / Good',
      running_outlook: 'Pleasant morning conditions for running',
    },
  ];

  // 3. News Items matching prototype feeds
  const newsData: any[] = [
    {
      id: '00000000-0000-0000-0005-000000000021',
      order_num: '01',
      category: 'TECH',
      title: 'On-device privacy · sample',
      detail: 'Modern offline neural agents execute reasoning, calendar synchronization, and health synthesis on device with zero cloud tracking or telemetry.',
      source_name: 'TechCrunch',
    },
    {
      id: '00000000-0000-0000-0005-000000000022',
      order_num: '02',
      category: 'WORLD',
      title: 'AI-assisted science advances · sample',
      detail: 'Global research consortium discovers new clean energy materials, atmospheric modeling platforms, and automated protein discovery structures.',
      source_name: 'Reuters',
    },
    {
      id: '00000000-0000-0000-0005-000000000023',
      order_num: '03',
      category: 'INDIA',
      title: 'Grassroots sport programmes · sample',
      detail: 'National sports authority announces comprehensive youth athlete development programs and state-of-the-art regional facilities across tier-2 cities.',
      source_name: 'The Hindu',
    },
    {
      id: '00000000-0000-0000-0005-000000000024',
      order_num: '04',
      category: 'MAHARASHTRA',
      title: 'State infrastructure & expressways · sample',
      detail: 'Maharashtra cabinet approves accelerated funding for Pune ring road progress, regional industrial corridors, and rapid transit lines.',
      source_name: 'Sakal / The Indian Express',
    },
    {
      id: '00000000-0000-0000-0005-000000000025',
      order_num: '05',
      category: 'SPORTS',
      title: 'Marathon training research · sample',
      detail: 'Athletics and sports science study indicates Zone 2 aerobic base building combined with mobility maximizes race-day recovery efficiency.',
      source_name: 'Sportstar',
    },
    {
      id: '00000000-0000-0000-0005-000000000026',
      order_num: '06',
      category: 'SCIENCE',
      title: 'Sleep and recovery research · sample',
      detail: 'Circadian rhythm synchronization and deep non-REM rest patterns proven essential for sustained cognitive clarity, executive performance, and stress resilience.',
      source_name: 'Science Digest',
    },
  ];

  // 4. Astro & Mindset
  const astroData: any[] = [
    {
      id: '00000000-0000-0000-0005-000000000031',
      order_num: '01',
      title: 'Astrology perspective',
      detail: 'Gentle reflection and steady discernment',
      perspective: 'Gentle reflection',
      today_focus: 'Clear focus in execution',
      monthly_outlook: 'Deepen relationships & unhurried time',
      moon_phase: 'Waxing phase · creative momentum',
    },
    {
      id: '00000000-0000-0000-0005-000000000032',
      order_num: '02',
      title: 'Today',
      detail: 'Clear focus in execution and deliberate pace',
      perspective: 'Gentle reflection',
      today_focus: 'Clear focus in execution',
      monthly_outlook: 'Deepen relationships & unhurried time',
      moon_phase: 'Waxing phase · creative momentum',
    },
    {
      id: '00000000-0000-0000-0005-000000000033',
      order_num: '03',
      title: 'This month',
      detail: 'Deepen relationships & unhurried time for craft',
      perspective: 'Gentle reflection',
      today_focus: 'Clear focus in execution',
      monthly_outlook: 'Deepen relationships & unhurried time',
      moon_phase: 'Waxing phase · creative momentum',
    },
    {
      id: '00000000-0000-0000-0005-000000000034',
      order_num: '04',
      title: 'Sun + Moon reflection',
      detail: 'Waxing phase · creative momentum and structured energy',
      perspective: 'Gentle reflection',
      today_focus: 'Clear focus in execution',
      monthly_outlook: 'Deepen relationships & unhurried time',
      moon_phase: 'Waxing phase · creative momentum',
    },
  ];

  // 5. Audio Brief
  const audioBriefData: any[] = [
    {
      id: '00000000-0000-0000-0005-000000000041',
      title: 'Morning 3-minute synthesis',
      summary: 'Summary of meetings, news and weather.',
      duration_seconds: 180,
      audio_url: 'https://nryn-assets.local/audio/morning_brief.mp3',
    },
  ];

  try {
    for (const t of timelineData) {
      await supabase.from('kickstart_timeline').upsert(t, { onConflict: 'id' });
    }
    console.log(`✓ Seeded ${timelineData.length} timeline items`);

    for (const w of weatherData) {
      await supabase.from('kickstart_weather').upsert(w, { onConflict: 'id' });
    }
    console.log(`✓ Seeded weather data`);

    for (const n of newsData) {
      await supabase.from('kickstart_news').upsert(n, { onConflict: 'id' });
    }
    console.log(`✓ Seeded ${newsData.length} news items`);

    for (const a of astroData) {
      await supabase.from('kickstart_astro').upsert(a, { onConflict: 'id' });
    }
    console.log(`✓ Seeded ${astroData.length} astro items`);

    for (const b of audioBriefData) {
      await supabase.from('kickstart_audio_brief').upsert(b, { onConflict: 'id' });
    }
    console.log(`✓ Seeded audio brief data`);

    console.log('[Seed] Demo kickstart seed completed successfully!');
  } catch (err) {
    console.warn('[Seed] Supabase seed skipped or error (in-memory will be used):', err);
  }
}

if (process.argv[1]?.includes('demo_kickstart')) {
  seedDemoKickstart();
}
