'use client';

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ImportButton() {
  const [showModal, setShowModal] = useState(false);
  const [method, setMethod] = useState<'csv' | 'api'>('csv');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: number; err: number } | null>(null);
  const [apiUrl, setApiUrl] = useState('');

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    return lines.slice(1).filter(l => l.trim()).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
      const obj: any = {};
      headers.forEach((h, i) => obj[h] = values[i] || '');
      return obj;
    });
  };

  const doImport = async (leads: any[]) => {
    setImporting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setImporting(false); return; }
    let ok = 0, err = 0;
    for (const l of leads) {
      const { error } = await supabase.from('leads').insert({
        user_id: user.id,
        name: l.name || l.nombre || 'Sin nombre',
        company: l.company || l.empresa || '',
        email: l.email || '',
        phone: l.phone || l.telefono || '',
        score: ['Alto', 'Caliente', 'Medio', 'Bajo'].includes(l.score) ? l.score : 'Medio',
        insights: l.insights || '',
        gemini_score: parseInt(l.gemini_score) || null,
        stage: 'contactado',
        value: parseFloat(l.value) || 0,
      });
      if (error) err++; else ok++;
    }
    setResult({ ok, err });
    setImporting(false);
    if (ok > 0) setTimeout(() => setShowModal(false), 2000);
  };

  const handleCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    doImport(parseCSV(text));
  };

  const handleAPI = async () => {
    if (!apiUrl) return;
    setImporting(true);
    try {
      const res = await fetch(apiUrl);
      const data = await res.json();
      doImport(Array.isArray(data) ? data : data.leads || []);
    } catch { setResult({ ok: 0, err: 1 }); setImporting(false); }
  };

  return (
    <>
      <button onClick={() => { setShowModal(true); setResult(null); }} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700">
        <Upload className="w-4 h-4" /> Importar Leads
      </button>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Importar desde LeadFlow</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setMethod('csv')} className={`flex-1 py-2 rounded-lg text-sm ${method === 'csv' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100'}`}>CSV</button>
              <button onClick={() => setMethod('api')} className={`flex-1 py-2 rounded-lg text-sm ${method === 'api' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100'}`}>API</button>
            </div>
            {method === 'csv' ? (
              <label className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500">
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">Seleccionar CSV</span>
                <input type="file" accept=".csv" onChange={handleCSV} className="hidden" disabled={importing} />
              </label>
            ) : (
              <div className="space-y-3">
                <input type="text" placeholder="URL API LeadFlow" value={apiUrl} onChange={e => setApiUrl(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                <button onClick={handleAPI} disabled={importing || !apiUrl} className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm disabled:opacity-50">{importing ? 'Importando...' : 'Importar'}</button>
              </div>
            )}
            {result && (
              <div className={`mt-3 p-3 rounded-lg ${result.err === 0 ? 'bg-green-50' : 'bg-yellow-50'}`}>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /><span className="text-sm">{result.ok} importados{result.err > 0 && `, ${result.err} errores`}</span></div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
