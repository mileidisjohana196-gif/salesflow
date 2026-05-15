'use client';

import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal, Bot, Sparkles, MessageSquare, Mail, Phone, X, Copy, Check, GripVertical } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

function MessageModal({ message, type, leadName, onClose }: { message: string; type: string; leadName: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const typeLabels: Record<string, string> = { propuesta: 'Propuesta comercial', seguimiento: 'Mensaje de seguimiento', personalizado: 'Mensaje personalizado' };
  const handleCopy = () => { navigator.clipboard.writeText(message); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div><h3 className="font-semibold text-gray-900">{typeLabels[type] ?? type}</h3><p className="text-xs text-gray-500 mt-0.5">Para: {leadName}</p></div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="p-4"><p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{message}</p></div>
        <div className="flex gap-2 p-4 border-t border-gray-100">
          <button onClick={handleCopy} className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white py-2 rounded-lg text-sm hover:bg-purple-700">
            {copied ? <><Check className="w-4 h-4" /> Copiado</> : <><Copy className="w-4 h-4" /> Copiar mensaje</>}
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

function LeadCard({ lead }: { lead: any }) {
  const { user } = useAuth();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });
  const [generating, setGenerating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [generatedMsg, setGeneratedMsg] = useState<{ text: string; type: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 999 : undefined };
  const scoreColor = lead.score === 'Alto' ? 'bg-green-100 text-green-800' : lead.score === 'Caliente' ? 'bg-orange-100 text-orange-800' : lead.score === 'Bajo' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false); };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleGenerate = async (type: string) => {
    if (!user) return;
    setGenerating(true); setShowMenu(false);
    try {
      const res = await fetch('/api/generate-message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lead, type, user_id: user.id }) });
      const data = await res.json();
      if (data.message) setGeneratedMsg({ text: data.message, type });
      else alert(`❌ ${data.error ?? 'Error al generar'}`);
    } catch { alert('Error de conexión'); }
    setGenerating(false);
  };

  return (
    <>
      <div ref={setNodeRef} style={style} className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow relative select-none">
        <div className="flex items-start gap-2">
          <div {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0" title="Arrastrar"><GripVertical className="w-4 h-4" /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">{lead.name?.[0]?.toUpperCase() ?? '?'}</div>
                <div className="min-w-0"><div className="text-sm font-medium text-gray-900 truncate">{lead.name || 'Sin nombre'}</div><div className="text-xs text-gray-500 truncate">{lead.company || ''}</div></div>
              </div>
              <div className="relative flex-shrink-0" ref={menuRef}>
                <button onClick={e => { e.stopPropagation(); setShowMenu(v => !v); }} className="p-1 hover:bg-gray-100 rounded"><MoreHorizontal className="w-4 h-4 text-gray-400" /></button>
                {showMenu && (
                  <div className="absolute right-0 top-7 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-20 w-52">
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Generar con IA</div>
                    <button onClick={() => handleGenerate('propuesta')} disabled={generating} className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 flex items-center gap-2 disabled:opacity-50 text-gray-700"><Sparkles className="w-3.5 h-3.5 text-purple-600" /> Propuesta comercial</button>
                    <button onClick={() => handleGenerate('seguimiento')} disabled={generating} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center gap-2 disabled:opacity-50 text-gray-700"><MessageSquare className="w-3.5 h-3.5 text-blue-600" /> Seguimiento</button>
                    <button onClick={() => handleGenerate('personalizado')} disabled={generating} className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 flex items-center gap-2 disabled:opacity-50 text-gray-700"><Bot className="w-3.5 h-3.5 text-green-600" /> Personalizado</button>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2"><span className="text-xs text-gray-400">Score:</span><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${scoreColor}`}>{lead.score || 'Medio'}</span>{lead.value > 0 && <span className="ml-auto text-xs font-semibold text-gray-700">${lead.value.toLocaleString('es')}</span>}</div>
              {lead.insights && <div className="flex items-start gap-1"><span className="text-xs flex-shrink-0">💡</span><span className="text-xs text-gray-600 line-clamp-2">{lead.insights}</span></div>}
              {(lead.email || lead.phone) && <div className="flex flex-col gap-0.5 pt-1 text-xs text-gray-400">{lead.email && <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3 flex-shrink-0" />{lead.email}</span>}{lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 flex-shrink-0" />{lead.phone}</span>}</div>}
            </div>
            {generating && <div className="mt-2 flex items-center gap-1.5 text-xs text-purple-600 animate-pulse"><Sparkles className="w-3 h-3" /> Generando mensaje...</div>}
          </div>
        </div>
      </div>
      {generatedMsg && <MessageModal message={generatedMsg.text} type={generatedMsg.type} leadName={lead.name} onClose={() => setGeneratedMsg(null)} />}
    </>
  );
}

export default function KanbanColumn({ stage, leads }: { stage: { id: string; name: string; color: string }; leads: any[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  return (
    <div className="flex-shrink-0 w-72">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} /><h3 className="text-sm font-semibold text-gray-800">{stage.name}</h3></div>
        <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: stage.color }}>{leads.length}</span>
      </div>
      <div ref={setNodeRef} className={`bg-gray-100 rounded-xl p-2 min-h-80 transition-colors ${isOver ? 'bg-purple-50 ring-2 ring-purple-400' : ''}`}>
        {leads.length === 0 ? <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm gap-1"><span className="text-2xl">📭</span><span>Sin leads aquí</span></div> : <div className="space-y-2">{leads.map(lead => <LeadCard key={lead.id} lead={lead} />)}</div>}
      </div>
    </div>
  );
}
