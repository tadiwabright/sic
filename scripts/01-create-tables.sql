-- Create houses table
CREATE TABLE IF NOT EXISTS houses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(7) NOT NULL, -- hex color code
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL, -- e.g., 'freestyle', 'backstroke', 'butterfly', 'breaststroke'
  distance VARCHAR(20) NOT NULL, -- e.g., '50m', '100m', '200m'
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'mixed')),
  age_group VARCHAR(20) NOT NULL, -- e.g., 'under-14', 'under-16', 'open'
  max_participants_per_house INTEGER DEFAULT 2,
  is_active BOOLEAN DEFAULT true,
  event_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create swimmers table
CREATE TABLE IF NOT EXISTS swimmers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  house_id INTEGER NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  age INTEGER,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create results table
CREATE TABLE IF NOT EXISTS results (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  swimmer_id INTEGER NOT NULL REFERENCES swimmers(id) ON DELETE CASCADE,
  time_seconds DECIMAL(6,2), -- time in seconds (e.g., 65.23 for 1:05.23)
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'disqualified', 'did_not_start', 'did_not_finish')),
  position INTEGER, -- final position after tie-breaking
  points INTEGER DEFAULT 0, -- points awarded (4,3,2,1,0)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, swimmer_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_results_event_id ON results(event_id);
CREATE INDEX IF NOT EXISTS idx_results_swimmer_id ON results(swimmer_id);
CREATE INDEX IF NOT EXISTS idx_swimmers_house_id ON swimmers(house_id);
CREATE INDEX IF NOT EXISTS idx_results_position ON results(position);
CREATE INDEX IF NOT EXISTS idx_events_order ON events(event_order);
