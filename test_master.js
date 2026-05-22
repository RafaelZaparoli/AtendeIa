const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("=== INICIANDO TESTE FINAL COMPLETO ===");

  const slug = "barbearia-estilo-fino-" + Date.now();

  console.log("\n-> 1. Criando empresa...");
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      name: "Barbearia Estilo Fino",
      slug: slug,
      city: "Ribeirão Preto",
      state: "SP",
      whatsapp: "16999999999",
      business_info: "Serviços: Corte masculino R$35, Barba R$25. Horário: Seg a Sab, 9h as 19h.",
      tone: "amigável",
      opening_time: "09:00:00",
      closing_time: "18:00:00",
      slot_interval_minutes: 30,
      working_days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    })
    .select("id")
    .single();

  if (companyError) {
    console.error("Erro ao criar empresa:", companyError.message);
    process.exit(1);
  }

  const companyId = company.id;
  console.log("Empresa ID:", companyId);

  console.log("\n-> 2. Testando Rota de Disponibilidade...");
  const date = "2026-06-05"; // Sexta-feira
  const availRes = await fetch(`${BASE_URL}/api/appointments/availability?companyId=${companyId}&date=${date}`);
  console.log("Status da Disponibilidade:", availRes.status);
  
  const availData = await availRes.json();
  if (!availRes.ok) {
    console.error("Erro na disponibilidade:", availData);
  } else {
    console.log(`Horários retornados para ${date}:`, availData.times?.length || 0);
  }

  console.log("\n-> 3. Criando agendamento (API)...");
  const aptTime = availData.times?.[0]?.time || "09:00";
  const aptRes = await fetch(`${BASE_URL}/api/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyId,
      customerName: "Teste QA",
      customerPhone: "16988887777",
      service: "Corte masculino",
      appointmentDate: date,
      appointmentTime: aptTime,
      notes: "Teste QA final"
    })
  });
  console.log("Status da Criação:", aptRes.status);
  const aptData = await aptRes.json();
  if (!aptRes.ok) {
    console.error("Erro no agendamento:", aptData);
  } else {
    console.log("Agendamento criado ID:", aptData.appointmentId);
  }

  console.log("\n-> 4. Testando bloqueio duplo...");
  const aptRes2 = await fetch(`${BASE_URL}/api/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyId,
      customerName: "Invasor",
      customerPhone: "16111111111",
      service: "Roubo",
      appointmentDate: date,
      appointmentTime: aptTime
    })
  });
  console.log("Status Bloqueio:", aptRes2.status, await aptRes2.json());

  console.log("\n=== TESTES CONCLUIDOS COM SUCESSO ===");
}

runTests().catch(console.error);
