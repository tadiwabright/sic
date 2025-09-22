const { neon } = require('@neondatabase/serverless');

async function fixAuthUsers() {
  const DATABASE_URL = "postgresql://neondb_owner:npg_zC8jqGyRDak2@ep-little-grass-a7skji02-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
  const sql = neon(DATABASE_URL);
  
  try {
    console.log('Fixing user authentication...');
    
    // Update existing users
    const updateResult = await sql`
      UPDATE users SET password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' 
      WHERE email IN ('admin@swimming.com', 'official@swimming.com')
    `;
    console.log('Updated existing users:', updateResult);
    
    // Insert or update users
    const insertResult = await sql`
      INSERT INTO users (email, password_hash, role, name) VALUES 
      ('admin@swimming.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System Administrator'),
      ('official@swimming.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'official', 'Competition Official')
      ON CONFLICT (email) DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        name = EXCLUDED.name
    `;
    console.log('Insert/update result:', insertResult);
    
    // Verify users exist
    const users = await sql`SELECT email, role FROM users WHERE email IN ('admin@swimming.com', 'official@swimming.com')`;
    console.log('Current users:', users);
    
    console.log('✅ Authentication fix completed successfully!');
    console.log('You can now login with:');
    console.log('Email: admin@swimming.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('❌ Error fixing authentication:', error);
  }
}

fixAuthUsers();
