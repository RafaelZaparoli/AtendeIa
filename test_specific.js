const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BASE_URL = "http://localhost:3001"; // Server is running on 3001 now!

async function testSpecific() {
  const slug = "barbearia-estilo-fino";
  
  const { data: company, error } = await supabase
    .from("companies")
    .select("id, working_days")
    .eq("slug", slug)
    .single();

  if (error) {
    console.log("Error finding company:", error.message);
    return;
  }

  const companyId = company.id;
  console.log("Company ID:", companyId, "Working days:", company.working_days);

  const date = "2026-06-05"; // a friday
  const res = await fetch(`${BASE_URL}/api/appointments/availability?companyId=${companyId}&date=${date}`);
  console.log("Status:", res.status);
  const json = await res.json();
  console.log("Response:", JSON.stringify(json));
}

testSpecific().catch(console.error);
