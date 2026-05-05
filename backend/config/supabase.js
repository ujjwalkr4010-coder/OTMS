const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
  console.error('❌ ERROR: SUPABASE_URL is not set in backend/.env');
  console.error('   Get it from: Supabase Dashboard → Settings → API → Project URL');
  process.exit(1);
}

if (!supabaseServiceKey || supabaseServiceKey.includes('placeholder')) {
  console.error('❌ ERROR: SUPABASE_SERVICE_KEY is not set in backend/.env');
  console.error('   Get it from: Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

// Service role client — bypasses RLS, use only on backend
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = supabase;
