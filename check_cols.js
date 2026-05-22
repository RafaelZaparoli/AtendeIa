const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCols() {
  console.log("Checking columns...");
  const { data, error } = await supabase.from('companies').select('opening_time, closing_time, slot_interval_minutes, working_days, user_id').limit(1);
  
  if (error) {
    console.error("Columns do not exist or error:", error);
  } else {
    console.log("Columns exist! Data:", data);
  }
}

checkCols().catch(console.error);
