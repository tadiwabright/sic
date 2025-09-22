-- Insert sample houses
INSERT INTO houses (name, color) VALUES 
  ('Red House', '#E53935'),
  ('Blue House', '#1E88E5'),
  ('Green House', '#43A047'),
  ('Yellow House', '#FDD835')
ON CONFLICT (name) DO NOTHING;

-- Insert sample events
INSERT INTO events (name, category, distance, gender, age_group, max_participants_per_house, event_order) VALUES 
  ('Boys Under-14 50m Freestyle', 'freestyle', '50m', 'male', 'under-14', 2, 1),
  ('Girls Under-14 50m Freestyle', 'freestyle', '50m', 'female', 'under-14', 2, 2),
  ('Boys Under-16 50m Freestyle', 'freestyle', '50m', 'male', 'under-16', 2, 3),
  ('Girls Under-16 50m Freestyle', 'freestyle', '50m', 'female', 'under-16', 2, 4),
  ('Boys Open 50m Freestyle', 'freestyle', '50m', 'male', 'open', 2, 5),
  ('Girls Open 50m Freestyle', 'freestyle', '50m', 'female', 'open', 2, 6),
  ('Boys Under-14 50m Backstroke', 'backstroke', '50m', 'male', 'under-14', 2, 7),
  ('Girls Under-14 50m Backstroke', 'backstroke', '50m', 'female', 'under-14', 2, 8),
  ('Mixed Relay 4x50m Freestyle', 'freestyle', '4x50m', 'mixed', 'open', 4, 9),
  ('Boys Under-16 100m Individual Medley', 'individual_medley', '100m', 'male', 'under-16', 2, 10)
ON CONFLICT DO NOTHING;

-- Insert sample swimmers
INSERT INTO swimmers (name, house_id, age, gender) VALUES 
  -- Red House swimmers
  ('Alex Johnson', 1, 13, 'male'),
  ('Sarah Wilson', 1, 14, 'female'),
  ('Mike Chen', 1, 15, 'male'),
  ('Emma Davis', 1, 16, 'female'),
  ('Tom Brown', 1, 17, 'male'),
  ('Lisa Garcia', 1, 15, 'female'),
  
  -- Blue House swimmers
  ('David Miller', 2, 13, 'male'),
  ('Anna Taylor', 2, 14, 'female'),
  ('Chris Anderson', 2, 16, 'male'),
  ('Sophie Martin', 2, 15, 'female'),
  ('Jake Thompson', 2, 17, 'male'),
  ('Mia Rodriguez', 2, 16, 'female'),
  
  -- Green House swimmers
  ('Ryan Lee', 3, 14, 'male'),
  ('Chloe White', 3, 13, 'female'),
  ('Nathan Clark', 3, 15, 'male'),
  ('Olivia Lewis', 3, 16, 'female'),
  ('Ethan Hall', 3, 17, 'male'),
  ('Grace Young', 3, 14, 'female'),
  
  -- Yellow House swimmers
  ('Lucas King', 4, 13, 'male'),
  ('Zoe Wright', 4, 14, 'female'),
  ('Mason Scott', 4, 16, 'male'),
  ('Ava Green', 4, 15, 'female'),
  ('Logan Adams', 4, 17, 'male'),
  ('Ella Baker', 4, 16, 'female')
ON CONFLICT DO NOTHING;
