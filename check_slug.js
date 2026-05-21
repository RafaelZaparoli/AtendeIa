const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addSlugColumn() {
  console.log("Checking if slug exists or adding it...");
  
  // A maneira mais fácil de adicionar uma coluna sem erro é tentar atualizar e pegar o erro, ou apenas disparar via SQL.
  // Como nao temos como executar SQL bruto facil sem a API secreta do service_role (a menos que a anon_key tenha acesso), 
  // vamos tentar ler o slug.
  const { data, error } = await supabase.from('companies').select('slug').limit(1);
  
  if (error && error.code === '42703') { // column does not exist
    console.log("Column 'slug' does not exist! You need to run ALTER TABLE.");
  } else if (error) {
    console.error("Error checking slug:", error);
  } else {
    console.log("Column 'slug' exists! Data:", data);
  }
}

addSlugColumn().catch(console.error);
