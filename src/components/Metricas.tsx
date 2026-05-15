'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { TrendingUp, DollarSign, Target, Award, Users, Clock, BarChart2 } from 'lucide-react';

type StageKey = 'contactado' | 'reunion_agendada' | 'propuesta_enviada' | 'negociacion' | 'cerrado';
const STAGES: { key: StageKey; label: string; color: string; bg: string }[] = [
  { key: 'contactado', label: 'Contactado', color: '#3b82f6', bg: 'bg-blue-500' },
  { key: 'reunion_agendada', label: 'Reunión agendada', color: '#a855f7', bg: 'bg-purple-500' },
  { key: 'propuesta_enviada', label: 'Propuesta enviada', color: '#22c55e', bg: 'bg-green-500' },
  { key: 'negociacion', label: 'Negociación', color: '#f59e0b', bg: 'bg-amber-500' },
  { key: 'cerrado', label: 'Cerrado', color: '#10b981', bg: 'bg-emerald-500' },
];
type LeadRow = { stage: StageKey; value: number; score: string; name: string; company: string };

export default function Metricas() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [msgCount, setMsgCount] = useState(0);
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [leadsRes, msgsRes, tasksRes] = await Promise.all([
        supabase.from('leads').select('stage, value, score, name, company').eq('user_id', user.id),
        supabase.from('ai_messages').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('tasks').select('completed').eq('user_id', user.id),
      ]);
      if (leadsRes.data) setLeads(leadsRes.data as LeadRow[]);
      setMsgCount(msgsRes.count ?? 0);
      if (tasksRes.data) setTaskStats({ total: tasksRes.data.length, completed: tasksRes.data.filter((t: any) => t.completed).length });
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return <div className="p-6 flex items-center justify-center min-h-96"><div className="text-purple-600 animate-pulse">Cargando métricas...</div></div>;

  const totalLeads = leads.length;
  const totalValue = leads.reduce((s, l) => s + (l.value || 0), 0);
  const closedLeads = leads.filter(l => l.stage === 'cerrado');
  const closedValue = closedLeads.reduce((s, l) => s + (l.value || 0), 0);
  const closeRate = totalLeads > 0 ? Math.round((closedLeads.length / totalLeads) * 100) : 0;
  const avgValue = totalLeads > 0 ? Math.round(totalValue / totalLeads) : 0;
  const byStage: Record<StageKey, { count: number; value: number }> = { contactado: { count: 0, value: 0 }, reunion_agendada: { count: 0, value: 0 }, propuesta_enviada: { count: 0, value: 0 }, negociacion: { count: 0, value: 0 }, cerrado: { count: 0, value: 0 } };
  leads.forEach(l => { if (byStage[l.stage]) { byStage[l.stage].count++; byStage[l.stage].value += l.value || 0; } });
  const scoreCount = { Alto: 0, Caliente: 0, Medio: 0, Bajo: 0 };
  leads.forEach(l => { if (l.score in scoreCount) scoreCount[l.score as keyof typeof scoreCount]++; });
  const topLeads = [...leads].filter(l => l.value > 0).sort((a, b) => b.value - a.value).slice(0, 5);
  const kpis = [
    { label: 'Total leads', value: totalLeads, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Valor pipeline', value: `$${totalValue.toLocaleString('es')}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Tasa de cierre', value: `${closeRate}%`, icon: Target, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Ingresos cerrados', value: `$${closedValue.toLocaleString('es')}`, icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Ticket promedio', value: `$${avgValue.toLocaleString('es')}`, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Mensajes IA', value: msgCount, icon: BarChart2, color: 'text-pink-600', bg: 'bg-pink-50' },
    { label: 'Tareas completadas', value: `${taskStats.completed}/${taskStats.total}`, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Métricas</h1><p className="text-sm text-gray-500 mt-0.5">Análisis completo de tu rendimiento en ventas</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`${kpi.bg} w-9 h-9 rounded-lg flex items-center justify-center mb-3`}><kpi.icon className={`w-5 h-5 ${kpi.color}`} /></div>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Valor por etapa</h2>
          {totalValue === 0 ? <p className="text-sm text-gray-400 text-center py-8">No hay valor asignado a los leads</p> : (
            <div className="space-y-3">
              {STAGES.map(s => {
                const { count, value } = byStage[s.key];
                const pct = totalValue > 0 ? Math.round((value / totalValue) * 100) : 0;
                return (
                  <div key={s.key} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-xs text-gray-600 w-32 truncate">{s.label}</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.max(pct, value > 0 ? 2 : 0)}%`, backgroundColor: s.color }} /></div>
                    <span className="text-xs font-medium text-gray-700 w-20 text-right">${value.toLocaleString('es')}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Top 5 leads por valor</h2>
          {topLeads.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">Asigná valor a los leads para ver el ranking</p> : (
            <div className="space-y-3">
              {topLeads.map((lead, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-300 w-5">{i + 1}</span>
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 text-sm font-bold flex-shrink-0">{lead.name?.[0]?.toUpperCase()}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-800 truncate">{lead.name}</p><p className="text-xs text-gray-400 truncate">{lead.company || 'Sin empresa'}</p></div>
                  <div className="text-right flex-shrink-0"><p className="text-sm font-bold text-gray-900">${lead.value.toLocaleString('es')}</p><p className="text-xs text-gray-400">{lead.stage.replace('_', ' ')}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
