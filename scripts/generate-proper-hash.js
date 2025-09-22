const bcrypt = require('bcryptjs');
const { neon } = require('@neondatabase/serverless');

async function generateAndUpdateHash() {
  const DATABASE_URL = "postgresql://neondb_owner:npg_zC8jqGyRDak2@ep-little-grass-a7skji02-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
  const sql = neon(DATABASE_URL);
  
  const password = 'admin123';
  
  // Generate a proper bcrypt hash
  const properHash = await bcrypt.hash(password, 10);
  console.log('Generated proper hash for admin123:', properHash);
  
  // Test the hash works
  const isValid = await bcrypt.compare(password, properHash);
  console.log('Hash validation test:', isValid);
  
  if (isValid) {
    console.log('Updating database with proper hash...');
    
    // Update the database with the proper hash
    const result = await sql`
      UPDATE users 
      SET password_hash = ${properHash}
      WHERE email IN ('admin@swimming.com', 'official@swimming.com')
    `;
    
    console.log('Database update result:', result);
    
    // Verify the update
    const users = await sql`
      SELECT email, password_hash FROM users 
      WHERE email IN ('admin@swimming.com', 'official@swimming.com')
    `;
    
    console.log('Updated users:');
    for (const user of users) {
      const testValid = await bcrypt.compare('admin123', user.password_hash);
      console.log(`${user.email}: hash valid = ${testValid}`);
    }
    
    console.log('✅ Database updated successfully!');
  } else {
    console.log('❌ Generated hash is invalid!');
  }
}

generateAndUpdateHash().catch(console.error);
