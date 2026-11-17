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

  // 3. Seed Work Projects, Tasks, Invoices, Deals, Team Ops, EA Signals
  try {
    const projCount = await db.queryOne('SELECT COUNT(*) as count FROM work_projects');
    if (Number(projCount?.count || 0) === 0) {
      console.log('[SeedAll] Seeding work module tables...');
      
      // Projects
      const p1 = await db.queryOne(
        `INSERT INTO work_projects (user_id, name, subtitle, tag, progress, next_action, owner, budget, status)
         VALUES ('00000000-0000-0000-0000-000000000001', 'AKC Regional Season Planning', 'School partnerships & district tournament calendar', 'Sports Education', 65, 'Finalize school schedule', 'Narayan', '₹18.5 L', 'active')
         RETURNING id`
      );
      if (p1) {
        await db.query(`INSERT INTO work_project_tasks (project_id, title, is_completed, sort_order) VALUES
          ($1, 'Draft regional tournament rules & guidelines', true, 1),
          ($1, 'Distribute invite letters to partner schools', true, 2),
          ($1, 'Confirm stadium booking with municipal authorities', false, 3)`, [p1.id]);
      }

      const p2 = await db.queryOne(
        `INSERT INTO work_projects (user_id, name, subtitle, tag, progress, next_action, owner, budget, status)
         VALUES ('00000000-0000-0000-0000-000000000001', 'Manjalpur Sports Complex Infrastructure', 'Phase 2 turf installation, lighting & contractor milestones', 'Civil Infra', 40, 'Contractor site inspection', 'Narayan', '₹45 L', 'active')
         RETURNING id`
      );
      if (p2) {
        await db.query(`INSERT INTO work_project_tasks (project_id, title, is_completed, sort_order) VALUES
          ($1, 'Complete sub-base civil grading', true, 1),
          ($1, 'Turf roll inspection & drainage testing', false, 2),
          ($1, 'High-mast LED floodlight installation', false, 3)`, [p2.id]);
      }

      // Invoices
      await db.query(`
        INSERT INTO work_invoices (user_id, invoice_number, client_name, vertical, amount, amount_numeric, due_date, status) VALUES
        ('00000000-0000-0000-0000-000000000001', 'INV-2026-088', 'Delhi Public School', 'School programmes', '₹3,40,000', 340000, CURRENT_DATE + INTERVAL '7 days', 'pending'),
        ('00000000-0000-0000-0000-000000000001', 'INV-2026-074', 'Gujarat State Athletics Association', 'Events', '₹5,20,000', 520000, CURRENT_DATE - INTERVAL '3 days', 'overdue'),
        ('00000000-0000-0000-0000-000000000001', 'INV-2026-061', 'Vadodara Municipal Corp', 'Govt projects', '₹12,80,000', 1280000, CURRENT_DATE - INTERVAL '15 days', 'paid')
      `);

      // Deals
      await db.query(`
        INSERT INTO work_deals (user_id, client_name, deal_value, deal_value_numeric, stage, contact_person, next_action) VALUES
        ('00000000-0000-0000-0000-000000000001', 'St. Xavier''s Athletic Curriculum', '₹8.5 L', 850000, 'proposal', 'Fr. Thomas', 'Send customized proposal'),
        ('00000000-0000-0000-0000-000000000001', 'National Games Logistics & Equipment', '₹24 L', 2400000, 'negotiation', 'Sports Ministry Sec.', 'Executive review meeting'),
        ('00000000-0000-0000-0000-000000000001', 'Baroda High School Annual Package', '₹6.2 L', 620000, 'demo', 'Principal Joshi', 'Demonstration session for PT teachers')
      `);

      // Team Ops
      await db.query(`
        INSERT INTO work_team_ops (user_id, log_date, total_staff, present_count, open_vacancies, training_due, tickets)
        VALUES ('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 24, 22, 3, 5, '[{"id":"tk-1","title":"Coach certification renewal","priority":"medium","assignedTo":"HR Operations"},{"id":"tk-2","title":"Ground staff overtime approval","priority":"high","assignedTo":"Field Admin"}]'::jsonb)
      `);

      // EA Signals
      await db.query(`
        INSERT INTO work_ea_signals (user_id, title, description, source, category, priority, is_resolved) VALUES
        ('00000000-0000-0000-0000-000000000001', 'Vendor Milestone Clearance Required', 'Civil contractor submitted Phase 2 completion certificate for Manjalpur project.', 'Email', 'decision', 'high', false),
        ('00000000-0000-0000-0000-000000000001', 'Quarterly GST 3B Compliance Review', 'Accounts team flagged draft reconciliation for Q3 filings.', 'System', 'review', 'medium', false)
      `);

      // External Apps
      await db.query(`
        INSERT INTO work_external_apps (user_id, name, app_key, deploy_url, status, summary_metrics, is_active) VALUES
        ('00000000-0000-0000-0000-000000000001', 'Infra Project Tracker', 'infra_tracker', 'https://infra-tracker.onrender.com', 'connected', '{"activeProjects": 3, "onTrack": 2, "delayed": 1, "latestUpdate": "Site grading completed on sector 4"}'::jsonb, true),
        ('00000000-0000-0000-0000-000000000001', 'Enterprise Operations & Asset Manager', 'second_app', 'https://ops-manager.onrender.com', 'connected', '{"activeModules": 8, "pendingApprovals": 2, "latestUpdate": "Inventory audited for 12 centers"}'::jsonb, true)
        ON CONFLICT (app_key) DO NOTHING
      `);
    }
  } catch (err) {
    console.warn('[SeedAll] work seed skipped:', err);
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

  console.log('[SeedAll] Data initialization complete.');
}
