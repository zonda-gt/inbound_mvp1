-- Concierge chat: human-to-human messaging between app users and admin.
-- Threads keyed by anonymous_user_id today; user_id column reserved for when
-- LOGIN_ENABLED flips on (lookup helper prefers user_id when present).

CREATE TABLE concierge_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_user_id text UNIQUE,
  user_id uuid,
  display_name text,
  city text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_user_message_at timestamptz,
  last_admin_message_at timestamptz,
  admin_unread_count int NOT NULL DEFAULT 0,
  user_unread_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  CONSTRAINT identity_present CHECK (anonymous_user_id IS NOT NULL OR user_id IS NOT NULL)
);

CREATE INDEX concierge_threads_last_user_message_idx
  ON concierge_threads (last_user_message_at DESC NULLS LAST);
CREATE INDEX concierge_threads_user_id_idx
  ON concierge_threads (user_id) WHERE user_id IS NOT NULL;

CREATE TABLE concierge_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES concierge_threads(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('user','admin')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX concierge_messages_thread_created_idx
  ON concierge_messages (thread_id, created_at);

-- Realtime: browser subscribes to admin replies on its own thread.
ALTER PUBLICATION supabase_realtime ADD TABLE concierge_messages;

-- Reads happen from the browser via anon key (Realtime + initial fetch fallback).
-- Writes only via service role key from API routes.
ALTER TABLE concierge_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE concierge_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_read_anon" ON concierge_messages
  FOR SELECT USING (true);
CREATE POLICY "threads_read_anon" ON concierge_threads
  FOR SELECT USING (true);
