-- NRYN Travel Module Schema for Supabase (PostgreSQL)

-- 1. Travel Trips
CREATE TABLE IF NOT EXISTS travel_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    route TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'planning', -- 'planning' | 'confirmed' | 'completed' | 'cancelled'
    details TEXT,
    purpose TEXT DEFAULT 'personal',         -- 'personal' | 'business' | 'family'
    budget_inr NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Itinerary Segments (Flights, Hotels, Rail, Cabs, Meetings)
CREATE TABLE IF NOT EXISTS travel_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES travel_trips(id) ON DELETE CASCADE,
    type TEXT NOT NULL,                      -- 'flight' | 'hotel' | 'train' | 'cab' | 'meeting'
    title TEXT NOT NULL,
    provider TEXT,
    confirmation_code TEXT,
    departure_time TIMESTAMPTZ,
    arrival_time TIMESTAMPTZ,
    origin TEXT,
    destination TEXT,
    cost_inr NUMERIC(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'confirmed',         -- 'confirmed' | 'reserved' | 'inquiry'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Airfare Price Watcher & Alerts
CREATE TABLE IF NOT EXISTS travel_fare_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    route TEXT NOT NULL,
    journey_date DATE NOT NULL,
    current_fare_inr NUMERIC(10, 2) NOT NULL,
    typical_fare_inr NUMERIC(10, 2) NOT NULL,
    target_fare_inr NUMERIC(10, 2),
    status_note TEXT,
    booking_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Travel Documents & Passport Vault
CREATE TABLE IF NOT EXISTS travel_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    family_member TEXT NOT NULL,
    doc_type TEXT NOT NULL,                  -- 'passport' | 'visa' | 'id' | 'insurance'
    doc_title TEXT NOT NULL,
    doc_number_masked TEXT,
    expiry_date DATE NOT NULL,
    alert_lead_months INT DEFAULT 6,
    notes TEXT,
    status TEXT DEFAULT 'valid',             -- 'valid' | 'renewal_needed' | 'expired'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. IRCTC Tatkal Assistant & Master Passenger List
CREATE TABLE IF NOT EXISTS travel_tatkal_assist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    train_number TEXT NOT NULL,
    train_name TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    travel_date DATE NOT NULL,
    class_code TEXT NOT NULL DEFAULT 'AC Chair Car', -- '1A' | '2A' | '3A' | 'CC' | 'SL'
    opening_time TEXT NOT NULL DEFAULT '10:00 AM',
    passengers JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'pending',           -- 'pending' | 'booked' | 'missed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);
