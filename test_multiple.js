const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testMultiple() {
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, slug")
    .eq("slug", "barbearia-estilo-fino");

  console.log("Error:", error);
  console.log("Data length:", data?.length);
  console.log("Data:", data);
}

testMultiple().catch(console.error);
