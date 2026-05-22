const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCompanies() {
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, slug, working_days, opening_time, closing_time, slot_interval_minutes")
    .limit(5);

  console.log("Error:", error);
  console.log("Data:", data);
}

checkCompanies().catch(console.error);
