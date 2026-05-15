'use client';

import { useState } from 'react';
import { Upload, X, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ImportButtonProps { onImportComplete?: () => void; }

export default function ImportButton({ onImportComplete }: ImportButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [method, setMethod] = useState<'csv' | 'api'>('csv');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: number; err: number } | null>(null);
  const [apiUrl, setApiUrl] = useState('');

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    return lines.slice(1).filter(l => l.trim()).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = values[i] ?? ''; });
      return obj;
    });
  };

  const doImport = async (rawLeads: any[]) => {
    setImporting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setImporting(false); return; }
    let ok = 0; let err = 0;
    for (const l of rawLeads) {
      const scoreVal = l.score ?? l.puntuacion ?? 'Medio';
      const validScore = ['Alto', 'Caliente', 'Medio', 'Bajo'].includes(scoreVal) ? scoreVal : 'Medio';
      const { error } = await supabase.from('leads').insert({ user_id: user.id, name: l.name ?? l.nombre ?? 'Sin nombre', company: l.company ?? l.empresa ?? '', email: l.email ?? '', phone: l.phone ?? l.telefono ?? '', score: validScore, insights: l.insights ?? '', gemini_score: parseInt(l.gemini_score ?? l.score_numerico) || null, stage: 'contactado', value: parseFloat(l.value ?? l.valor) || 0, source: 'leadflow' });
      if (error) err++; else ok++;
    }
    setResult({ ok, err });
    setImporting(false);
    if (ok > 0) { onImportComplete?.(); setTimeout(() => { setShowModal(false); setResult(null); }, 2000); }
  };

  const handleCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const text = await file.text(); doImport(parseCSV(text));
  };

  const handleAPI = async () => {
    if (!apiUrl) return; setImporting(true);
    try { const res = await fetch(apiUrl); const data = await res.json(); doImport(Array.isArray(data) ? data : data.leads ?? []); }
    catch { setResult({ ok: 0, err: 1 }); setImporting(false); }
  };

  return (
    <>
      <button onClick={() => { setShowModal(true); setResult(null); }} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700"><Upload className="w-4 h-4" /> Importar Leads</button>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">Importar desde LeadFlow</h2><button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-500" /></button></div>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setMethod('csv')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${method === 'csv' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>📄 CSV</button>
              <button onClick={() => setMethod('api')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${method === 'api' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>🔗 API</button>
            </div>
            {method === 'csv' ? (
              <label className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-500 hover:bg-purple-50">
                <Upload className="w-8 h-8 text-gray-400" />
                <div className="text-center"><span className="text-sm font-medium text-gray-700">Seleccionar CSV</span><p className="text-xs text-gray-400 mt-1">Columnas: name, company, email, phone, score, insights, value</p></div>
                <input type="file" accept=".csv" onChange={handleCSV} className="hidden" disabled={importing} />
              </label>
            ) : (
              <div className="space-y-3">
                <input type="text" placeholder="https://leadflow.app/api/leads/export" value={apiUrl} onChange={e => setApiUrl(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <button onClick={handleAPI} disabled={importing || !apiUrl} className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">{importing ? 'Importando...' : 'Importar desde API'}</button>
            </div>
            )}
            {importing && <div className="mt-4 flex items-center justify-center gap-2 text-sm text-purple-600"><div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />Importando...</div>}
            {result && !importing && (
              <div className={`mt-4 p-3 rounded-xl flex items-start gap-2 ${result.err === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                {result.err === 0 ? <Check className="w-4 h-4 text-green-600 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />}
                <span className="text-sm">{result.ok > 0 && <span className="text-green-700 font-medium">{result.ok} leads importados</span>}{result.ok > 0 && result.err > 0 && ' · '}{result.err > 0 && <span className="text-yellow-700">{result.err} con error</span>}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
