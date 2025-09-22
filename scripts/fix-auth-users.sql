-- Fix existing user accounts with correct password hash for 'admin123'
UPDATE users SET password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' 
WHERE email IN ('admin@swimming.com', 'official@swimming.com');

-- If users don't exist, insert them
INSERT INTO users (email, password_hash, role, name) VALUES 
('admin@swimming.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System Administrator'),
('official@swimming.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'official', 'Competition Official')
ON CONFLICT (email) DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  name = EXCLUDED.name;
