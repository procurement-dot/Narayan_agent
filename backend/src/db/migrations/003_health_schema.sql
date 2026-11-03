-- NRYN Health Module Schema for Supabase (PostgreSQL)

-- 1. Family Profiles (Self, Neha, Prayan)
CREATE TABLE IF NOT EXISTS health_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    person_name TEXT NOT NULL CHECK (person_name IN ('Self', 'Neha', 'Prayan')),
    role TEXT DEFAULT 'Self',
    resting_hr_baseline INTEGER DEFAULT 52,
    sleep_target_minutes INTEGER DEFAULT 450,
    hydration_target_liters NUMERIC(3, 1) DEFAULT 3.2,
    recovery_baseline INTEGER DEFAULT 85,
    blood_group TEXT DEFAULT 'O+',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Daily Health Vitals (Heart rate, sleep, recovery, steps)
CREATE TABLE IF NOT EXISTS health_vitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES health_profiles(id) ON DELETE CASCADE,
    person_name TEXT NOT NULL CHECK (person_name IN ('Self', 'Neha', 'Prayan')),
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    resting_hr INTEGER DEFAULT 52,
    sleep_duration_minutes INTEGER DEFAULT 445, -- e.g. 7h 25m = 445 mins
    recovery_score INTEGER DEFAULT 88,          -- 0 - 100%
    steps_count INTEGER DEFAULT 8420,
    hydration_liters NUMERIC(3, 1) DEFAULT 2.8,
    energy_level TEXT DEFAULT 'Optimal',
    source TEXT DEFAULT 'Garmin Venu 2 Plus',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Fitness & Endurance Goals
CREATE TABLE IF NOT EXISTS health_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    target_metric TEXT,
    current_metric TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 12-Week Marathon / Endurance Training Sessions
CREATE TABLE IF NOT EXISTS health_training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    week_number INTEGER NOT NULL DEFAULT 4,
    day_name TEXT NOT NULL CHECK (day_name IN ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')),
    workout TEXT NOT NULL,
    distance TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('completed', 'today', 'upcoming', 'skipped')),
    scheduled_time TEXT DEFAULT '07:00',
    intensity TEXT DEFAULT 'Moderate',
    notes TEXT,
    synced_to_calendar BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Target Races & Sports Events
CREATE TABLE IF NOT EXISTS health_sports_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    name TEXT NOT NULL,
    sport TEXT NOT NULL,
    region TEXT NOT NULL CHECK (region IN ('Local', 'India', 'International')),
    date TEXT NOT NULL,
    registered BOOLEAN DEFAULT FALSE,
    target_time TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Health Journals & Daily Reflections
CREATE TABLE IF NOT EXISTS health_journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_name TEXT NOT NULL CHECK (person_name IN ('Self', 'Neha', 'Prayan')),
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    text TEXT NOT NULL,
    energy_level TEXT DEFAULT 'Good',
    soreness_level TEXT DEFAULT 'None',
    ai_coach_reflection TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Medical Lab Reports & Documents
CREATE TABLE IF NOT EXISTS health_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_name TEXT NOT NULL CHECK (person_name IN ('Self', 'Neha', 'Prayan')),
    title TEXT NOT NULL,
    doc_type TEXT DEFAULT 'lab_report',
    file_url TEXT,
    extracted_summary TEXT,
    test_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for high-performance reads
CREATE INDEX IF NOT EXISTS idx_health_vitals_date ON health_vitals(person_name, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_health_journals_date ON health_journals(person_name, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_health_training_status ON health_training_sessions(status);
CREATE INDEX IF NOT EXISTS idx_health_goals_active ON health_goals(is_active);
