#!/usr/bin/env ts-node

/**
 * Manual migration runner script
 * Usage: npm run migrate
 */

import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  user: process.env.POSTGRES_USER || 'flowforge',
  password: process.env.POSTGRES_PASSWORD || 'flowforge_password',
  database: process.env.POSTGRES_DB || 'flowforge',
});

async function runMigration() {
  console.log('🔄 Running database migration...');

  const client = await pool.connect();

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/001_create_plugins_table.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8');

    console.log(`📄 Executing migration: 001_create_plugins_table.sql`);

    // Execute migration
    await client.query(migrationSQL);

    console.log('✅ Migration completed successfully!');

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('plugins', 'plugin_events', 'plugin_metrics')
      ORDER BY table_name
    `);

    console.log('\n📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    console.log('\n✨ Database is ready!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
