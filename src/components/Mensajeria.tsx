'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Send, Bot, Sparkles, Copy, Check, Trash2, RefreshCw } from 'lucide-react';

type Message = { id: string; content: string; type: string; lead_name?: string; created_at: string; };
type LeadOption = { id: string; name: string; company: string; score: string; insights: string; email?: string; phone?: string; };

export default function Mensajeria() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedLead, setSelectedLead] = useState('');
  const [msgType, setMsgType] = useState('propuesta');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => { if (!user) return; loadData(); }, [user]);

  const loadData = async () => {
    if (!user) return;
    const [msgsRes, leadsRes] = await Promise.all([
      supabase.from('ai_messages').select('*, leads(name)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('leads').select('id, name, company, score, insights, email, phone').eq('user_id', user.id).order('name'),
    ]);
    if (msgsRes.data) setMessages(msgsRes.data.map((m: any) => ({ ...m, lead_name: m.leads?.name })));
    if (leadsRes.data) setLeads(leadsRes.data);
    setLoading(false);
  };

  const generateMessage = async () => {
    if (!selectedLead || generating || !user) return;
    setGenerating(true);
    const lead = leads.find(l => l.id === selectedLead);
    if (!lead) { setGenerating(false); return; }
    try {
      const res = await fetch('/api/generate-message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lead, type: msgType, user_id: user.id }) });
      const data = await res.json();
      if (data.message) await loadData();
      else alert(`Error: ${data.error ?? 'Error desconocido'}`);
    } catch { alert('Error de conexión'); }
    setGenerating(false);
  };

  const copyMessage = (id: string, content: string) => { navigator.clipboard.writeText(content); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };
  const deleteMessage = async (id: string) => { await supabase.from('ai_messages').delete().eq('id', id); setMessages(prev => prev.filter(m => m.id !== id)); };

  const typeLabels: Record<string, string> = { propuesta: 'Propuesta', seguimiento: 'Seguimiento', personalizado: 'Personalizado' };
  const typeColors: Record<string, string> = { propuesta: 'bg-purple-100 text-purple-800', seguimiento: 'bg-blue-100 text-blue-800', personalizado: 'bg-green-100 text-green-800' };

  if (loading) return <div className="p-6 flex items-center justify-center min-h-96"><div className="text-purple-600 animate-pulse">Cargando mensajería...</div></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Mensajería IA</h1><p className="text-sm text-gray-500 mt-0.5">Genera mensajes de ventas personalizados con inteligencia artificial</p></div>
        <button onClick={loadData} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"><RefreshCw className="w-4 h-4" /></button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Generar nuevo mensaje</h2>
        {leads.length === 0 ? <div className="text-center py-6 text-gray-400 text-sm"><Bot className="w-8 h-8 mx-auto mb-2 opacity-40" />No hay leads. Importá desde LeadFlow primero.</div> : (
          <div className="flex flex-col sm:flex-row gap-3">
            <select value={selectedLead} onChange={e => setSelectedLead(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500">
              <option value="">Seleccionar lead...</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.name}{l.company ? ` · ${l.company}` : ''} [{l.score}]</option>)}
            </select>
            <select value={msgType} onChange={e => setMsgType(e.target.value)} className="sm:w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500">
              <option value="propuesta">📝 Propuesta</option>
              <option value="seguimiento">📤 Seguimiento</option>
              <option value="personalizado">🤖 Personalizado</option>
            </select>
            <button onClick={generateMessage} disabled={generating || !selectedLead} className="sm:w-36 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {generating ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generando...</> : <><Sparkles className="w-4 h-4" />Generar</>}
            </button>
          </div>
        )}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Historial <span className="text-sm font-normal text-gray-400">({messages.length} mensajes)</span></h2>
        {messages.length === 0 ? <div className="text-center py-12 text-gray-400"><Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">Aún no hay mensajes generados.</p></div> : (
          <div className="space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[msg.type] ?? 'bg-gray-100 text-gray-700'}`}>{typeLabels[msg.type] ?? msg.type}</span>
                    {msg.lead_name && <span className="text-xs text-gray-500">→ {msg.lead_name}</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short' })}</span>
                    <button onClick={() => copyMessage(msg.id, msg.content)} className="p-1.5 hover:bg-gray-100 rounded-lg">{copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}</button>
                    <button onClick={() => deleteMessage(msg.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" /></button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
