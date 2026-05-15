'use client';

import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal, Bot, Sparkles, CheckCircle, MessageSquare, Mail, Phone } from 'lucide-react';
import { useState } from 'react';

function LeadCard({ lead }: { lead: any }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });
  const [generating, setGenerating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const scoreColor = lead.score === 'Alto' ? 'bg-green-100 text-green-800' : lead.score === 'Caliente' ? 'bg-orange-100 text-orange-800' : lead.score === 'Bajo' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800';

  const handleGenerate = async (type: string) => {
    setGenerating(true);
    setShowMenu(false);
    try {
      const res = await fetch('/api/generate-message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lead, type }) });
      const data = await res.json();
      if (data.message) alert(`✅ Mensaje generado:\n\n${data.message}`);
      else alert(`❌ ${data.error || 'Error al generar'}`);
    } catch (e) { alert('Error de conexión'); }
    setGenerating(false);
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="bg-white rounded-lg border border-gray-200 p-3 cursor-grab hover:shadow-md transition-shadow relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">{lead.name?.[0]?.toUpperCase() || '?'}</div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{lead.name || 'Sin nombre'}</div>
            <div className="text-xs text-gray-500 truncate">{lead.company || ''}</div>
          </div>
        </div>
        <div className="relative flex-shrink-0">
          <button onClick={e => { e.stopPropagation(); setShowMenu(!showMenu); }} className="p-1 hover:bg-gray-100 rounded"><MoreHorizontal className="w-4 h-4 text-gray-400" /></button>
          {showMenu && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 w-52">
              <button onClick={() => handleGenerate('propuesta')} disabled={generating} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"><Sparkles className="w-3 h-3 text-purple-600" /> Generar propuesta</button>
              <button onClick={() => handleGenerate('seguimiento')} disabled={generating} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"><MessageSquare className="w-3 h-3 text-blue-600" /> Generar seguimiento</button>
              <button onClick={() => handleGenerate('personalizado')} disabled={generating} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"><Bot className="w-3 h-3 text-green-600" /> Generar personalizado</button>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2"><span className="text-xs text-gray-500">Score:</span><span className={`text-xs px-2 py-0.5 rounded-full ${scoreColor}`}>{lead.score || 'Medio'}</span></div>
        {lead.insights && <div className="flex items-start gap-1.5"><span className="text-xs text-gray-500 flex-shrink-0">💡</span><span className="text-xs text-gray-700 line-clamp-2">{lead.insights}</span></div>}
        {(lead.email || lead.phone) && <div className="flex gap-2 text-xs text-gray-500 pt-1">
          {lead.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {lead.email}</span>}
          {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.phone}</span>}
        </div>}
        <button className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 mt-1"><Bot className="w-3 h-3" /> Gemini Score</button>
      </div>
    </div>
  );
}

export default function KanbanColumn({ stage, leads }: { stage: any; leads: any[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  return (
    <div className="flex-shrink-0 w-72">
      <div ref={setNodeRef} className={`bg-gray-100 rounded-xl p-3 min-h-[300px] ${isOver ? 'ring-2 ring-purple-500' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: stage.color }}>{stage.name}</h3>
          <span className="text-xs bg-white px-2 py-0.5 rounded-full text-gray-500">{leads.length}</span>
        </div>
        <div className="space-y-2">
          {leads.length === 0 ? <div className="text-center py-8 text-gray-400 text-sm">Vacío</div> : leads.map(lead => <LeadCard key={lead.id} lead={lead} />)}
        </div>
      </div>
    </div>
  );
}
