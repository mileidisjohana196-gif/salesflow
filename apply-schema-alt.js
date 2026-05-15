const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://fbdjeggrvoplweldfncz.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZGplZ2dydm9wbHdlbGRmbmN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc4Njc3NCwiZXhwIjoyMDk0MzYyNzc0fQ.CuDXKlJakZNnBWJgBxoWnWAwvhd9Ns45q6dQjExh1-I';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function applySchema() {
  console.log('Aplicando schema a AppSalesFlow...');
  
  // Step 1: Create leads table
  console.log('1. Creando tabla leads...');
  const { error: leadsError } = await supabase.rpc('exec_sql', { 
    query: `CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      company TEXT, email TEXT, phone TEXT,
      score TEXT CHECK (score IN ('Alto', 'Caliente', 'Medio', 'Bajo')),
      insights TEXT, gemini_score INTEGER,
      source TEXT DEFAULT 'leadflow',
      stage TEXT NOT NULL DEFAULT 'contactado',
      value NUMERIC DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )` 
  });
  
  if (leadsError && !leadsError.message.includes('already exists')) {
    console.log('Error leads:', leadsError.message);
  } else {
    console.log('✅ Tabla leads creada');
  }
  
  // Step 2: Create pipeline_stages table
  console.log('2. Creando tabla pipeline_stages...');
  const { error: stagesError } = await supabase.rpc('exec_sql', {
    query: `CREATE TABLE IF NOT EXISTS pipeline_stages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL, color TEXT DEFAULT '#6366f1',
      order_index INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`
  });
  
  if (stagesError && !stagesError.message.includes('already exists')) {
    console.log('Error stages:', stagesError.message);
  } else {
    console.log('✅ Tabla pipeline_stages creada');
  }
  
  // Step 3: Insert default stages
  console.log('3. Insertando stages por defecto...');
  const { error: insertError } = await supabase.from('pipeline_stages').insert([
    { name: 'Contactado', color: '#3b82f6', order_index: 0 },
    { name: 'Reunión agendada', color: '#a855f7', order_index: 1 },
    { name: 'Propuesta enviada', color: '#22c55e', order_index: 2 },
    { name: 'Negociación', color: '#f59e0b', order_index: 3 },
    { name: 'Cerrado', color: '#10b981', order_index: 4 }
  ]);
  
  if (insertError && !insertError.message.includes('duplicate')) {
    console.log('Error insert:', insertError.message);
  } else {
    console.log('✅ Stages por defecto insertados');
  }
  
  // Step 4: Create tasks table
  console.log('4. Creando tabla tasks...');
  const { error: tasksError } = await supabase.rpc('exec_sql', {
    query: `CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
      title TEXT NOT NULL, description TEXT,
      due_date TIMESTAMPTZ, completed BOOLEAN DEFAULT FALSE,
      type TEXT CHECK (type IN ('llamada', 'email', 'reunion', 'seguimiento')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`
  });
  
  if (tasksError && !tasksError.message.includes('already exists')) {
    console.log('Error tasks:', tasksError.message);
  } else {
    console.log('✅ Tabla tasks creada');
  }
  
  // Step 5: Create ai_messages table
  console.log('5. Creando tabla ai_messages...');
  const { error: messagesError } = await supabase.rpc('exec_sql', {
    query: `CREATE TABLE IF NOT EXISTS ai_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      type TEXT CHECK (type IN ('propuesta', 'seguimiento', 'personalizado')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`
  });
  
  if (messagesError && !messagesError.message.includes('already exists')) {
    console.log('Error messages:', messagesError.message);
  } else {
    console.log('✅ Tabla ai_messages creada');
  }
  
  // Step 6: Create daily_metrics table
  console.log('6. Creando tabla daily_metrics...');
  const { error: metricsError } = await supabase.rpc('exec_sql', {
    query: `CREATE TABLE IF NOT EXISTS daily_metrics (
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
    )`
  });
  
  if (metricsError && !metricsError.message.includes('already exists')) {
    console.log('Error metrics:', metricsError.message);
  } else {
    console.log('✅ Tabla daily_metrics creada');
  }
  
  // Step 7: Enable RLS and create policies
  console.log('7. Habilitando RLS...');
  const tables = ['leads', 'pipeline_stages', 'tasks', 'ai_messages', 'daily_metrics'];
  for (const table of tables) {
    await supabase.rpc('exec_sql', {
      query: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`
    });
    await supabase.rpc('exec_sql', {
      query: `CREATE POLICY "Users can only access their own ${table}" ON ${table} FOR ALL USING (auth.uid() = user_id)`
    });
  }
  console.log('✅ RLS habilitado');
  
  console.log('\n🎉 Schema aplicado correctamente!');
}

applySchema().catch(err => {
  console.error('Error fatal:', err.message);
  console.log('\nAlternativa: Ejecutá el SQL manualmente desde el dashboard de Supabase');
  console.log('URL: https://supabase.com/dashboard/project/fbdjeggrvoplweldfncz/sql/new');
});
