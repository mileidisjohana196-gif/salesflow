'use client';

import { useState, useEffect, useMemo } from 'react';
import { DndContext, DragEndEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAppContext } from '@/lib/context';
import KanbanColumn from './KanbanColumn';
import ImportButton from './ImportButton';

const stageIds = ['contactado', 'reunion_agendada', 'propuesta_enviada', 'negociacion', 'cerrado'] as const;
type StageId = typeof stageIds[number];

const stageConfig: Record<StageId, { name: string; color: string }> = {
  contactado: { name: 'Contactado', color: '#3b82f6' },
  reunion_agendada: { name: 'Reunión agendada', color: '#a855f7' },
  propuesta_enviada: { name: 'Propuesta enviada', color: '#22c55e' },
  negociacion: { name: 'Negociación', color: '#f59e0b' },
  cerrado: { name: 'Cerrado', color: '#10b981' },
};

type Lead = { id: string; name: string; company: string; score: string; insights: string; value: number; email?: string; phone?: string; stage: string };

export default function Pipeline() {
  const { user } = useAuth();
  const { filter } = useAppContext();
  const [leads, setLeads] = useState<Record<StageId, Lead[]>>({ contactado: [], reunion_agendada: [], propuesta_enviada: [], negociacion: [], cerrado: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadLeads = async () => {
      const { data, error } = await supabase.from('leads').select('*').eq('user_id', user.id);
      if (!error && data) {
        const grouped: Record<StageId, Lead[]> = { contactado: [], reunion_agendada: [], propuesta_enviada: [], negociacion: [], cerrado: [] };
        data.forEach((lead: any) => {
          const stage = lead.stage as StageId;
          if (grouped[stage]) {
            grouped[stage].push({ id: lead.id, name: lead.name || 'Sin nombre', company: lead.company || '', score: lead.score || 'Medio', insights: lead.insights || '', value: lead.value || 0, email: lead.email, phone: lead.phone, stage: lead.stage });
          }
        });
        setLeads(grouped);
      }
      setLoading(false);
    };
    loadLeads();
  }, [user]);

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
    const { error } = await supabase.from('leads').update({ stage: targetStage }).eq('id', activeId);
    if (!error) {
      setLeads(prev => {
        const newLeads = { ...prev };
        const lead = prev[sourceStage!].find(l => l.id === activeId);
        if (!lead) return prev;
        newLeads[sourceStage!] = prev[sourceStage!].filter(l => l.id !== activeId);
        newLeads[targetStage!] = [...prev[targetStage!], { ...lead, stage: targetStage }];
        return newLeads;
      });
    }
  };

  const initialStages = stageIds.map(id => ({ id, ...stageConfig[id] }));
  
  // Apply filter
  const filteredLeads = useMemo(() => {
    if (filter.type === 'all') return leads;
    if (filter.type === 'stage') {
      const filtered: Record<StageId, Lead[]> = { contactado: [], reunion_agendada: [], propuesta_enviada: [], negociacion: [], cerrado: [] };
      filtered[filter.value as StageId] = leads[filter.value as StageId] || [];
      return filtered;
    }
    return leads;
  }, [leads, filter]);

  const totalLeads = Object.values(filteredLeads).flat().length;

  if (loading) return <div className="p-6 flex items-center justify-center"><div className="text-purple-600">Cargando...</div></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
          <p className="text-sm text-gray-500">{totalLeads} leads{filter.type === 'stage' ? ` en "${stageConfig[filter.value as StageId]?.name}"` : ''}</p>
        </div>
        <ImportButton />
      </div>
      <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <SortableContext items={Object.keys(filteredLeads)} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {initialStages.map(stage => (
              <KanbanColumn key={stage.id} stage={stage} leads={filteredLeads[stage.id as StageId] || []} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Métricas</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-500">Cierre</div><div className="text-lg font-bold">{totalLeads > 0 ? Math.round((leads.cerrado.length / totalLeads) * 100) : 0}%</div></div>
          <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-500">Tiempo/etapa</div><div className="text-lg font-bold">3.5d</div></div>
          <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-500">Valor</div><div className="text-lg font-bold">${Object.values(leads).flat().reduce((s, l) => s + (l.value || 0), 0).toLocaleString()}</div></div>
        </div>
      </div>
    </div>
  );
}
