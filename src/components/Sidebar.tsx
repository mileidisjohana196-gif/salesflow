'use client';

import { CheckCircle, Calendar, Send, AlertCircle } from 'lucide-react';

interface SidebarProps {
  filter: { type: string; value?: string };
  onStageClick: (stage: string) => void;
  onAllClick: () => void;
}

export default function Sidebar({ filter, onStageClick, onAllClick }: SidebarProps) {
  const stages = [
    { id: 'contactado', label: 'Contact de hoy', icon: CheckCircle, active: filter.type === 'stage' && filter.value === 'contactado' },
    { id: 'reunion_agendada', label: 'Reunión agendada', icon: Calendar, active: filter.type === 'stage' && filter.value === 'reunion_agendada' },
    { id: 'propuesta_enviada', label: 'Propuesta enviada', icon: Send, active: filter.type === 'stage' && filter.value === 'propuesta_enviada', count: 1 },
  ];

  const tasks = [
    { id: 'enfoque', label: 'Enfoque del día', icon: AlertCircle, active: filter.type === 'task', count: 2 },
    { id: 'pendientes', label: 'Tareas pendientes', icon: AlertCircle, active: false, count: 3 },
  ];

  return (
    <aside className="w-64 bg-purple-700 text-white flex flex-col">
      <div className="p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-200 mb-3">Enfoque de hoy</h3>
        <div className="space-y-1">
          <button onClick={onAllClick} className={`w-full flex items-center gap-2 p-2 rounded-lg text-sm transition-colors ${filter.type === 'all' ? 'bg-purple-600' : 'hover:bg-purple-600'}`}>
            <CheckCircle className="w-4 h-4 text-green-400" /><span>Todos</span>
          </button>
          {stages.map(s => (
            <button key={s.id} onClick={() => onStageClick(s.id)} className={`w-full flex items-center gap-2 p-2 rounded-lg text-sm transition-colors ${s.active ? 'bg-purple-600' : 'hover:bg-purple-600'}`}>
              <s.icon className="w-4 h-4 text-purple-300" />
              <span className="flex items-center gap-2 flex-1 justify-between">{s.label}{s.count && <span className="bg-yellow-400 text-purple-900 text-xs px-2 py-0.5 rounded-full">{s.count}</span>}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="p-4 border-t border-purple-600 mt-auto">
        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-200 mb-3">Tareas pendientes</h3>
        <div className="space-y-1">
          {tasks.map(t => (
            <button key={t.id} className="w-full flex items-center gap-2 p-2 rounded-lg text-sm hover:bg-purple-600">
              <t.icon className="w-4 h-4 text-yellow-400" />
              <span className="flex items-center gap-2 flex-1 justify-between">{t.label}{t.count && <span className="bg-yellow-400 text-purple-900 text-xs px-2 py-0.5 rounded-full">{t.count}</span>}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
