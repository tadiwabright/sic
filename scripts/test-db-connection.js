const { neon } = require('@neondatabase/serverless');

async function testConnection() {
  const DATABASE_URL = "postgresql://neondb_owner:npg_zC8jqGyRDak2@ep-little-grass-a7skji02-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
  
  console.log('Testing database connection...');
  console.log('URL:', DATABASE_URL.replace(/:[^:@]*@/, ':***@')); // Hide password
  
  try {
    const sql = neon(DATABASE_URL);
    
    // Test basic connection
    const result = await sql`SELECT 1 as test`;
    console.log('✅ Basic connection test:', result);
    
    // Test users table exists
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `;
    console.log('✅ Users table exists:', tables.length > 0);
    
    // Test users count
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    console.log('✅ Users in database:', userCount[0].count);
    
    console.log('🎉 Database connection successful!');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    
    // Suggest solutions
    console.log('\n💡 Possible solutions:');
    console.log('1. Check if your Neon database is active');
    console.log('2. Verify the connection string is correct');
    console.log('3. Check your internet connection');
    console.log('4. Try using a different Neon endpoint (non-pooled)');
  }
}

testConnection();
