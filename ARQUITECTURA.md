# SalesFlow - Arquitectura Completa del Proyecto

## Fecha de documentación: 2026-05-14
## Estado: MVP en desarrollo
## URL en producción: https://salesflow-psi.vercel.app

---

## 1. Resumen del Proyecto

**SalesFlow** es una aplicación SaaS de gestión de pipeline de ventas enfocada en cerrar ventas. Recibe leads ya calificados desde **LeadFlow** (otra plataforma del mismo ecosistema que analiza leads con IA Gemini) y los gestiona a través de un pipeline Kanban con 5 etapas.

**Propósito:** No duplicar el análisis de leads (ya hecho por LeadFlow). SalesFlow se enfoca exclusivamente en el proceso de cierre de ventas.

---

## 2. Stack Tecnológico

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | 15.x | Framework React full-stack |
| React | 19.x | Biblioteca UI |
| TypeScript | 5.x | Tipado estático |
| Tailwind CSS | 3.x | Estilos utility-first |
| @dnd-kit | 6.x | Drag & drop para Kanban |
| lucide-react | latest | Iconos |

### Backend / Infraestructura
| Tecnología | Propósito |
|------------|-----------|
| Supabase | Auth + Database + Storage |
| Vercel | Hosting y deploy |
| OpenRouter API | IA para generación de mensajes |

### Build Tool
| Herramienta | Propósito |
|-------------|-----------|
| Webpack (Next.js) | Bundling (Turbopack deshabilitado por compatibilidad Termux/Android) |

---

## 3. Estructura del Proyecto

```
salesflow/
├── db/
│   ── schema.sql                    # Esquema completo de la base de datos
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── generate-message/     # API route para generación IA
│   │   │       └── route.ts
│   │   ├── auth/
│   │   │   ── callback/             # Callback de autenticación OAuth
│   │   │       ── page.tsx
│   │   ├── login/                    # Página de login
│   │   │   └── page.tsx
│   │   ├── globals.css               # Estilos globales
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Home protegida con auth
│   ├── components/
│   │   ├── ImportButton.tsx          # Modal de importación CSV/API
│   │   ├── KanbanColumn.tsx          # Columna del Kanban con cards
│   │   ├── Pipeline.tsx              # Pipeline principal con drag & drop
│   │   ├── Sidebar.tsx               # Sidebar con enfoque del día
│   │   └── TopNav.tsx                # Navegación superior
│   ├── hooks/
│   │   └── useAuth.ts                # Hook de autenticación
│   ├── lib/
│   │   └── supabase.ts               # Cliente Supabase
│   └── types/
│       └── index.ts                  # Definiciones TypeScript
── .env.local                        # Variables de entorno locales
├── next.config.js                    # Configuración Next.js
├── package.json                      # Dependencias
├── tailwind.config.ts                # Configuración Tailwind
└── tsconfig.json                     # Configuración TypeScript
```

---

## 4. Bases de Datos (Supabase - PostgreSQL)

### Proyecto Supabase
- **ID:** `fbdjeggrvoplweldfncz`
- **Nombre:** AppSalesFlow
- **URL:** `https://fbdjeggrvoplweldfncz.supabase.co`
- **DB Host:** `db.fbdjeggrvoplweldfncz.supabase.co:5432`
- **Pooler Host:** `aws-0-sa-east-1.pooler.supabase.com:6543`

### Tablas

#### 4.1 `leads`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → auth.users(id) |
| name | TEXT | Nombre del lead |
| company | TEXT | Empresa |
| email | TEXT | Email de contacto |
| phone | TEXT | Teléfono |
| score | TEXT | 'Alto', 'Caliente', 'Medio', 'Bajo' |
| insights | TEXT | Insights de Gemini (desde LeadFlow) |
| gemini_score | INTEGER | Score numérico de Gemini |
| source | TEXT | Default: 'leadflow' |
| stage | TEXT | Etapa actual del pipeline |
| value | NUMERIC | Valor monetario del lead |
| created_at | TIMESTAMPTZ | Fecha de creación |
| updated_at | TIMESTAMPTZ | Fecha de actualización |

#### 4.2 `pipeline_stages`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → auth.users(id) |
| name | TEXT | Nombre de la etapa |
| color | TEXT | Color hex |
| order_index | INTEGER | Orden de visualización |
| created_at | TIMESTAMPTZ | Fecha de creación |

