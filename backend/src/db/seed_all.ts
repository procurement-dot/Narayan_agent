import { db } from './db.js';

export async function seedAllData() {
  console.log('[SeedAll] Verifying and seeding initial data across all modules...');

  // Note: Calendar events are left clean (no dummy data) - real events come from Google Calendar sync, email proposals, or user creation.

  // 2. Seed Notes (if empty)
  try {
    const notesCount = await db.queryOne('SELECT COUNT(*) as count FROM notes');
    if (Number(notesCount?.count || 0) === 0) {
      console.log('[SeedAll] Seeding notes...');
      const momData = {
        summary: 'Reviewed regional qualifier dates, Manjalpur civil milestones, and vendor contracts.',
        decisions: [
          'Confirmed athletics calendar distribution by end of week',
          'Approved Phase 2 civil milestone invoice for Manjalpur project'
        ],
        actions: [
          { task: 'Send updated qualifier calendar to participating schools', assignee: 'Namrata', due: 'Today' },
          { task: 'Follow up with accounts on Vadodara Municipal receivable', assignee: 'Accountant', due: 'Tomorrow' }
        ]
      };

      const notes = [
        ['Q4 Strategic Review & Executive Alignment', 'Detailed discussion on athletics rollout, school packages, and vendor accountability.', 'Work', 'voice_meeting', JSON.stringify(momData), true],
        ['Morning Contemplation & Intentions', 'Keep operational rhythm clear. Focus on high-signal decisions and timely execution.', 'Prayan', 'text', null, true],
        ['Marathon Base Protocol & Recovery', 'Targeting 5:15 pace for weekend long run. Keep hydration strictly above 3L.', 'Health', 'text', null, false],
        ['Bengaluru Inspection & Logistics', 'Indigo 6E-2433 confirmed. Site review at 2:00 PM with sports turf consultant.', 'Travel', 'text', null, false]
      ];

      for (const n of notes) {
        await db.query(
          `INSERT INTO notes (user_id, title, body, area, source_type, mom_data, is_pinned)
           VALUES ('00000000-0000-0000-0000-000000000001', $1, $2, $3, $4, $5, $6)`,
          n
        );
      }
    }
  } catch (err) {
    console.warn('[SeedAll] notes seed skipped:', err);
  }

  // 3. Work Module (Zero Dummy Data - Clean and Auto-Dynamic)
  try {
    // Ensure default external app anchors are configured without dummy metrics
    await db.query(`
      INSERT INTO work_external_apps (user_id, name, app_key, deploy_url, status, summary_metrics, is_active) VALUES
      ('00000000-0000-0000-0000-000000000001', 'SIPS (Infra Project Tracker)', 'infra_tracker', 'https://sips-sports.vercel.app/', 'connected', '{"activeProjects": 0, "onTrack": 0, "delayed": 0, "latestUpdate": "Live portal connected"}'::jsonb, true),
      ('00000000-0000-0000-0000-000000000001', 'Enterprise Operations & Asset Manager', 'second_app', '', 'ready', '{"activeModules": 0, "pendingApprovals": 0, "latestUpdate": "Connect your deployed link to view live pulse"}'::jsonb, true)
      ON CONFLICT (app_key) DO NOTHING
    `);
  } catch (err) {
    console.warn('[SeedAll] work external apps verify skipped:', err);
  }

  // 4. Seed Health Vitals and Goals
  try {
    const vitalsCount = await db.queryOne('SELECT COUNT(*) as count FROM health_vitals');
    if (Number(vitalsCount?.count || 0) === 0) {
      console.log('[SeedAll] Seeding health tables...');
      await db.query(`
        INSERT INTO health_profiles (user_id, person_name, resting_hr_baseline, sleep_target_minutes, hydration_target_liters, recovery_baseline, blood_group)
        VALUES ('00000000-0000-0000-0000-000000000001', 'Self', 52, 450, 3.2, 85, 'O+')
        ON CONFLICT DO NOTHING
      `);

      await db.query(`
        INSERT INTO health_vitals (person_name, log_date, resting_hr, sleep_duration_minutes, recovery_score, steps_count, hydration_liters, energy_level, source)
        VALUES ('Self', CURRENT_DATE, 52, 445, 88, 8420, 3.2, 'Optimal', 'Garmin Forerunner 965')
      `);

      await db.query(`
        INSERT INTO health_goals (user_id, name, date, category, progress, target_metric, current_metric, is_active) VALUES
        ('00000000-0000-0000-0000-000000000001', 'Sub-3:30 Marathon Qualifier', '2027-01-18', 'Endurance', 72, '3h 30m', '3h 38m', true),
        ('00000000-0000-0000-0000-000000000001', 'Resting Heart Rate Under 50 BPM', '2026-12-31', 'Cardio', 85, '< 50 bpm', '52 bpm', true),
        ('00000000-0000-0000-0000-000000000001', 'VO2 Max Target 56', '2027-03-31', 'Aerobic', 60, '56 ml/kg/min', '53 ml/kg/min', true)
      `);

      await db.query(`
        INSERT INTO health_training_sessions (user_id, week_number, day_name, workout, distance, status, scheduled_time, intensity) VALUES
        ('00000000-0000-0000-0000-000000000001', 1, 'Mon', 'Easy Aerobic Base Run', '5 km @ easy conversational pace', 'completed', '06:30', 'Low'),
        ('00000000-0000-0000-0000-000000000001', 1, 'Tue', 'Strength & Core Conditioning', '40 mins bodyweight & stability', 'completed', '07:00', 'Moderate'),
        ('00000000-0000-0000-0000-000000000001', 1, 'Wed', 'Interval Cadence Building', '6 km (5x800m fast strides)', 'today', '06:30', 'High'),
        ('00000000-0000-0000-0000-000000000001', 1, 'Thu', 'Rest & Active Mobility', 'Stretching & foam rolling', 'upcoming', '07:30', 'Recovery'),
        ('00000000-0000-0000-0000-000000000001', 1, 'Fri', 'Tempo Threshold Run', '8 km progressive tempo', 'upcoming', '06:30', 'High'),
        ('00000000-0000-0000-0000-000000000001', 1, 'Sat', 'Aerobic Cross-training', '60 mins cycling or swimming', 'upcoming', '07:00', 'Moderate'),
        ('00000000-0000-0000-0000-000000000001', 1, 'Sun', 'Weekly Long Run', '14 km aerobic endurance run', 'upcoming', '06:00', 'Moderate')
      `);

      await db.query(`
        INSERT INTO health_sports_events (user_id, name, sport, region, date, registered, target_time) VALUES
        ('00000000-0000-0000-0000-000000000001', 'Tata Mumbai Marathon 2027', 'Running', 'India', '2027-01-18', true, '03:28:00'),
        ('00000000-0000-0000-0000-000000000001', 'Vadodara International Marathon', 'Running', 'Local', '2027-02-14', true, '01:38:00')
      `);
    }
  } catch (err) {
    console.warn('[SeedAll] health seed skipped:', err);
  }

  // 5. Seed Finance module (Assets, Loans, Records)
  try {
    const { financeRepository } = await import('../features/finance/finance.repository.js');
    await financeRepository.seedInitialIfEmpty();
  } catch (err) {
    console.warn('[SeedAll] finance seed skipped:', err);
  }

  console.log('[SeedAll] Data initialization complete.');
}
