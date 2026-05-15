'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Send, Bot, Sparkles, Copy, Check } from 'lucide-react';

type Message = {
  id: string;
  content: string;
  type: string;
  lead_name?: string;
  created_at: string;
};

export default function Mensajeria() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedLead, setSelectedLead] = useState('');
  const [msgType, setMsgType] = useState('propuesta');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    const { data: msgs } = await supabase.from('ai_messages').select('*, leads(name)').eq('user_id', user!.id).order('created_at', { ascending: false });
    const { data: leadsData } = await supabase.from('leads').select('id, name').eq('user_id', user!.id);
    if (msgs) setMessages(msgs.map((m: any) => ({ ...m, lead_name: m.leads?.name })));
    if (leadsData) setLeads(leadsData);
    setLoading(false);
  };

  const generateMessage = async () => {
    if (!selectedLead || generating) return;
    setGenerating(true);
    const lead = leads.find(l => l.id === selectedLead);
    if (!lead) { setGenerating(false); return; }

    try {
      const res = await fetch('/api/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead, type: msgType }),
      });
      const data = await res.json();
      if (data.message) loadData();
    } catch (e) { console.error(e); }
    setGenerating(false);
  };

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const typeLabels: Record<string, string> = { propuesta: 'Propuesta', seguimiento: 'Seguimiento', personalizado: 'Personalizado' };
  const typeIcons: Record<string, any> = { propuesta: Sparkles, seguimiento: Send, personalizado: Bot };

  if (loading) return <div className="p-6 text-purple-600">Cargando...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mensajería IA</h1>

      {/* Generador */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-lg font-semibold mb-3">Generar nuevo mensaje</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select value={selectedLead} onChange={e => setSelectedLead(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Seleccionar lead...</option>
            {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <select value={msgType} onChange={e => setMsgType(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="propuesta">Propuesta</option>
            <option value="seguimiento">Seguimiento</option>
            <option value="personalizado">Personalizado</option>
          </select>
          <button onClick={generateMessage} disabled={generating || !selectedLead} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {generating ? 'Generando...' : <><Sparkles className="w-4 h-4" /> Generar</>}
          </button>
        </div>
      </div>

      {/* Historial */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-lg font-semibold mb-3">Historial ({messages.length})</h2>
        {messages.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No hay mensajes generados aún</p>
        ) : (
          <div className="space-y-3">
            {messages.map(msg => {
              const Icon = typeIcons[msg.type] || Bot;
              return (
                <div key={msg.id} className="border border-gray-100 rounded-lg p-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">{typeLabels[msg.type] || msg.type}</span>
                      {msg.lead_name && <span className="text-xs text-gray-500">→ {msg.lead_name}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleDateString('es')}</span>
                      <button onClick={() => copyMessage(msg.id, msg.content)} className="p-1 hover:bg-gray-100 rounded">
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.content}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
