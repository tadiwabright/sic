const bcrypt = require('bcryptjs');

async function testBcrypt() {
  const password = 'admin123';
  const storedHash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
  
  console.log('Testing bcrypt comparison:');
  console.log('Password:', password);
  console.log('Stored hash:', storedHash);
  
  // Generate a fresh hash for comparison
  const freshHash = await bcrypt.hash(password, 10);
  console.log('Fresh hash:', freshHash);
  
  // Test comparison with stored hash
  const isValidStored = await bcrypt.compare(password, storedHash);
  console.log('Stored hash valid:', isValidStored);
  
  // Test comparison with fresh hash
  const isValidFresh = await bcrypt.compare(password, freshHash);
  console.log('Fresh hash valid:', isValidFresh);
  
  // Test wrong password
  const isValidWrong = await bcrypt.compare('wrongpassword', storedHash);
  console.log('Wrong password valid:', isValidWrong);
}

testBcrypt().catch(console.error);
