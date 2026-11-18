-- Migration: 006_finance_schema.sql
-- Finance / Money module tables for Assets, Lending, SMS Transactions, Records Vault, and Retirement

CREATE TABLE IF NOT EXISTS finance_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000001',
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  cost NUMERIC NOT NULL DEFAULT 0,
  expected_rent NUMERIC NOT NULL DEFAULT 0,
  received_rent NUMERIC NOT NULL DEFAULT 0,
  area TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000001',
  name TEXT NOT NULL,
  principal NUMERIC NOT NULL DEFAULT 0,
  rate NUMERIC NOT NULL DEFAULT 0,
  frequency TEXT DEFAULT 'Monthly interest',
  due TEXT NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_transactions (
  id TEXT PRIMARY KEY,
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000001',
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_mask TEXT,
  merchant TEXT,
  balance NUMERIC,
  due_date TEXT,
  category TEXT DEFAULT 'general',
  raw_body TEXT,
  date BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000001',
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  masked_identifier TEXT NOT NULL,
  detail TEXT NOT NULL,
  document_name TEXT NOT NULL,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_retirement_params (
  user_id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  age INT NOT NULL DEFAULT 38,
  retire_age INT NOT NULL DEFAULT 58,
  target_corpus NUMERIC NOT NULL DEFAULT 35000000,
  current_sip NUMERIC NOT NULL DEFAULT 65000,
  return_rate NUMERIC NOT NULL DEFAULT 12,
  inflation_rate NUMERIC NOT NULL DEFAULT 6.5,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
