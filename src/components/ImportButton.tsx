'use client';

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type ImportMethod = 'csv' | 'api';

export default function ImportButton() {
  const [showModal, setShowModal] = useState(false);
  const [importMethod, setImportMethod] = useState<ImportMethod>('csv');
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: number; errors: number } | null>(null);
  const [apiUrl, setApiUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const lead: any = {};
      headers.forEach((header, i) => {
        lead[header] = values[i] || '';
      });
      return lead;
    });
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportStatus(null);

    const text = await file.text();
    const leads = parseCSV(text);

    let success = 0;
    let errors = 0;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setImporting(false);
      return;
    }

    for (const lead of leads) {
      const { error } = await supabase.from('leads').insert({
        user_id: user.id,
        name: lead.name || 'Sin nombre',
        company: lead.company || '',
        email: lead.email || '',
        phone: lead.phone || '',
        score: lead.score || 'Medio',
        insights: lead.insights || '',
        gemini_score: lead.gemini_score || lead.score_gemini || null,
        stage: 'contactado',
        value: lead.value || 0,
      });

      if (error) errors++;
      else success++;
    }

    setImportStatus({ success, errors });
    setImporting(false);

    if (success > 0) {
      setTimeout(() => setShowModal(false), 2000);
    }
  };

  const handleAPIImport = async () => {
    if (!apiUrl) return;
    setImporting(true);

    try {
      const response = await fetch(apiUrl);
      const leads = await response.json();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setImporting(false);
        return;
      }

      let success = 0;
      let errors = 0;

      for (const lead of leads) {
        const { error } = await supabase.from('leads').insert({
          user_id: user.id,
          name: lead.name || 'Sin nombre',
          company: lead.company || '',
          email: lead.email || '',
          phone: lead.phone || '',
          score: lead.score || 'Medio',
          insights: lead.insights || '',
          gemini_score: lead.gemini_score || null,
          stage: 'contactado',
          value: lead.value || 0,
        });

        if (error) errors++;
        else success++;
      }

      setImportStatus({ success, errors });
    } catch {
      setImportStatus({ success: 0, errors: 1 });
    }

    setImporting(false);
  };

  return (
    <>
      <button
        onClick={() => { setShowModal(true); setImportStatus(null); }}
        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
      >
        <Upload className="w-4 h-4" />
        Importar Leads Calificados
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Importar leads desde LeadFlow</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setImportMethod('csv')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm ${
                  importMethod === 'csv' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={() => setImportMethod('api')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm ${
                  importMethod === 'api' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'
                }`}
              >
                API directa
              </button>
            </div>

            {importMethod === 'csv' ? (
              <label className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">Seleccionar CSV de LeadFlow</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVImport}
                  className="hidden"
                  disabled={importing}
                />
              </label>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Conecta con la API de LeadFlow para importar leads calificados automáticamente.</p>
                <input
                  type="text"
                  placeholder="URL de la API de LeadFlow"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button 
                  onClick={handleAPIImport}
                  disabled={importing || !apiUrl}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
                >
                  {importing ? 'Importando...' : 'Conectar y importar'}
                </button>
              </div>
            )}

            {importStatus && (
              <div className={`mt-4 p-3 rounded-lg ${importStatus.errors === 0 ? 'bg-green-50' : 'bg-yellow-50'}`}>
                <div className="flex items-center gap-2">
                  {importStatus.errors === 0 ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <X className="w-5 h-5 text-yellow-600" />
                  )}
                  <span className="text-sm text-gray-700">
                    {importStatus.success} leads importados
                    {importStatus.errors > 0 && `, ${importStatus.errors} errores`}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
