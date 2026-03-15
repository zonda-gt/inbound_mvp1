CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  destination_name TEXT NOT NULL,
  destination_name_cn TEXT,
  booking_date TEXT NOT NULL,
  booking_time TEXT NOT NULL,
  party_size INTEGER NOT NULL DEFAULT 2,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  confirmation_note TEXT,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bookings_created_at_idx ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);
