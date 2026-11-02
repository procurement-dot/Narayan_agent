-- NRYN Email Module Schema for Supabase (PostgreSQL)

-- 1. Connected Email Accounts (Encrypted refresh tokens)
CREATE TABLE IF NOT EXISTS email_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    provider TEXT NOT NULL DEFAULT 'gmail',
    email TEXT NOT NULL,
    refresh_token_enc TEXT NOT NULL,
    history_id TEXT,
    watch_expiry TIMESTAMPTZ,
    status TEXT DEFAULT 'connected',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ingested Emails
CREATE TABLE IF NOT EXISTS emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
    provider_msg_id TEXT NOT NULL,
    thread_id TEXT,
    from_name TEXT,
    from_email TEXT,
    subject TEXT,
    preview TEXT,
    content TEXT,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    scope TEXT DEFAULT 'work',                  -- 'work' | 'personal'
    kind TEXT DEFAULT 'task',                   -- 'task' | 'meeting' | 'noise'
    confidence TEXT DEFAULT 'High',             -- 'High' | 'Medium' | 'Low'
    draft TEXT DEFAULT '',                      -- AI suggested reply
    status TEXT,                                -- 'Draft saved locally', 'Archive proposed'
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, provider_msg_id)
);

-- 3. Email Drafts (User edited or saved drafts)
CREATE TABLE IF NOT EXISTS email_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    body TEXT NOT NULL,
    provider_draft_id TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(email_id, user_id)
);

-- 4. Extracted Action Proposals
CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    type TEXT NOT NULL,                         -- 'task' | 'meeting'
    title TEXT NOT NULL,
    start_time TEXT NOT NULL,                   -- 'HH:mm'
    end_time TEXT NOT NULL,                     -- 'HH:mm'
    detail TEXT,
    context TEXT,
    evidence TEXT NOT NULL,                     -- verbatim quoted evidence
    confidence TEXT DEFAULT 'High',
    sources JSONB DEFAULT '[]'::jsonb,          -- ["e1", "w1"]
    status TEXT DEFAULT 'pending',              -- 'pending' | 'approved' | 'dismissed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Approved Tasks / Calendar Blocks (Duplicate Guard)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    title TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    detail TEXT,
    linked TEXT DEFAULT 'today',
    source_proposal_id UUID UNIQUE REFERENCES proposals(id), -- Enforces 1 event per proposal
    created_at TIMESTAMPTZ DEFAULT NOW()
);
