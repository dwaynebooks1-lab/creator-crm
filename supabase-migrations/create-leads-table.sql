-- Run this in Supabase SQL Editor to create the leads table
-- This stores email addresses from the landing page capture form

CREATE TABLE IF NOT EXISTS leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Allow the service role to manage leads (API route uses service role)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- No public access — only the service role key (used by the API) can read/write
CREATE POLICY "Service role full access" ON leads
  FOR ALL USING (auth.role() = 'service_role');
