'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Download, Trash2, User, Layers, AlertTriangle, CheckCircle, Bot } from 'lucide-react';

const STAGES = [
  { id: 'contactado', name: 'Contactado', color: '#3b82f6', description: 'Lead recién importado o primer contacto realizado' },
  { id: 'reunion_agendada', name: 'Reunión agendada', color: '#a855f7', description: 'Se agendó una reunión o demo con el prospecto' },
  { id: 'propuesta_enviada', name: 'Propuesta enviada', color: '#22c55e', description: 'Se envió propuesta comercial formal' },
  { id: 'negociacion', name: 'Negociación', color: '#f59e0b', description: 'En proceso de negociación de términos y precio' },
  { id: 'cerrado', name: 'Cerrado ✓', color: '#10b981', description: 'Venta cerrada exitosamente' },
];

export default function Configuracion() {
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    const { data, error } = await supabase.from('leads').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error || !data) { showToast('Error al exportar', false); setExporting(false); return; }
    if (data.length === 0) { showToast('No hay leads para exportar', false); setExporting(false); return; }
    const cols = ['name', 'company', 'email', 'phone', 'score', 'stage', 'value', 'insights', 'gemini_score', 'source', 'created_at'];
    const header = cols.join(',');
    const rows = data.map((l: any) => cols.map(c => { const val = String(l[c] ?? '').replace(/"/g, '""'); return val.includes(',') || val.includes('"') || val.includes('\n') ? `"${val}"` : val; }).join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `salesflow_leads_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
    showToast(`${data.length} leads exportados`);
    setExporting(false);
  };

  const handleDeleteAll = async () => {
    if (!user || deleteText !== 'ELIMINAR') return;
    setDeleting(true);
    const { error } = await supabase.from('leads').delete().eq('user_id', user.id);
    if (error) showToast('Error al eliminar', false);
    else { showToast('Todos los leads eliminados'); setConfirmDelete(false); setDeleteText(''); }
    setDeleting(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {toast && <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}{toast.msg}</div>}
      <div><h1 className="text-2xl font-bold text-gray-900">Configuración</h1><p className="text-sm text-gray-500 mt-0.5">Administrá tu cuenta y datos de SalesFlow</p></div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4"><User className="w-5 h-5 text-purple-600" /><h2 className="text-base font-semibold text-gray-800">Cuenta</h2></div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold">{user?.email?.[0]?.toUpperCase()}</div>
          <div><p className="text-sm font-semibold text-gray-900">{user?.email}</p><p className="text-xs text-gray-400">Miembro desde {user?.created_at ? new Date(user.created_at).toLocaleDateString('es', { year: 'numeric', month: 'long' }) : '—'}</p></div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4"><Bot className="w-5 h-5 text-purple-600" /><h2 className="text-base font-semibold text-gray-800">Inteligencia Artificial</h2></div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-gray-50"><span className="text-gray-600">Proveedor</span><span className="font-medium">OpenRouter</span></div>
          <div className="flex justify-between items-center py-2 border-b border-gray-50"><span className="text-gray-600">Modelo activo</span><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">qwen/qwen-turbo:free</span></div>
          <div className="flex justify-between items-center py-2"><span className="text-gray-600">Tipos de mensaje</span><span className="font-medium text-gray-900">Propuesta · Seguimiento · Personalizado</span></div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4"><Layers className="w-5 h-5 text-purple-600" /><h2 className="text-base font-semibold text-gray-800">Etapas del Pipeline</h2></div>
        <div className="space-y-2">
          {STAGES.map((stage, i) => (
            <div key={stage.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
              <div className="flex-1"><p className="text-sm font-medium text-gray-800">{stage.name}</p><p className="text-xs text-gray-400">{stage.description}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4"><Download className="w-5 h-5 text-purple-600" /><h2 className="text-base font-semibold text-gray-800">Exportar datos</h2></div>
        <p className="text-sm text-gray-600 mb-4">Descargá todos tus leads en formato CSV.</p>
        <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"><Download className="w-4 h-4" />{exporting ? 'Exportando...' : 'Descargar leads como CSV'}</button>
      </div>
      <div className="bg-white rounded-xl border border-red-200 p-5">
        <div className="flex items-center gap-2 mb-4"><AlertTriangle className="w-5 h-5 text-red-500" /><h2 className="text-base font-semibold text-red-700">Zona de peligro</h2></div>
        {!confirmDelete ? (
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium text-gray-800">Eliminar todos los leads</p><p className="text-xs text-gray-500 mt-0.5">Esta acción no se puede deshacer.</p></div>
            <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-2 border border-red-300 text-red-600 px-3 py-2 rounded-lg text-sm hover:bg-red-50"><Trash2 className="w-4 h-4" />Eliminar todo</button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-700 font-medium">Escribí ELIMINAR para confirmar:</p>
            <input type="text" value={deleteText} onChange={e => setDeleteText(e.target.value)} placeholder="ELIMINAR" className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400" />
            <div className="flex gap-2">
              <button onClick={handleDeleteAll} disabled={deleting || deleteText !== 'ELIMINAR'} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-40">{deleting ? 'Eliminando...' : 'Confirmar'}</button>
              <button onClick={() => { setConfirmDelete(false); setDeleteText(''); }} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm text-gray-600">Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
