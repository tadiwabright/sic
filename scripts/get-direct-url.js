// The current pooled URL has connection issues in Next.js
const pooledUrl = "postgresql://neondb_owner:npg_zC8jqGyRDak2@ep-little-grass-a7skji02-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// Convert to direct connection (remove -pooler from hostname)
const directUrl = pooledUrl.replace('-pooler', '');

console.log('Current (pooled) URL:', pooledUrl.replace(/:[^:@]*@/, ':***@'));
console.log('Direct URL to use:', directUrl.replace(/:[^:@]*@/, ':***@'));
console.log('\nUpdate your .env.local with:');
console.log(`DATABASE_URL="${directUrl}"`);
