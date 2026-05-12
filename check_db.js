const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const matchUrl = envFile.match(/NEXT_PUBLIC_SUPABASE_URL="?([^"\n]+)"?/);
const matchKey = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY="?([^"\n]+)"?/);
const serviceKeyMatch = envFile.match(/SUPABASE_SERVICE_ROLE_KEY="?([^"\n]+)"?/);

if (!matchUrl || !matchKey) {
  console.log('No supabase credentials found in .env.local');
  process.exit(1);
}

const supabase = createClient(matchUrl[1], matchKey[1]);

async function check() {
  const { data, error } = await supabase.from('products').select('id').limit(1);
  if (error) {
    console.log('Table products does not exist or error:', error.message);
  } else {
    console.log('Table products exists.');
  }
}

check();
