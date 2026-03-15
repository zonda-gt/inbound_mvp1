-- Migration: Add source tracking to chat_sessions and chat_messages
-- Run this in Supabase SQL Editor

-- 1. Add source + entity columns to chat_sessions
ALTER TABLE chat_sessions
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'chat',
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS entity_slug TEXT;

-- 2. Add source + image_url to chat_messages
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'chat',
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. Backfill existing ask sessions (they have entry_page like /chat?restaurant=... or /chat?attraction=...)
UPDATE chat_sessions
SET source = 'ask',
    entity_type = CASE
      WHEN entry_page LIKE '%restaurant=%' THEN 'restaurant'
      WHEN entry_page LIKE '%attraction=%' THEN 'attraction'
    END,
    entity_slug = CASE
      WHEN entry_page LIKE '%restaurant=%' THEN
        REGEXP_REPLACE(SPLIT_PART(entry_page, 'restaurant=', 2), '&.*', '')
      WHEN entry_page LIKE '%attraction=%' THEN
        REGEXP_REPLACE(SPLIT_PART(entry_page, 'attraction=', 2), '&.*', '')
    END
WHERE entry_page LIKE '%restaurant=%' OR entry_page LIKE '%attraction=%';

-- 4. Create lens-photos storage bucket (private — use signed URLs to view)
INSERT INTO storage.buckets (id, name, public)
VALUES ('lens-photos', 'lens-photos', false)
ON CONFLICT (id) DO NOTHING;
