'use client';

import { useState } from 'react';
import { DndContext, DragEndEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
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

type Lead = { id: string; name: string; company: string; score: string; insights: string };

const initialLeads: Record<StageId, Lead[]> = {
  contactado: [
    { id: '1', name: 'Amon Strams', company: 'Company', score: 'Alto', insights: 'Interesado en escalabilidad' },
    { id: '2', name: 'Amon Holos', company: 'Company', score: 'Alto', insights: 'Interesado en escalabilidad' },
    { id: '3', name: 'Kevin Barela', company: 'Company', score: 'Caliente', insights: 'Presupuesto confirmado' },
  ],
  reunion_agendada: [
    { id: '4', name: 'Jom Faltants', company: 'Company', score: 'Alto', insights: 'Interesado en escalabilidad' },
    { id: '5', name: 'Roroot Adams', company: 'Company', score: 'Alto', insights: 'Presupuesto confirmado' },
  ],
  propuesta_enviada: [
    { id: '6', name: 'Robbet Sovando', company: 'Company', score: 'Caliente', insights: 'Interesado en escalabilidad' },
    { id: '7', name: 'Marksllamiton', company: 'Company', score: 'Caliente', insights: 'Presupuesto confirmado' },
    { id: '8', name: 'Jonon Wollemonton', company: 'Company', score: 'Alto', insights: 'Presupuesto confirmado' },
  ],
  negociacion: [
    { id: '9', name: 'Naik Srole', company: 'Company', score: 'Caliente', insights: 'Presupuesto confirmado' },
    { id: '10', name: 'Ketin Fipala', company: 'Company', score: 'Caliente', insights: 'Presupuesto escalabilidad' },
  ],
  cerrado: [
    { id: '11', name: 'Sonca Coment', company: 'Company', score: 'Alto', insights: 'Interesado en escalabilidad' },
    { id: '12', name: 'Marvio Blinear', company: 'Company', score: 'Alto', insights: 'Presupuesto confirmado' },
  ],
};

export default function Pipeline() {
  const [leads, setLeads] = useState(initialLeads);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    setLeads((prev) => {
      const newLeads = { ...prev } as Record<StageId, Lead[]>;
      let sourceStage: StageId | null = null;
      let targetStage: StageId | null = null;
      let leadData: Lead | null = null;

      // Find source stage and lead
      for (const stage of stageIds) {
        const lead = prev[stage].find((l) => l.id === activeId);
        if (lead) {
          sourceStage = stage;
          leadData = lead;
          break;
        }
      }

      if (!leadData || !sourceStage) return prev;

      // Check if overId is a stage id
      if (stageIds.includes(overId as StageId)) {
        targetStage = overId as StageId;
      } else {
        // Find target stage from lead id
        for (const stage of stageIds) {
          if (prev[stage].some((l) => l.id === overId)) {
            targetStage = stage;
            break;
          }
        }
      }

      if (!targetStage || sourceStage === targetStage) return prev;

      // Move lead
      newLeads[sourceStage] = prev[sourceStage].filter((l) => l.id !== activeId);
      newLeads[targetStage] = [...prev[targetStage], leadData];

      return newLeads;
    });
  };

  const initialStages = stageIds.map((id) => ({ id, ...stageConfig[id] }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
        <div className="flex gap-3">
          <ImportButton />
        </div>
      </div>

      <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <SortableContext items={Object.keys(leads)} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {initialStages.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                leads={leads[stage.id as StageId] || []}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Métricas clave */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Métricas Clave</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Tasa de cierre:</div>
            <div className="text-2xl font-bold text-gray-900">28%</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Tiempo promedio por etapa:</div>
            <div className="text-2xl font-bold text-gray-900">3.5 días</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Valor del pipeline:</div>
            <div className="text-2xl font-bold text-gray-900">$85,000</div>
          </div>
        </div>
      </div>
    </div>
  );
}
