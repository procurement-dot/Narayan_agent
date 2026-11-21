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

    // 3. Health & sports events (Confirmed health sessions)
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

    return counts;
  },

  async getEventById(userId: string, eventId: string) {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(eventId)) {
      return null;
    }
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
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(eventId)) {
      return null;
    }

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
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(eventId)) {
      return null;
    }
    return db.queryOne(
      `DELETE FROM calendar_events 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [eventId, userId]
    );
  },

  async deleteProposal(userId: string, proposalId: string) {
    try {
      await db.query(
        `UPDATE proposals SET status = 'dismissed' WHERE id = $1`,
        [proposalId]
      );
      await db.query(
        `DELETE FROM calendar_events WHERE source_proposal_id = $1`,
        [proposalId]
      );
      await db.query(
        `DELETE FROM tasks WHERE source_proposal_id = $1`,
        [proposalId]
      );
    } catch (err) {
      console.warn('[CalendarRepo] deleteProposal error:', err);
    }
  },

  async deleteEmailMeeting(userId: string, emailId: string) {
    try {
      await db.query(
        `UPDATE emails SET is_archived = true WHERE id = $1`,
        [emailId]
      );
    } catch (err) {
      console.warn('[CalendarRepo] deleteEmailMeeting error:', err);
    }
  },

  async deleteNoteEvent(userId: string, noteId: string) {
    try {
      await db.query(
        `DELETE FROM notes WHERE id = $1`,
        [noteId]
      );
    } catch (err) {
      console.warn('[CalendarRepo] deleteNoteEvent error:', err);
    }
  },

  async deleteNoteAction(userId: string, noteId: string, actionIndex: number) {
    try {
      const note = await db.queryOne(
        `SELECT mom_data FROM notes WHERE id = $1`,
        [noteId]
      );
      if (note && note.mom_data && Array.isArray(note.mom_data.actions)) {
        note.mom_data.actions.splice(actionIndex, 1);
        await db.query(
          `UPDATE notes SET mom_data = $1 WHERE id = $2`,
          [JSON.stringify(note.mom_data), noteId]
        );
      }
    } catch (err) {
      console.warn('[CalendarRepo] deleteNoteAction error:', err);
    }
  },

  async deleteTask(userId: string, taskId: string) {
    try {
      await db.query(
        `DELETE FROM tasks WHERE id = $1`,
        [taskId]
      );
    } catch (err) {
      console.warn('[CalendarRepo] deleteTask error:', err);
    }
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

  async getPendingNotifications(userId: string) {
    const notifications: any[] = [];
    const seenTitles = new Set<string>();

    const addNotifSafely = (item: any) => {
      const key = `${(item.title || '').trim().toLowerCase()}_${item.date || ''}_${item.startTime || ''}`;
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        notifications.push(item);
      }
    };

    // 1. Pending Proposals from Emails
    try {
      const proposals = await db.query(
        `SELECT p.*, e.from_name, e.from_email, e.subject as email_subject, e.received_at
         FROM proposals p
         LEFT JOIN emails e ON e.id = p.email_id
         WHERE (p.user_id = $1 OR p.user_id = '00000000-0000-0000-0000-000000000000' OR p.user_id = '00000000-0000-0000-0000-000000000001')
           AND p.status = 'pending'
         ORDER BY p.created_at DESC`,
        [userId]
      );

      for (const p of proposals) {
        const isMeeting = p.type === 'meeting';
        const d = p.created_at
          ? (p.created_at instanceof Date ? p.created_at.toISOString().split('T')[0] : String(p.created_at).split('T')[0])
          : new Date().toISOString().split('T')[0];
        addNotifSafely({
          id: `prop-${p.id}`,
          rawId: p.id,
          source: isMeeting ? 'email_meeting' : 'email_proposal',
          module: 'email',
          type: isMeeting ? 'meeting' : 'task',
          title: p.title,
          subtitle: isMeeting
            ? (p.from_name ? `Meeting with ${p.from_name}` : (p.context ? `Meeting · ${p.context}` : 'Inbound meeting proposal'))
            : (p.from_name ? `Action requested by ${p.from_name}` : 'Email action proposal'),
          detail: (p.detail || '') + (p.evidence ? `\n\nQuoted Evidence: "${p.evidence}"` : ''),
          date: d,
          startTime: p.start_time || (isMeeting ? '14:00' : '15:00'),
          endTime: p.end_time || (isMeeting ? '14:45' : '15:30'),
          evidence: p.evidence || undefined,
          sender: p.from_name ? `${p.from_name} <${p.from_email || ''}>` : p.from_email,
          status: 'pending',
          createdAt: p.created_at,
        });
      }
    } catch (pErr) {
      console.warn('[CalendarRepo] getPendingNotifications proposals error:', pErr);
    }

    // 2. Inbound Meeting Emails not yet in proposals
    try {
      const meetingEmails = await db.query(
        `SELECT e.*
         FROM emails e
         JOIN email_accounts a ON a.id = e.account_id
         WHERE (a.user_id = $1 OR a.user_id = '00000000-0000-0000-0000-000000000001')
           AND e.kind = 'meeting'
           AND (e.is_archived IS FALSE OR e.is_archived IS NULL)
           AND e.id NOT IN (SELECT email_id FROM proposals WHERE email_id IS NOT NULL)
         ORDER BY e.received_at DESC LIMIT 15`,
        [userId]
      );

      for (const me of meetingEmails) {
        const d = me.received_at
          ? (me.received_at instanceof Date ? me.received_at.toISOString().split('T')[0] : String(me.received_at).split('T')[0])
          : new Date().toISOString().split('T')[0];
        addNotifSafely({
          id: `email-mtg-${me.id}`,
          rawId: me.id,
          source: 'email_meeting',
          module: 'email',
          type: 'meeting',
          title: me.subject || 'Meeting Invitation',
          subtitle: `From ${me.from_name || me.from_email}`,
          detail: `From: ${me.from_name} <${me.from_email}>\n\n${me.preview || (me.content ? me.content.slice(0, 300) : '')}`,
          date: d,
          startTime: '15:00',
          endTime: '15:45',
          sender: me.from_name ? `${me.from_name} <${me.from_email}>` : me.from_email,
          status: 'pending',
          createdAt: me.received_at,
        });
      }
    } catch (meErr) {
      console.warn('[CalendarRepo] getPendingNotifications meeting emails error:', meErr);
    }

    // 3. Notes MoM (Voice meetings and actionable summaries)
    try {
      const notes = await db.query(
        `SELECT n.*
         FROM notes n
         WHERE (n.user_id = $1 OR n.user_id = '00000000-0000-0000-0000-000000000000' OR n.user_id = '00000000-0000-0000-0000-000000000001')
           AND (n.source_type = 'voice_meeting' OR (n.mom_data IS NOT NULL AND n.mom_data::text != '{}'))
         ORDER BY n.created_at DESC LIMIT 10`,
        [userId]
      );

      for (const n of notes) {
        const d = n.created_at
          ? (n.created_at instanceof Date ? n.created_at.toISOString().split('T')[0] : String(n.created_at).split('T')[0])
          : new Date().toISOString().split('T')[0];
        addNotifSafely({
          id: `note-mom-${n.id}`,
          rawId: n.id,
          source: 'notes_mom',
          module: 'notes',
          type: 'meeting',
          title: n.title || 'Meeting Summary & Action Items',
          subtitle: `Notes MoM · ${n.area || 'General'} (${n.mom_data?.actions?.length || 0} action items)`,
          detail: n.mom_data?.summary || n.body || '',
          date: d,
          startTime: '11:00',
          endTime: '11:45',
          status: 'pending',
          createdAt: n.created_at,
        });
      }
    } catch (nErr) {
      console.warn('[CalendarRepo] getPendingNotifications notes error:', nErr);
    }

    // 4. Finance Upcoming Bills / Reminders
    try {
      const financeRecords = await db.query(
        `SELECT * FROM finance_records 
         WHERE (user_id = $1 OR user_id = '00000000-0000-0000-0000-000000000001')
           AND category IN ('bill', 'credit_card', 'loan')
         ORDER BY created_at DESC LIMIT 5`,
        [userId]
      );

      for (const f of financeRecords) {
        const d = f.created_at
          ? (f.created_at instanceof Date ? f.created_at.toISOString().split('T')[0] : String(f.created_at).split('T')[0])
          : new Date().toISOString().split('T')[0];
        addNotifSafely({
          id: `finance-bill-${f.id}`,
          rawId: f.id,
          source: 'finance_bill',
          module: 'finance',
          type: 'bill',
          title: `Reminder · ${f.title}`,
          subtitle: `${f.masked_identifier || ''} · ${f.category}`,
          detail: f.detail || 'Scheduled finance reminder',
          date: d,
          startTime: '09:30',
          endTime: '10:00',
          status: 'pending',
          createdAt: f.created_at,
        });
      }
    } catch (fErr) {
      // Ignore if table or records not found
    }

    return notifications;
  },

  async getPendingNotificationsCount(userId: string): Promise<number> {
    const list = await this.getPendingNotifications(userId);
    return list.length;
  },

  async acceptNotification(
    userId: string,
    notificationId: string,
    eventData?: {
      title?: string;
      subtitle?: string;
      date?: string;
      start?: string;
      end?: string;
      detail?: string;
      cat?: string;
      kind?: string;
    }
  ) {
    let propUUID: string | null = null;

    if (notificationId.startsWith('prop-')) {
      propUUID = notificationId.replace('prop-', '');
    } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(notificationId)) {
      propUUID = notificationId;
    }

    // If it's a proposal, update its status to 'approved'
    if (propUUID) {
      await db.query(
        `UPDATE proposals SET status = 'approved' WHERE id = $1`,
        [propUUID]
      );
    }

    const title = eventData?.title || 'Scheduled Event';
    const subtitle = eventData?.subtitle || 'Added to calendar rhythm';
    const detail = eventData?.detail || '';
    const date = eventData?.date || new Date().toISOString().split('T')[0];
    const start = eventData?.start || '10:00';
    const end = eventData?.end || '10:45';
    const cat = eventData?.cat || 'peach';
    const kind = eventData?.kind || 'work';

    // Duplicate check in calendar_events
    const existing = await db.queryOne(
      `SELECT * FROM calendar_events 
       WHERE user_id = $1 AND date = $2 AND start_time = $3 AND title = $4 AND status != 'cancelled'`,
      [userId, date, start, title]
    );

    if (existing) {
      return existing;
    }

    // Insert into calendar_events
    const newEvent = await db.queryOne(
      `INSERT INTO calendar_events (
        user_id, date, start_time, end_time, title, subtitle, detail, cat, kind, source, source_proposal_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
      RETURNING *`,
      [
        userId,
        date,
        start,
        end,
        title,
        subtitle,
        detail,
        cat,
        kind,
        propUUID ? 'email_proposal' : 'local',
        propUUID || null,
      ]
    );

    return newEvent;
  },

  async dismissNotification(userId: string, notificationId: string) {
    if (notificationId.startsWith('prop-')) {
      const propUUID = notificationId.replace('prop-', '');
      await db.query(
        `UPDATE proposals SET status = 'dismissed' WHERE id = $1`,
        [propUUID]
      );
      return { success: true };
    }

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(notificationId)) {
      await db.query(
        `UPDATE proposals SET status = 'dismissed' WHERE id = $1`,
        [notificationId]
      );
      return { success: true };
    }

    // If it's email-mtg-<uuid>, mark email archived
    if (notificationId.startsWith('email-mtg-')) {
      const emailId = notificationId.replace('email-mtg-', '');
      await db.query(
        `UPDATE emails SET is_archived = true WHERE id = $1`,
        [emailId]
      );
      return { success: true };
    }

    return { success: true };
  },
};
