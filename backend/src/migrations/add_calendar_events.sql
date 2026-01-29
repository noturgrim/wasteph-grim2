-- Create calendar_event table for scheduling events
-- This allows sales team to schedule site visits, calls, meetings, etc.

CREATE TABLE IF NOT EXISTS calendar_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  inquiry_id UUID REFERENCES inquiry(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT, -- site_visit, call, meeting, follow_up, etc. (customizable)
  scheduled_date TIMESTAMPTZ NOT NULL,
  start_time TEXT, -- HH:MM format
  end_time TEXT, -- HH:MM format
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, completed, cancelled
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS calendar_event_user_id_idx ON calendar_event(user_id);
CREATE INDEX IF NOT EXISTS calendar_event_scheduled_date_idx ON calendar_event(scheduled_date);
CREATE INDEX IF NOT EXISTS calendar_event_inquiry_id_idx ON calendar_event(inquiry_id);

-- Add comment
COMMENT ON TABLE calendar_event IS 'Calendar events for scheduling site visits, calls, meetings, and other activities';
