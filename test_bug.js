const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BASE_URL = "http://localhost:3000";

async function testBug() {
  console.log("=== TESTANDO BUG DE DISPONIBILIDADE ===");

  // 1. Criar empresa com dados válidos
  const slug = "bug-test-" + Date.now();
  console.log("\n-> 1. Criando empresa...");
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      name: "Bug Test",
      slug: slug,
      opening_time: "09:00:00",
      closing_time: "18:00:00",
      slot_interval_minutes: 30,
      working_days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
      business_info: "Test",
      city: "Test",
      state: "SP",
      whatsapp: "16999999999",
      tone: "amigavel"
    })
    .select("id")
    .single();

  if (companyError) {
    console.error("Erro ao criar empresa:", companyError.message);
    process.exit(1);
  }

  const companyId = company.id;
  console.log("Empresa ID:", companyId);

  // 2. Fetch Availability
  console.log("\n-> 2. Fetch /availability...");
  const date = "2026-06-05"; // Sexta-feira
  
  try {
    const availRes = await fetch(`${BASE_URL}/api/appointments/availability?companyId=${companyId}&date=${date}`);
    console.log("Status:", availRes.status);
    const text = await availRes.text();
    console.log("Response Body:", text);
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
}

testBug().catch(console.error);
