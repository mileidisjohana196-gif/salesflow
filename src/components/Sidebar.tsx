'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Calendar, Send, AlertCircle, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps { filter: { type: string; value?: string }; onStageClick: (stage: string) => void; onAllClick: () => void; }
type StageCounts = { contactado: number; reunion_agendada: number; propuesta_enviada: number; negociacion: number; cerrado: number; total: number; };

export default function Sidebar({ filter, onStageClick, onAllClick }: SidebarProps) {
  const { user } = useAuth();
  const [stageCounts, setStageCounts] = useState<StageCounts>({ contactado: 0, reunion_agendada: 0, propuesta_enviada: 0, negociacion: 0, cerrado: 0, total: 0 });
  const [taskCount, setTaskCount] = useState({ pending: 0, overdue: 0 });

  useEffect(() => {
    if (!user) return;
    const loadCounts = async () => {
      const { data: leads } = await supabase.from('leads').select('stage').eq('user_id', user.id);
      if (leads) {
        const counts: StageCounts = { contactado: 0, reunion_agendada: 0, propuesta_enviada: 0, negociacion: 0, cerrado: 0, total: leads.length };
        leads.forEach((l: any) => { if (l.stage in counts) (counts as any)[l.stage]++; });
        setStageCounts(counts);
      }
      const now = new Date().toISOString();
      const { data: tasks } = await supabase.from('tasks').select('due_date, completed').eq('user_id', user.id).eq('completed', false);
      if (tasks) { const overdue = tasks.filter((t: any) => t.due_date && t.due_date < now).length; setTaskCount({ pending: tasks.length, overdue }); }
    };
    loadCounts();
    const ch = supabase.channel('sidebar-leads').on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, loadCounts).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const stageItems = [
    { id: 'contactado', label: 'Contactado', icon: CheckCircle, count: stageCounts.contactado, iconColor: 'text-blue-300' },
    { id: 'reunion_agendada', label: 'Reunión agendada', icon: Calendar, count: stageCounts.reunion_agendada, iconColor: 'text-purple-300' },
    { id: 'propuesta_enviada', label: 'Propuesta enviada', icon: Send, count: stageCounts.propuesta_enviada, iconColor: 'text-green-300' },
    { id: 'negociacion', label: 'Negociación', icon: AlertCircle, count: stageCounts.negociacion, iconColor: 'text-yellow-300' },
    { id: 'cerrado', label: 'Cerrado ✓', icon: CheckCircle, count: stageCounts.cerrado, iconColor: 'text-emerald-300' },
  ];

  return (
    <aside className="w-64 bg-purple-700 text-white flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-purple-600">
        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-200 mb-3">Vista rápida</h3>
        <button onClick={onAllClick} className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${filter.type === 'all' ? 'bg-purple-500' : 'hover:bg-purple-600'}`}>
          <span className="flex items-center gap-2"><Users className="w-4 h-4 text-purple-200" />Todos los leads</span>
          {stageCounts.total > 0 && <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">{stageCounts.total}</span>}
        </button>
      </div>
      <div className="p-4 flex-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-200 mb-3">Por etapa</h3>
        <div className="space-y-1">
          {stageItems.map(s => (
            <button key={s.id} onClick={() => onStageClick(s.id)} className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${filter.type === 'stage' && filter.value === s.id ? 'bg-purple-500' : 'hover:bg-purple-600'}`}>
              <span className="flex items-center gap-2"><s.icon className={`w-4 h-4 ${s.iconColor}`} /><span className="truncate">{s.label}</span></span>
              {s.count > 0 && <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full flex-shrink-0">{s.count}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4 border-t border-purple-600">
        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-200 mb-3">Seguimiento</h3>
        <div className="space-y-1.5">
          {taskCount.overdue > 0 && <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/20"><span className="flex items-center gap-2 text-sm text-red-200"><AlertCircle className="w-4 h-4 text-red-300" />Vencidas</span><span className="bg-red-400 text-white text-xs px-1.5 py-0.5 rounded-full">{taskCount.overdue}</span></div>}
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-purple-600 cursor-default"><span className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-purple-300" />Tareas pendientes</span>{taskCount.pending > 0 && <span className="bg-yellow-400 text-purple-900 text-xs px-1.5 py-0.5 rounded-full font-semibold">{taskCount.pending}</span>}</div>
        </div>
      </div>
    </aside>
  );
}
