import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { cookie: (await cookies()).toString() },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lead, type } = await request.json();

    const prompt = type === 'propuesta' 
      ? `Generá una propuesta comercial personalizada para el lead "${lead.name}" de "${lead.company}". 
         Score: ${lead.score}, Insights: ${lead.insights}.
         La propuesta debe ser profesional, concisa y enfocada en cerrar la venta.`
      : type === 'seguimiento'
      ? `Generá un mensaje de seguimiento para el lead "${lead.name}" de "${lead.company}".
         Score: ${lead.score}, Insights: ${lead.insights}.
         El mensaje debe ser amable pero persuasivo, recordando el valor de nuestro servicio.`
      : `Generá un mensaje personalizado para el lead "${lead.name}" de "${lead.company}".
         Score: ${lead.score}, Insights: ${lead.insights}.
         Adaptá el tono según el score y los insights del lead.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: 'qwen/qwen-turbo:free',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || '';

    // Guardar mensaje en BD
    await supabase.from('ai_messages').insert({
      user_id: user.id,
      lead_id: lead.id,
      content: message,
      type,
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error generating message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