**Stages por defecto:**
1. Contactado (#3b82f6)
2. Reunión agendada (#a855f7)
3. Propuesta enviada (#22c55e)
4. Negociación (#f59e0b)
5. Cerrado (#10b981)

#### 4.3 `tasks`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → auth.users(id) |
| lead_id | UUID | FK → leads(id) |
| title | TEXT | Título de la tarea |
| description | TEXT | Descripción |
| due_date | TIMESTAMPTZ | Fecha límite |
| completed | BOOLEAN | Estado |
| type | TEXT | 'llamada', 'email', 'reunion', 'seguimiento' |
| created_at | TIMESTAMPTZ | Fecha de creación |

#### 4.4 `ai_messages`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → auth.users(id) |
| lead_id | UUID | FK → leads(id) |
| content | TEXT | Contenido del mensaje generado |
| type | TEXT | 'propuesta', 'seguimiento', 'personalizado' |
| created_at | TIMESTAMPTZ | Fecha de creación |

#### 4.5 `daily_metrics`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → auth.users(id) |
| date | DATE | Fecha (unique por user) |
| leads_contacted | INTEGER | Leads contactados |
| meetings_booked | INTEGER | Reuniones agendadas |
| proposals_sent | INTEGER | Propuestas enviadas |
| deals_closed | INTEGER | Ventas cerradas |
| total_value | NUMERIC | Valor total |
| created_at | TIMESTAMPTZ | Fecha de creación |

### Row Level Security (RLS)
Todas las tablas tienen RLS habilitado con políticas:
```sql
CREATE POLICY "Users can only access their own {table}" ON {table}
  FOR ALL USING (auth.uid() = user_id);
```

### Índices
- `idx_leads_user_stage` en leads(user_id, stage)
- `idx_tasks_user_due` en tasks(user_id, due_date, completed)

---

## 5. Autenticación

### Proveedores configurados
| Proveedor | Estado |
|-----------|--------|
| Email/Password | ✅ Habilitado |
| Google OAuth | ️ Pendiente habilitar en dashboard Supabase |

### Flujo de autenticación
1. Usuario accede a `/login`
2. Puede loguearse con email/password o Google
3. Se redirige a `/auth/callback` para completar OAuth
4. Al autenticarse exitosamente, se redirige a `/`
5. Si no hay sesión, se redirige a `/login`

### Archivos relacionados
- `src/app/login/page.tsx` - Formulario de login/signup
- `src/app/auth/callback/page.tsx` - Callback OAuth
- `src/hooks/useAuth.ts` - Hook de autenticación
- `src/lib/supabase.ts` - Cliente Supabase configurado

---

## 6. API de OpenRouter (IA)

### Configuración
- **Endpoint:** `https://openrouter.ai/api/v1/chat/completions`
- **Modelo:** `qwen/qwen-turbo:free`
- **API Key:** Configurada en `.env.local` y Vercel

### Endpoint de generación de mensajes
**Ruta:** `POST /api/generate-message`

**Request:**
```json
{
  "lead": { "id": "uuid", "name": "...", "company": "...", "score": "Alto", "insights": "..." },
  "type": "propuesta | seguimiento | personalizado"
}
```

**Response:**
```json
{
  "message": "Contenido generado por IA"
}
```

**Prompts generados:**
- **propuesta:** Genera propuesta comercial personalizada
- **seguimiento:** Genera mensaje de seguimiento persuasivo
- **personalizado:** Genera mensaje adaptado al score e insights

**Almacenamiento:** Los mensajes generados se guardan en la tabla `ai_messages`

---

## 7. Integración con LeadFlow

### Relación entre proyectos
| Aspecto | LeadFlow | SalesFlow |
|---------|----------|-----------|
| Propósito | Captura y califica leads | Cierra ventas |
| IA | Gemini (análisis de leads) | OpenRouter (mensajes de venta) |
| Exporta | CSV con leads calificados | Importa CSV desde LeadFlow |
| Insights | Genera score e insights | Recibe y usa insights de LeadFlow |

### Importación de leads
SalesFlow puede importar leads de dos formas:

1. **CSV:** Subir archivo CSV exportado desde LeadFlow
   - Columnas esperadas: name, company, email, phone, score, insights, gemini_score, value
   - Parsing en `ImportButton.tsx`
   
2. **API directa:** Conectar con la API de LeadFlow
   - Endpoint configurable desde el modal de importación
   - Fetch automático de leads calificados

---

## 8. Variables de Entorno

### .env.local (local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://fbdjeggrvoplweldfncz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...RBg
SUPABASE_SERVICE_ROLE_KEY=eyJ...1-I
OPENROUTER_API_KEY=sk-or-v1-...
NEXT_PUBLIC_APP_URL=https://salesflow-psi.vercel.app
SUPABASE_DB_PASSWORD=milebrijajes123
```

### Vercel (producción)
| Variable | Scope | Tipo |
|----------|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | Plain |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | Plain |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview, Development | Plain |
| `OPENROUTER_API_KEY` | Production, Preview, Development | Plain |
| `NEXT_PUBLIC_APP_URL` | Production, Preview, Development | Plain |

**Nota:** `.env.local` NO se commitea a GitHub (está en `.gitignore`)

---

## 9. GitHub Repository

- **URL:** https://github.com/mileidisjohana196-gif/salesflow
- **Usuario:** mileidisjohana196-gif
- **Visibilidad:** Público
- **Branch:** main
- **Token de acceso:** Configurado en entorno local (no commitear)

---

## 10. Vercel Deployment

- **Project ID:** `prj_JADsLROmzlt9TRkVdqSizba59d1Y`
- **URL:** https://salesflow-psi.vercel.app
- **Framework:** Next.js
- **Token de API:** Configurado en entorno local (no commitear)

### Comandos de deploy
```bash
# Deploy desde Termux
npx vercel --prod --yes --token <token>

# Deploy automático al hacer push
# Vercel detecta cambios en GitHub y deploya automáticamente
```

---

## 11. Componentes de la UI

### TopNav (`src/components/TopNav.tsx`)
- Logo SalesFlow
- Navegación: Dashboard, Pipeline, Seguimiento, Mensajería, Métricas, Configuración
- Notificaciones (badge)
- Avatar del usuario con botón de logout

### Sidebar (`src/components/Sidebar.tsx`)
- Enfoque de hoy (contactos, reuniones, propuestas pendientes)
- Tareas pendientes con contadores

### Pipeline (`src/components/Pipeline.tsx`)
- Kanban con 5 columnas
- Drag & drop con @dnd-kit
- Conexión en tiempo real con Supabase
- Métricas clave al pie

### KanbanColumn (`src/components/KanbanColumn.tsx`)
- Cards arrastrables con sortable
- Score visual (colores: verde=Alto, naranja=Caliente, gris=Medio/Bajo)
- Insights del lead
- Menú contextual para generar mensajes IA

### ImportButton (`src/components/ImportButton.tsx`)
- Modal con dos opciones: CSV o API directa
- Parsing de CSV en el cliente
- Importación batch a Supabase
- Reporte de éxito/error

---

## 12. Configuraciones Clave

### Next.js (`next.config.js`)
```js
const nextConfig = {
  webpack: (config) => {
    config.infrastructureLogging = { level: 'error' };
    return config;
  },
  turbopack: { root: '.' },
};
```

### TypeScript (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### Tailwind (`tailwind.config.ts`)
```ts
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  plugins: [],
};
```

---

## 13. Dependencias del Proyecto

```json
{
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "@supabase/ssr": "^0.6.1",
    "@supabase/supabase-js": "^2.52.1",
    "lucide-react": "^0.536.0",
    "next": "15.5.0",
    "pg": "^8.16.3",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

---

## 14. Funcionalidades Implementadas vs Pendientes

### ✅ Implementadas
| Feature | Descripción |
|---------|-------------|
| Autenticación | Email/password + UI para Google OAuth |
| Pipeline Kanban | 5 etapas con drag & drop |
| Importación CSV | Parser y carga batch a Supabase |
| Generación IA | Propuestas, seguimientos, mensajes personalizados |
| Métricas básicas | Tasa de cierre, tiempo por etapa, valor pipeline |
| Sidebar | Enfoque del día y tareas pendientes |
| RLS | Todas las tablas protegidas por usuario |

### ⏳ Pendientes
| Feature | Descripción | Prioridad |
|---------|-------------|-----------|
| Google OAuth | Habilitar provider en Supabase Dashboard | Alta |
| Dashboard | Métricas completas con gráficos | Media |
| Seguimiento | Recordatorios automáticos de follow-up | Media |
| Integración LeadFlow | Conexión API automática | Baja |
| Mensajería | Sistema de mensajes completo | Media |
| Configuración | Gestión de stages personalizables | Baja |

---

## 15. Notas para Futuros Agentes

### Para habilitar Google OAuth
1. Ir a Supabase Dashboard → Authentication → Providers
2. Activar Google
3. Obtener credenciales de Google Cloud Console
4. Configurar redirect URL: `https://<project-ref>.supabase.co/auth/v1/callback`

### Para debug en producción
- Los logs de Vercel están en: https://vercel.com/mileidisjohana196-9190s-projects/salesflow/logs
- Supabase logs: https://supabase.com/dashboard/project/fbdjeggrvoplweldfncz/logs

### Para desarrollo local
```bash
cd ~/salesflow
npm run dev
# Abre http://localhost:3000
```

### Para deploy
```bash
# El deploy es automático al hacer push a main
# O manualmente:
npx vercel --prod --yes --token <token>
```

### Credenciales críticas (NO commitear)
- Supabase Service Role Key
- OpenRouter API Key
- Supabase DB Password
- GitHub Personal Access Token

---

## 16. Arquitectura de Datos - Diagrama

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   LeadFlow  │────>│  SalesFlow  │────>│  OpenRouter │
│  (Gemini)   │ CSV │  (Next.js)  │ API │  (Qwen AI)  │
─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────▼──────┐
                    │   Supabase  │
                    │  (Postgres) │
                    │             │
                    │ - leads     │
                    │ - stages    │
                    │ - tasks     │
                    │ - messages  │
                    │ - metrics   │
                    └─────────────┘
                           ▲
                    ┌──────┴──────┐
                    │   Vercel    │
                    │  (Hosting)  │
                    └─────────────┘
```

---

**Documento generado:** 2026-05-14
**Última actualización:** 2026-05-14
**Estado del proyecto:** MVP funcional - Auth, Pipeline, Importación, IA
