'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { DndContext, DragEndEvent, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import KanbanColumn from './KanbanColumn';
import ImportButton from './ImportButton';

const stageIds = ['contactado','reunion_agendada','propuesta_enviada','negociacion','cerrado'] as const;
type StageId = (typeof stageIds)[number];

const stageConfig: Record<StageId, { name: string; color: string }> = {
  contactado:        { name: 'Contactado',        color: '#3b82f6' },
  reunion_agendada:  { name: 'Reunión agendada',  color: '#a855f7' },
  propuesta_enviada: { name: 'Propuesta enviada', color: '#22c55e' },
  negociacion:       { name: 'Negociación',        color: '#f59e0b' },
  cerrado:           { name: 'Cerrado',            color: '#10b981' },
};

type Lead = { id: string; name: string; company: string; score: string; insights: string; value: number; email?: string; phone?: string; stage: string; };

const emptyLeads = (): Record<StageId, Lead[]> => ({ contactado: [], reunion_agendada: [], propuesta_enviada: [], negociacion: [], cerrado: [] });

export default function Pipeline({ filter }: { filter?: { type: string; value?: string } }) {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Record<StageId, Lead[]>>(emptyLeads());
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const loadLeads = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('leads').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (!error && data) {
      const grouped = emptyLeads();
      data.forEach((lead: any) => {
        const stage = lead.stage as StageId;
        if (grouped[stage]) grouped[stage].push({ id: lead.id, name: lead.name || 'Sin nombre', company: lead.company || '', score: lead.score || 'Medio', insights: lead.insights || '', value: lead.value || 0, email: lead.email, phone: lead.phone, stage: lead.stage });
      });
      setLeads(grouped);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !user) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    let targetStage: StageId | null = null;
    if (stageIds.includes(overId as StageId)) targetStage = overId as StageId;
    else { for (const stage of stageIds) { if (leads[stage].some(l => l.id === overId)) { targetStage = stage; break; } } }
    if (!targetStage) return;
    let sourceStage: StageId | null = null;
    for (const stage of stageIds) { if (leads[stage].some(l => l.id === activeId)) { sourceStage = stage; break; } }
    if (!sourceStage || sourceStage === targetStage) return;
    const { error } = await supabase.from('leads').update({ stage: targetStage, updated_at: new Date().toISOString() }).eq('id', activeId);
    if (!error) {
      setLeads(prev => {
        const next = { ...prev };
        const lead = prev[sourceStage!].find(l => l.id === activeId);
        if (!lead) return prev;
        next[sourceStage!] = prev[sourceStage!].filter(l => l.id !== activeId);
        next[targetStage!] = [...prev[targetStage!], { ...lead, stage: targetStage! }];
        return next;
      });
    }
  };

  const safeFilter = filter ?? { type: 'all' };
  const filteredLeads = useMemo(() => {
    if (safeFilter.type === 'all') return leads;
    if (safeFilter.type === 'stage') { const f = emptyLeads(); const key = safeFilter.value as StageId; if (key && leads[key]) f[key] = leads[key]; return f; }
    return leads;
  }, [leads, safeFilter]);

  const allLeads = Object.values(leads).flat();
  const totalValue = allLeads.reduce((s, l) => s + (l.value || 0), 0);
  const closeRate = allLeads.length > 0 ? Math.round((leads.cerrado.length / allLeads.length) * 100) : 0;
  const totalFiltered = Object.values(filteredLeads).flat().length;

  if (loading) return <div className="p-6 flex items-center justify-center min-h-96"><div className="text-purple-600 animate-pulse">Cargando pipeline...</div></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline de Ventas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{totalFiltered} lead{totalFiltered !== 1 ? 's' : ''}{safeFilter.type === 'stage' && safeFilter.value ? ` en "${stageConfig[safeFilter.value as StageId]?.name}"` : ' en total'}</p>
        </div>
        <ImportButton onImportComplete={loadLeads} />
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <SortableContext items={stageIds as unknown as string[]} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stageIds.map(id => <KanbanColumn key={id} stage={{ id, ...stageConfig[id] }} leads={filteredLeads[id] || []} />)}
          </div>
        </SortableContext>
      </DndContext>
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Resumen del pipeline</h2>
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-500 mb-1">Total leads</div><div className="text-xl font-bold text-gray-900">{allLeads.length}</div></div>
          <div className="bg-blue-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-500 mb-1">En negociación</div><div className="text-xl font-bold text-blue-700">{leads.negociacion.length}</div></div>
          <div className="bg-green-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-500 mb-1">Tasa de cierre</div><div className="text-xl font-bold text-green-700">{closeRate}%</div></div>
          <div className="bg-purple-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-500 mb-1">Valor total</div><div className="text-xl font-bold text-purple-700">${totalValue.toLocaleString('es')}</div></div>
        </div>
      </div>
    </div>
  );
}
