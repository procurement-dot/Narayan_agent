-- NRYN "Kickstart" (Morning Executive Briefing & Daily Intent) Module Schema for Supabase (PostgreSQL)

-- 1. Daily Agenda Timeline
CREATE TABLE IF NOT EXISTS kickstart_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    time_slot TEXT NOT NULL,                  -- '07:00', '08:30', '11:00', etc.
    title TEXT NOT NULL,
    detail TEXT,
    is_emphasized BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT FALSE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Weather & Air Quality (AQI)
CREATE TABLE IF NOT EXISTS kickstart_weather (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city TEXT NOT NULL DEFAULT 'Pune',
    temp_c NUMERIC(4, 1) DEFAULT 24.0,
    high_temp_c NUMERIC(4, 1) DEFAULT 31.0,
    low_temp_c NUMERIC(4, 1) DEFAULT 19.0,
    condition TEXT DEFAULT 'Clear skies',
    humidity_pct INTEGER DEFAULT 48,
    aqi INTEGER DEFAULT 68,
    aqi_status TEXT DEFAULT 'Moderate / Good',
    running_outlook TEXT DEFAULT 'Pleasant morning conditions for running',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Curated News & Headlines
CREATE TABLE IF NOT EXISTS kickstart_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_num TEXT NOT NULL,                  -- '01', '02', '03'
    category TEXT NOT NULL,                   -- 'headlines' | 'world' | 'india' | 'local' | 'interests'
    title TEXT NOT NULL,
    detail TEXT,
    source_name TEXT DEFAULT 'Live Feed',
    published_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Astrological & Mindset Reflection
CREATE TABLE IF NOT EXISTS kickstart_astro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_num TEXT NOT NULL,                  -- '01', '02', '03'
    title TEXT NOT NULL,
    detail TEXT NOT NULL,
    perspective TEXT DEFAULT 'Gentle reflection',
    today_focus TEXT DEFAULT 'Clear focus in execution',
    monthly_outlook TEXT DEFAULT 'Deepen relationships & unhurried time',
    moon_phase TEXT DEFAULT 'Waxing phase · creative momentum',
    date DATE DEFAULT CURRENT_DATE
);

-- 5. Audio Briefing Synthesis
CREATE TABLE IF NOT EXISTS kickstart_audio_brief (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT 'Morning 3-minute synthesis',
    summary TEXT NOT NULL DEFAULT 'Summary of meetings, news and weather.',
    duration_seconds INTEGER DEFAULT 180,
    audio_url TEXT DEFAULT 'https://nryn-assets.local/audio/morning_brief.mp3',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for rapid lookup
CREATE INDEX IF NOT EXISTS idx_kickstart_timeline_user ON kickstart_timeline(user_id);
CREATE INDEX IF NOT EXISTS idx_kickstart_news_cat ON kickstart_news(category);
CREATE INDEX IF NOT EXISTS idx_kickstart_weather_city ON kickstart_weather(city);
