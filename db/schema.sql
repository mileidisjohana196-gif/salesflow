-- SalesFlow Schema - Enfocado solo en cierre de ventas
-- Los leads ya vienen calificados desde LeadFlow

-- Tabla de leads importados desde LeadFlow
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  score TEXT CHECK (score IN ('Alto', 'Caliente', 'Medio', 'Bajo')),
  insights TEXT,
  gemini_score INTEGER,
  source TEXT DEFAULT 'leadflow',
  stage TEXT NOT NULL DEFAULT 'contactado',
  value NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_user_stage ON leads(user_id, stage);

-- Tabla de pipeline (etapas personalizables)
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stages por defecto
INSERT INTO pipeline_stages (name, color, order_index) VALUES
  ('Contactado', '#3b82f6', 0),
  ('Reunión agendada', '#a855f7', 1),
  ('Propuesta enviada', '#22c55e', 2),
  ('Negociación', '#f59e0b', 3),
  ('Cerrado', '#10b981', 4)
ON CONFLICT DO NOTHING;

-- Tabla de tareas / follow-ups
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  completed BOOLEAN DEFAULT FALSE,
  type TEXT CHECK (type IN ('llamada', 'email', 'reunion', 'seguimiento')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON tasks(user_id, due_date, completed);

-- Tabla de mensajes generados por IA
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('propuesta', 'seguimiento', 'personalizado')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de métricas diarias
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  leads_contacted INTEGER DEFAULT 0,
  meetings_booked INTEGER DEFAULT 0,
  proposals_sent INTEGER DEFAULT 0,
  deals_closed INTEGER DEFAULT 0,
  total_value NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- RLS Policies
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own leads" ON leads
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own stages" ON pipeline_stages
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own ai_messages" ON ai_messages
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own metrics" ON daily_metrics
  FOR ALL USING (auth.uid() = user_id);
