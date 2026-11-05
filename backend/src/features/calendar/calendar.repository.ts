import { db } from '../../db/db.js';
import { CreateCalendarEventDto, UpdateCalendarEventDto } from './calendar.dto.js';

export const calendarRepository = {
  async getEventsByDate(userId: string, dateStr: string) {
    const events: any[] = [];
    const seenEventKeys = new Set<string>();

    const addEventSafely = (eventObj: any) => {
      const key = `${(eventObj.title || '').trim().toLowerCase()}_${eventObj.start_time}`;
      if (!seenEventKeys.has(key)) {
        seenEventKeys.add(key);
        events.push(eventObj);
      }
    };

    // 1. calendar_events table (Directly created blocks & synced Google Calendar events)
    const calEvents = await db.query(
      `SELECT * FROM calendar_events 
       WHERE user_id = $1 AND date = $2 AND status != 'cancelled'
       ORDER BY start_time ASC`,
      [userId, dateStr]
    );

    const existingProposalIds = new Set<string>();

    for (const e of calEvents) {
      if (e.source_proposal_id) existingProposalIds.add(e.source_proposal_id);
      addEventSafely({
        id: e.id,
        user_id: e.user_id,
        date: e.date,
        start_time: e.start_time,
        end_time: e.end_time,
        title: e.title,
        subtitle: e.subtitle || '',
        detail: e.detail || '',
        cat: e.cat || 'peach',
        kind: e.kind || 'work',
        source: e.source || 'local',
        google_event_id: e.google_event_id,
        source_proposal_id: e.source_proposal_id,
        status: e.status || 'active',
        created_at: e.created_at,
      });
    }

    // 2. tasks table (Approved proposals / tasks)
    try {
      const tasks = await db.query(
        `SELECT t.*, p.evidence, p.context 
         FROM tasks t
         LEFT JOIN proposals p ON p.id = t.source_proposal_id
         WHERE t.user_id = $1 AND t.date = $2
         ORDER BY t.start_time ASC`,
        [userId, dateStr]
      );

      for (const t of tasks) {
        if (t.source_proposal_id) existingProposalIds.add(t.source_proposal_id);
        addEventSafely({
          id: t.id,
          user_id: t.user_id,
          date: t.date,
          start_time: t.start_time,
          end_time: t.end_time,
          title: t.title,
          subtitle: t.detail ? t.detail.slice(0, 50) : 'Action from Email proposal',
          detail: t.detail || '',
          cat: 'purple',
          kind: 'work',
          source: 'email_proposal',
          source_proposal_id: t.source_proposal_id,
          status: 'active',
          created_at: t.created_at,
        });
      }
    } catch (tErr) {
      console.warn('[CalendarRepo] Tasks query skipped:', tErr);
    }

    // 3. proposals table (Inbound AI-detected Meetings & Task proposals from Email / Notes)
    const handledEmailIds = new Set<string>();

    try {
      const proposals = await db.query(
        `SELECT p.*, e.from_name, e.from_email, e.subject as email_subject, e.received_at
         FROM proposals p
         LEFT JOIN emails e ON e.id = p.email_id
         WHERE (p.user_id = $1 OR p.user_id = '00000000-0000-0000-0000-000000000000')
           AND p.status != 'dismissed'
           AND (
             p.created_at::date = $2::date
             OR (e.received_at IS NOT NULL AND e.received_at::date = $2::date)
           )`,
        [userId, dateStr]
      );

      for (const p of proposals) {
        if (p.email_id) handledEmailIds.add(p.email_id);
        if (existingProposalIds.has(p.id)) continue;
        const isMeeting = p.type === 'meeting';
        addEventSafely({
          id: `prop-${p.id}`,
          user_id: p.user_id,
          date: dateStr,
          start_time: p.start_time || (isMeeting ? '14:00' : '15:00'),
          end_time: p.end_time || (isMeeting ? '14:45' : '15:30'),
          title: p.title,
          subtitle: isMeeting
            ? (p.from_name ? `Meeting with ${p.from_name}` : (p.context ? `Meeting · ${p.context}` : 'Inbound meeting request'))
            : (p.from_name ? `Action requested by ${p.from_name}` : 'Email action proposal'),
          detail: (p.detail || '') + (p.evidence ? `\n\nQuoted Evidence: "${p.evidence}"` : ''),
          cat: isMeeting ? 'peach' : 'purple',
          kind: 'work',
          source: isMeeting ? 'email_meeting' : 'email_proposal',
          source_proposal_id: p.id,
          status: 'active',
          created_at: p.created_at,
        });
      }
    } catch (pErr) {
      console.warn('[CalendarRepo] Proposals query skipped:', pErr);
    }

    // 4. emails table (Inbound Emails marked as 'meeting' not already covered by a proposal)
    try {
      const meetingEmails = await db.query(
        `SELECT e.*
         FROM emails e
         JOIN email_accounts a ON a.id = e.account_id
         WHERE a.user_id = $1
           AND e.kind = 'meeting'
           AND (e.is_archived IS FALSE OR e.is_archived IS NULL)
           AND e.id NOT IN (SELECT email_id FROM proposals WHERE email_id IS NOT NULL)
           AND e.received_at::date = $2::date`,
        [userId, dateStr]
      );

      for (const me of meetingEmails) {
        if (handledEmailIds.has(me.id)) continue;
        addEventSafely({
          id: `email-mtg-${me.id}`,
          user_id: userId,
          date: dateStr,
          start_time: '15:00',
          end_time: '15:45',
          title: me.subject || 'Meeting Request',
          subtitle: `Meeting invitation from ${me.from_name || me.from_email}`,
          detail: `From: ${me.from_name} <${me.from_email}>\n\n${me.preview || (me.content ? me.content.slice(0, 200) : '')}`,
          cat: 'peach',
          kind: 'work',
          source: 'email_meeting',
          status: 'active',
          created_at: me.received_at,
        });
      }
    } catch (meErr) {
      console.warn('[CalendarRepo] Meeting emails query skipped:', meErr);
    }

    // 5. notes table (Voice Meetings with MoM & Action items)
    try {
      const notes = await db.query(
        `SELECT n.*
         FROM notes n
         WHERE (n.user_id = $1 OR n.user_id = '00000000-0000-0000-0000-000000000000')
           AND n.created_at::date = $2::date`,
        [userId, dateStr]
      );

      for (const n of notes) {
        if (n.source_type === 'voice_meeting' || (n.mom_data && n.mom_data.summary)) {
          addEventSafely({
            id: `note-mom-${n.id}`,
            user_id: userId,
            date: dateStr,
            start_time: '11:00',
            end_time: '11:45',
            title: n.title,
            subtitle: `Meeting MoM · ${n.area} (${n.mom_data?.actions?.length || 0} action items)`,
            detail: n.mom_data?.summary || n.body || '',
            cat: 'green',
            kind: 'work',
            source: 'notes_mom',
            status: 'active',
            created_at: n.created_at,
          });

          // Also plot specific action items if present
          if (Array.isArray(n.mom_data?.actions)) {
            n.mom_data.actions.forEach((act: any, idx: number) => {
              if (act?.task) {
                addEventSafely({
                  id: `note-act-${n.id}-${idx}`,
                  user_id: userId,
                  date: dateStr,
                  start_time: '16:00',
                  end_time: '16:30',
                  title: act.task,
                  subtitle: `MoM Action · ${act.assignee || 'Self'} (Due: ${act.due || 'Today'})`,
                  detail: `Context from meeting note: "${n.title}"`,
                  cat: 'purple',
                  kind: 'work',
                  source: 'notes_action',
                  status: 'active',
                  created_at: n.created_at,
                });
              }
            });
          }
        }
      }
    } catch (nErr) {
      console.warn('[CalendarRepo] Notes query skipped:', nErr);
    }

    // 6. health_sports_events table (Sports sessions, marathons, health events)
    try {
      const sports = await db.query(
        `SELECT * FROM health_sports_events WHERE date = $1`,
        [dateStr]
      );
      for (const s of sports) {
        addEventSafely({
          id: `sport-${s.id}`,
          user_id: userId,
          date: dateStr,
          start_time: '07:00',
          end_time: '08:00',
          title: s.name,
          subtitle: `Sports Event · ${s.sport} (${s.region})`,
          detail: `Target: ${s.target_time || 'N/A'} · Registered: ${s.registered ? 'Yes' : 'Pending'}`,
          cat: 'green',
          kind: 'health',
          source: 'health_event',
          status: 'active',
          created_at: s.created_at,
        });
      }
    } catch (sErr) {
      // Ignore if table not created
    }

    // Sort chronologically by start_time
    events.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    return events;
  },

  async getMonthCounts(userId: string, year: number, month: number) {
    const padMonth = String(month).padStart(2, '0');
    const startPattern = `${year}-${padMonth}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endPattern = `${year}-${padMonth}-${String(lastDay).padStart(2, '0')}`;

    const counts: Record<string, number> = {};

    const incrementCount = (d: string, amount = 1) => {
      const key = d.split('T')[0];
      counts[key] = (counts[key] || 0) + amount;
    };

    try {
      const rows = await db.query(
        `SELECT date::text as day, COUNT(*) as count 
         FROM calendar_events 
         WHERE user_id = $1 AND date >= $2 AND date <= $3 AND status != 'cancelled'
         GROUP BY date`,
        [userId, startPattern, endPattern]
      );
      for (const r of rows) incrementCount(r.day, Number(r.count || 0));
    } catch (e) {
      console.warn('[CalendarRepo] getMonthCounts calEvents error:', e);
    }

    try {
      const taskRows = await db.query(
        `SELECT date::text as day, COUNT(*) as count 
         FROM tasks 
         WHERE user_id = $1 AND date >= $2 AND date <= $3
         GROUP BY date`,
        [userId, startPattern, endPattern]
      );
      for (const r of taskRows) incrementCount(r.day, Number(r.count || 0));
    } catch (e) {
      console.warn('[CalendarRepo] getMonthCounts taskRows error:', e);
    }

    try {
      const proposalRows = await db.query(
        `SELECT created_at::date::text as day, COUNT(*) as count
         FROM proposals
         WHERE (user_id = $1 OR user_id = '00000000-0000-0000-0000-000000000000')
           AND status != 'dismissed'
           AND created_at::date >= $2::date AND created_at::date <= $3::date
         GROUP BY created_at::date`,
        [userId, startPattern, endPattern]
      );
      for (const r of proposalRows) incrementCount(r.day, Number(r.count || 0));
    } catch (e) {
      // Ignore
    }

    try {
      const emailRows = await db.query(
        `SELECT e.received_at::date::text as day, COUNT(*) as count
         FROM emails e
         JOIN email_accounts a ON a.id = e.account_id
         WHERE a.user_id = $1 AND e.kind = 'meeting'
           AND (e.is_archived IS FALSE OR e.is_archived IS NULL)
           AND e.id NOT IN (SELECT email_id FROM proposals WHERE email_id IS NOT NULL)
           AND e.received_at::date >= $2::date AND e.received_at::date <= $3::date
         GROUP BY e.received_at::date`,
        [userId, startPattern, endPattern]
      );
      for (const r of emailRows) incrementCount(r.day, Number(r.count || 0));
    } catch (e) {
      // Ignore
    }

    try {
      const notesRows = await db.query(
        `SELECT created_at::date::text as day, COUNT(*) as count
         FROM notes
         WHERE (user_id = $1 OR user_id = '00000000-0000-0000-0000-000000000000')
           AND (source_type = 'voice_meeting' OR mom_data IS NOT NULL)
           AND created_at::date >= $2::date AND created_at::date <= $3::date
         GROUP BY created_at::date`,
        [userId, startPattern, endPattern]
      );
      for (const r of notesRows) incrementCount(r.day, Number(r.count || 0));
    } catch (e) {
      // Ignore
    }

    return counts;
  },

  async getEventById(userId: string, eventId: string) {
    return db.queryOne(
      `SELECT * FROM calendar_events WHERE id = $1 AND user_id = $2`,
      [eventId, userId]
    );
  },

  async createEvent(
    userId: string,
    event: CreateCalendarEventDto,
    options?: { source?: string; googleEventId?: string; sourceProposalId?: string }
  ) {
    return db.queryOne(
      `INSERT INTO calendar_events (
         user_id, date, start_time, end_time, title, subtitle, detail, cat, kind,
         source, google_event_id, source_proposal_id, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active')
       RETURNING *`,
      [
        userId,
        event.date || new Date().toISOString().split('T')[0],
        event.start,
        event.end,
        event.title,
        event.subtitle || '',
        event.detail || '',
        event.cat || 'peach',
        event.kind || 'work',
        options?.source || 'local',
        options?.googleEventId || null,
        options?.sourceProposalId || null,
      ]
    );
  },

  async updateEvent(userId: string, eventId: string, updates: UpdateCalendarEventDto) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(updates.title);
    }
    if (updates.subtitle !== undefined) {
      fields.push(`subtitle = $${idx++}`);
      values.push(updates.subtitle);
    }
    if (updates.start !== undefined) {
      fields.push(`start_time = $${idx++}`);
      values.push(updates.start);
    }
    if (updates.end !== undefined) {
      fields.push(`end_time = $${idx++}`);
      values.push(updates.end);
    }
    if (updates.date !== undefined) {
      fields.push(`date = $${idx++}`);
      values.push(updates.date);
    }
    if (updates.cat !== undefined) {
      fields.push(`cat = $${idx++}`);
      values.push(updates.cat);
    }
    if (updates.kind !== undefined) {
      fields.push(`kind = $${idx++}`);
      values.push(updates.kind);
    }
    if (updates.detail !== undefined) {
      fields.push(`detail = $${idx++}`);
      values.push(updates.detail);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(updates.status);
    }

    if (fields.length === 0) {
      return this.getEventById(userId, eventId);
    }

    fields.push(`updated_at = NOW()`);
    values.push(eventId, userId);

    return db.queryOne(
      `UPDATE calendar_events 
       SET ${fields.join(', ')} 
       WHERE id = $${idx++} AND user_id = $${idx++} 
       RETURNING *`,
      values
    );
  },

  async deleteEvent(userId: string, eventId: string) {
    return db.queryOne(
      `DELETE FROM calendar_events 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [eventId, userId]
    );
  },

  async upsertGoogleEvent(
    userId: string,
    event: {
      googleEventId: string;
      title: string;
      detail?: string;
      date: string;
      start: string;
      end: string;
    }
  ) {
    const existing = await db.queryOne(
      `SELECT id FROM calendar_events 
       WHERE user_id = $1 AND google_event_id = $2`,
      [userId, event.googleEventId]
    );

    if (existing) {
      return db.queryOne(
        `UPDATE calendar_events 
         SET title = $1, detail = $2, date = $3, start_time = $4, end_time = $5, updated_at = NOW() 
         WHERE id = $6 
         RETURNING *`,
        [event.title, event.detail || '', event.date, event.start, event.end, existing.id]
      );
    }

    return db.queryOne(
      `INSERT INTO calendar_events (
         user_id, date, start_time, end_time, title, subtitle, detail, cat, kind, source, google_event_id, status
       ) VALUES ($1, $2, $3, $4, $5, 'Google Calendar', $6, 'peach', 'work', 'google_calendar', $7, 'active')
       RETURNING *`,
      [
        userId,
        event.date,
        event.start,
        event.end,
        event.title,
        event.detail || '',
        event.googleEventId,
      ]
    );
  },
};
