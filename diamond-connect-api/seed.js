const bcrypt = require('bcryptjs');
const { query } = require('./db.js');

async function createAdminUser() {
  const email = 'rudrasachapara05@gmail.com';
  const plainPassword = 'rudra123';

  console.log(`Checking for existing admin user with email: ${email}`);
  
  const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
  if (existingUser.rows.length > 0) {
    console.log('Admin user already exists.');
    return 'Admin user already exists.';
  }

  console.log('Hashing password...');
  const hashedPassword = await bcrypt.hash(plainPassword, 12);
  
  console.log('Inserting new admin user into database...');
  const insertQuery = `
    INSERT INTO users (full_name, role, email, password_hash)
    VALUES ('Admin', 'admin', $1, $2)
    RETURNING *;
  `;
  
  const newUser = await query(insertQuery, [email, hashedPassword]);
  console.log('Admin user created successfully:', newUser.rows[0]);
  return 'Admin user created successfully!';
}

module.exports = { createAdminUser };