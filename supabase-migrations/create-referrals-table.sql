-- Referral tracking
CREATE TABLE IF NOT EXISTS referrals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  referred_id uuid REFERENCES creators(id) ON DELETE SET NULL,
  referred_email text NOT NULL,
  status text NOT NULL DEFAULT 'signed_up' CHECK (status IN ('signed_up', 'active', 'subscribed')),
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS referrals_referred_email_idx ON referrals(referred_email);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users can read their own referrals (ones they made)
CREATE POLICY "Users can read own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id);

-- Service role has full access
CREATE POLICY "Service role full access referrals" ON referrals
  FOR ALL USING (auth.role() = 'service_role');
