-- NRYN Calendar Module Schema for Supabase (PostgreSQL)

CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TEXT NOT NULL,                  -- '09:00' (24-hr HH:mm)
    end_time TEXT NOT NULL,                    -- '10:00' (24-hr HH:mm)
    title TEXT NOT NULL,
    subtitle TEXT DEFAULT '',
    detail TEXT DEFAULT '',
    cat TEXT NOT NULL DEFAULT 'peach',         -- 'green' | 'peach' | 'purple' | 'gray'
    kind TEXT NOT NULL DEFAULT 'work',         -- 'health' | 'assistant' | 'work' | 'spirit' | 'finance' | 'people'
    source TEXT NOT NULL DEFAULT 'local',      -- 'local' | 'email_proposal' | 'google_calendar'
    google_event_id TEXT,                      -- Google Calendar Event ID
    source_proposal_id UUID UNIQUE REFERENCES proposals(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active',      -- 'active' | 'completed' | 'cancelled'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_user_date ON calendar_events(user_id, date);
CREATE INDEX IF NOT EXISTS idx_calendar_source ON calendar_events(source);
CREATE INDEX IF NOT EXISTS idx_calendar_google_id ON calendar_events(google_event_id);
