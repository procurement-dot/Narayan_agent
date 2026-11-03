-- NRYN Notes Module Schema for Supabase (PostgreSQL)

CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    title TEXT NOT NULL,
    body TEXT DEFAULT '',
    area TEXT NOT NULL CHECK (area IN ('Work', 'Prayan', 'Health', 'Travel', 'Unsorted')),
    source TEXT DEFAULT 'Quick capture',
    source_type TEXT DEFAULT 'text',              -- 'text' | 'voice_meeting'
    transcript TEXT,                              -- Raw conversation audio transcript
    mom_data JSONB,                               -- Structured MoM: { summary, decisions: [], actions: [{ task, assignee, due }] }
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_notes_area ON notes(area);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_source_type ON notes(source_type);
