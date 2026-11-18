-- Add email_digest preference column to creators table
-- Defaults to true (opted in) for existing and new users
ALTER TABLE creators ADD COLUMN IF NOT EXISTS email_digest boolean DEFAULT true;
