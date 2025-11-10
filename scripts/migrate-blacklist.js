#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const http = require('http');

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

if (!ADMIN_API_KEY) {
  console.error('❌ Error: ADMIN_API_KEY no está configurado');
  process.exit(1);
}

console.log('🔧 Applying EventBlacklist migration...\n');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/migrate-blacklist',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ADMIN_API_KEY}`,
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);

      if (result.success) {
        if (result.alreadyApplied) {
          console.log('⚠️  Migration already applied - table exists');
        } else {
          console.log('✅ Migration applied successfully!');
          console.log('   Table "event_blacklist" created');
        }
      } else {
        console.error('❌ Migration failed:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error.message);
      console.error('Response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  if (error.code === 'ECONNREFUSED') {
    console.error('❌ Error: Cannot connect to server at http://localhost:3000');
    console.error('   Make sure to run "npm run dev" first');
  } else {
    console.error('❌ Error:', error.message);
  }
  process.exit(1);
});

req.end();
