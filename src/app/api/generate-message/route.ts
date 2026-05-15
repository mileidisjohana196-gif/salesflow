import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { lead, type } = await request.json();
    if (!lead?.id || !type) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const prompts: Record<string, string> = {
      propuesta: `Propuesta comercial para ${lead.name} de ${lead.company}. Score: ${lead.score}. Insights: ${lead.insights}. Sé profesional y enfocado en cerrar.`,
      seguimiento: `Mensaje de seguimiento para ${lead.name} de ${lead.company}. Score: ${lead.score}. Insights: ${lead.insights}. Amable pero persuasivo.`,
      personalizado: `Mensaje personalizado para ${lead.name} de ${lead.company}. Score: ${lead.score}. Insights: ${lead.insights}. Adaptá el tono al score.`,
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000' },
      body: JSON.stringify({ model: 'qwen/qwen-turbo:free', messages: [{ role: 'user', content: prompts[type] || prompts.personalizado }], max_tokens: 400 }),
    });

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || 'No se pudo generar el mensaje.';

    await supabase.from('ai_messages').insert({ lead_id: lead.id, content: message, type });

    return NextResponse.json({ message });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
