# SalesFlow — Motor de Conversión de Leads

> Complemento de LeadFlow: convierte leads extraídos en ventas cerradas.

## Setup rápido (desde celular en Termux)

### 1. Instalar dependencias

```bash
cd ~/salesflow && npm install
```

### 2. Crear proyecto en Supabase (gratis)

1. Ve a [supabase.com](https://supabase.com) → New Project
2. Crea proyecto gratuito
3. Ve a **Project Settings → API** y copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Configurar Auth (Google)

1. En Supabase → **Authentication → Providers**
2. Activa **Google** y **Email**
3. Para Google: necesitar OAuth credentials de [Google Cloud Console](https://console.cloud.google.com)
   - Authorized redirect URI: `https://tu-proyecto.supabase.co/auth/v1/callback`

### 4. Crear tablas en Supabase

1. Ve a **SQL Editor** en Supabase
2. Copia y pega el contenido de `db/schema.sql`
3. Ejecuta

### 5. (Opcional) Configurar OpenRouter para IA gratis

1. Ve a [openrouter.ai](https://openrouter.ai)
2. Crea cuenta gratuita
3. Copia tu API key → `OPENROUTER_API_KEY`

### 6. Crear `.env.local`

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase.

### 7. Instalar dependencias y correr

```bash
npm install
npm run dev
```

Abre `http://localhost:3000` en tu navegador.

### 8. Deploy a Vercel (gratis)

```bash
npx vercel --prod
```

O conecta tu repo GitHub a Vercel para deploy automático.

## Estructura

```
src/
├── app/
│   ├── page.tsx          # Landing
│   ├── login/page.tsx    # Login
│   ├── signup/page.tsx   # Signup
│   ├── dashboard/        # App principal
│   │   ├── page.tsx      # Dashboard + leads table
│   │   ├── pipeline/     # Kanban
│   │   └── settings/     # Config
│   └── api/              # API routes
├── lib/                  # Utils + Supabase + Pricing
├── types/                # TypeScript types
└── components/           # Reusables
```

## Pricing

| Plan | Leads/mes | Mensajes IA | Precio |
|------|-----------|-------------|--------|
| Free | 50 | 20 | $0 |
| Pro | 500 | 200 | $29/mes |
| Agency | ∞ | ∞ | $79/mes |

## Stack

- Next.js 14 + React
- Supabase (Auth + DB)
- Tailwind CSS
- OpenRouter (IA: Qwen/Llama gratis)
- Resend (Emails)
- Vercel (Hosting)
