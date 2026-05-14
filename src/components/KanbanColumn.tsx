'use client';

import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal, AlertCircle, Bot, Sparkles, CheckCircle } from 'lucide-react';

function LeadCard({ lead }: { lead: any }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const scoreColor = lead.score === 'Alto' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg border border-gray-200 p-3 cursor-grab hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {lead.name[0]}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{lead.name}</div>
            <div className="text-xs text-gray-500">{lead.company}</div>
          </div>
        </div>
        <button className="p-1 hover:bg-gray-100 rounded">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Score:</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${scoreColor}`}>{lead.score}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Insights:</span>
          <span className="text-xs text-gray-700">{lead.insights}</span>
        </div>
        <button className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800">
          <Bot className="w-3 h-3" />
          Gemini Score
        </button>
      </div>
    </div>
  );
}

export default function KanbanColumn({ stage, leads }: { stage: any; leads: any[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <div className="flex-shrink-0 w-72">
      <div
        ref={setNodeRef}
        className={`bg-gray-100 rounded-xl p-3 min-h-[400px] ${isOver ? 'ring-2 ring-purple-500' : ''}`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700" style={{ color: stage.color }}>
            {stage.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-white px-2 py-0.5 rounded-full text-gray-500">
              {leads.length}
            </span>
            <button className="p-1 hover:bg-gray-200 rounded">
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      </div>
    </div>
  );
}
