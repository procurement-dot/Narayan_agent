-- NRYN "Better Me" (Growth & Mastery) Module Schema for Supabase (PostgreSQL)

-- 1. Skill Pathways (Learn)
CREATE TABLE IF NOT EXISTS growth_skill_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    name TEXT NOT NULL,
    category TEXT NOT NULL,                  -- 'Product & Tech' | 'Sport & Physiology' | 'Leadership & Strategy'
    level TEXT NOT NULL DEFAULT 'Intermediate', -- 'Beginner' | 'Intermediate' | 'Practitioner' | 'Advanced'
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    modules JSONB DEFAULT '[]'::jsonb,       -- List of key competency strings
    status TEXT DEFAULT 'in_progress',       -- 'in_progress' | 'completed' | 'paused'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Daily Habit Rhythm (Practice)
CREATE TABLE IF NOT EXISTS growth_habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Mindset', -- 'Mindset' | 'Physical' | 'Focus' | 'Reflection'
    time_of_day TEXT NOT NULL DEFAULT 'Morning', -- 'Morning' | 'Midday' | 'Evening'
    duration_mins INTEGER DEFAULT 15,
    is_completed_today BOOLEAN DEFAULT FALSE,
    streak_days INTEGER DEFAULT 0,
    last_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Self Evaluations & Maturity Scores (Assess)
CREATE TABLE IF NOT EXISTS growth_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Leadership & Strategy',
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    max_score INTEGER DEFAULT 100,
    summary TEXT,
    strengths JSONB DEFAULT '[]'::jsonb,
    growth_areas JSONB DEFAULT '[]'::jsonb,
    assessment_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Curated Discoveries & Knowledge Library (Discover)
CREATE TABLE IF NOT EXISTS growth_library_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'Book',  -- 'Book' | 'Podcast' | 'Mental Model' | 'Paper'
    category TEXT NOT NULL DEFAULT 'Systems Thinking',
    reading_status TEXT NOT NULL DEFAULT 'Want to Read', -- 'Want to Read' | 'Reading' | 'Completed'
    summary TEXT NOT NULL,
    key_takeaways JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_growth_paths_user ON growth_skill_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_growth_habits_user ON growth_habits(user_id);
CREATE INDEX IF NOT EXISTS idx_growth_assessments_user ON growth_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_growth_library_user ON growth_library_items(user_id);
