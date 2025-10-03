const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    // Check if migration already ran
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'messages'
      );
    `;
    
    const result = await pool.query(checkQuery);
    if (result.rows[0].exists) {
      console.log('✅ Messages table already exists, skipping migration');
      return;
    }
    
    // Run migration
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations/001_add_messages_table.sql'), 
      'utf8'
    );
    
    await pool.query(migrationSQL);
    console.log('✅ Messages table created successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations().catch(console.error);
}

module.exports = { runMigrations };
