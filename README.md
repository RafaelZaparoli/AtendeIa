# AtendeAI

SaaS de atendimento com IA para pequenos negócios. A empresa cadastra informações como serviços, preços, horários e regras, e o chat responde clientes com base nesses dados.

A versão atual usa uma resposta simulada no backend para evitar custos de API, mas a arquitetura já está preparada para integração futura com modelos de IA como OpenAI, Gemini ou outros provedores.

## Demonstração

O projeto possui um fluxo funcional de demonstração:

1. Cadastre uma empresa em `/dashboard/configuracoes`.
2. Copie o ID da empresa gerado após salvar.
3. Acesse `/chat/demo`.
4. Cole o ID da empresa e envie perguntas como:
   - Quais serviços vocês oferecem?
   - Qual o horário de funcionamento?
   - Aceitam Pix?
   - Qual o endereço?
5. Veja o histórico real em `/dashboard/conversas`.

## Problema que resolve

Pequenos negócios recebem muitas perguntas repetidas todos os dias: preço, horário, endereço, formas de pagamento, serviços disponíveis e regras de atendimento.

O AtendeAI centraliza essas informações e permite que um chat responda clientes com base no cadastro da empresa, reduzindo trabalho manual e mantendo respostas mais consistentes.

## Funcionalidades

- Landing page moderna para apresentação do produto.
- Dashboard com visão geral do atendimento.
- Cadastro visual de dados da empresa.
- Salvamento real da empresa no Supabase.
- Chat demo conectado a uma API interna.
- Resposta simulada baseada nos dados cadastrados.
- Salvamento de conversas no Supabase.
- Histórico real de conversas com busca local.
- Estados de loading, sucesso, erro e vazio.
- Interface responsiva com Tailwind CSS.

## Tecnologias usadas

- Next.js App Router
- TypeScript
- Tailwind CSS
- React
- Supabase
- API Routes do Next.js

## Arquitetura simples

```txt
app/
  api/
    chat/
      route.ts              # API que processa mensagem, busca empresa e salva conversa
  chat/
    demo/
      page.tsx              # Interface de chat demo
  dashboard/
    configuracoes/
      page.tsx              # Formulário de cadastro da empresa
    conversas/
      page.tsx              # Histórico real de conversas
    page.tsx                # Dashboard principal
  page.tsx                  # Landing page

components/
  ButtonLink.tsx
  ChatPreview.tsx
  DashboardLayout.tsx
  StatCard.tsx

lib/
  supabaseClient.ts         # Cliente Supabase centralizado e tipos principais
```

Fluxo principal:

```txt
Cadastro da empresa
  -> Supabase companies

Chat demo
  -> POST /api/chat
  -> Busca company por ID
  -> Gera resposta simulada com business_info
  -> Salva em conversations
  -> Retorna answer para a tela

Histórico
  -> Busca conversations
  -> Exibe mensagens, respostas, datas e empresa
```

## Como rodar localmente

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env.local` com base no `.env.example`:

```bash
cp .env.example .env.local
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse:

```txt
http://localhost:3000
```

No Windows, se o PowerShell bloquear `npm`, use:

```bash
npm.cmd run dev
```

Para validar o build:

```bash
npm run build
```

## Variáveis de ambiente

O projeto usa as seguintes variáveis:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Essas variáveis ficam em `.env.local`.

Importante: nunca coloque `service_role` ou chaves secretas em variáveis `NEXT_PUBLIC_`, pois elas ficam disponíveis no navegador.

## Como configurar Supabase

Crie um projeto no Supabase e configure duas tabelas.

### Tabela `companies`

Campos esperados:

| Campo | Tipo sugerido | Observação |
| --- | --- | --- |
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `name` | `text` | Nome da empresa |
| `business_info` | `text` | Informações organizadas da empresa |
| `tone` | `text` | Tom de voz da IA |
| `whatsapp` | `text` | WhatsApp da empresa |
| `created_at` | `timestamptz` | Default `now()` |

### Tabela `conversations`

Campos esperados:

| Campo | Tipo sugerido | Observação |
| --- | --- | --- |
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `company_id` | `uuid` | Referência para `companies.id` |
| `customer_message` | `text` | Mensagem enviada pelo cliente |
| `ai_response` | `text` | Resposta gerada pela API |
| `created_at` | `timestamptz` | Default `now()` |

Relacionamento recomendado:

```sql
alter table conversations
add constraint conversations_company_id_fkey
foreign key (company_id)
references companies(id)
on delete cascade;
```

Para desenvolvimento, configure as policies de RLS conforme o nível de acesso desejado. Em produção, revise cuidadosamente as policies antes de expor leitura ou escrita com a chave pública.

## Prints do projeto

Adicione prints nesta seção para usar o projeto no GitHub e portfólio.

Sugestões:

- Landing page
- Dashboard
- Cadastro da empresa
- Chat demo
- Histórico de conversas

```txt
docs/images/landing.png
docs/images/dashboard.png
docs/images/configuracoes.png
docs/images/chat-demo.png
docs/images/conversas.png
```

## Próximas melhorias

- Integrar um modelo real de IA.
- Adicionar autenticação.
- Associar empresas a usuários.
- Criar painel para editar empresas cadastradas.
- Melhorar políticas de segurança com RLS por usuário.
- Adicionar canais reais como WhatsApp API.
- Criar dashboard com métricas avançadas.
- Adicionar testes automatizados.
- Criar deploy em Vercel.

## Status do projeto

Projeto em desenvolvimento.

Versão atual:

- Frontend funcional.
- Supabase integrado.
- Cadastro de empresa funcionando.
- Chat demo conectado à API.
- Histórico real de conversas.
- Resposta simulada no backend, sem custos de API de IA.

Este projeto é uma base inicial para um SaaS de atendimento com IA e pode evoluir para um produto completo com autenticação, multiempresa, integrações de canais e modelos de IA reais.
