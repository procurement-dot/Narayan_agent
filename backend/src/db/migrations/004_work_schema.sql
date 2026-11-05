-- NRYN Work Module Database Schema for Supabase (PostgreSQL)

-- 1. Work Projects
CREATE TABLE IF NOT EXISTS work_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    tag TEXT NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0,
    next_action TEXT NOT NULL,
    owner TEXT DEFAULT 'Narayan',
    budget TEXT,
    status TEXT DEFAULT 'active', -- 'active' | 'completed' | 'on_hold'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Work Project Tasks & Milestones
CREATE TABLE IF NOT EXISTS work_project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES work_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    due_date TIMESTAMPTZ,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Commercial Invoices & Receivables
CREATE TABLE IF NOT EXISTS work_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    invoice_number TEXT NOT NULL,
    client_name TEXT NOT NULL,
    vertical TEXT NOT NULL, -- 'School programmes' | 'Events' | 'Infra' | 'Govt projects'
    amount TEXT NOT NULL,
    amount_numeric NUMERIC NOT NULL DEFAULT 0,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending' | 'overdue' | 'paid'
    reminder_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Institutional Sales Pipeline
CREATE TABLE IF NOT EXISTS work_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    client_name TEXT NOT NULL,
    deal_value TEXT NOT NULL,
    deal_value_numeric NUMERIC NOT NULL DEFAULT 0,
    stage TEXT DEFAULT 'demo', -- 'lead' | 'demo' | 'proposal' | 'negotiation' | 'won' | 'lost'
    contact_person TEXT,
    notes TEXT,
    next_action TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Team & HR Operations
CREATE TABLE IF NOT EXISTS work_team_ops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_staff INTEGER NOT NULL DEFAULT 20,
    present_count INTEGER NOT NULL DEFAULT 18,
    open_vacancies INTEGER DEFAULT 3,
    training_due INTEGER DEFAULT 18,
    tickets JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Executive Assistant (EA) Signals
CREATE TABLE IF NOT EXISTS work_ea_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    source TEXT NOT NULL, -- 'Email' | 'WhatsApp' | 'Calendar' | 'System'
    category TEXT DEFAULT 'review', -- 'incident' | 'review' | 'decision' | 'schedule'
    priority TEXT DEFAULT 'high', -- 'high' | 'medium' | 'low'
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    linked_task_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Connected External Software & Apps (Infra Project Tracker & Second Software)
CREATE TABLE IF NOT EXISTS work_external_apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    app_key TEXT NOT NULL UNIQUE, -- 'infra_tracker' | 'second_app'
    deploy_url TEXT NOT NULL,
    status TEXT DEFAULT 'connected', -- 'connected' | 'offline'
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    summary_metrics JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
