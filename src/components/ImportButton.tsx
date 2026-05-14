'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';

export default function ImportButton() {
  const [showModal, setShowModal] = useState(false);
  const [importMethod, setImportMethod] = useState<'csv' | 'api'>('csv');

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // TODO: Implement CSV parsing and import
    console.log('Importing CSV:', file.name);
    setShowModal(false);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
      >
        <Upload className="w-4 h-4" />
        Importar Leads Calificados
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Importar leads desde LeadFlow</h2>
            
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
                  type="file"
                  accept=".csv"
                  onChange={handleCSVImport}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Conecta con la API de LeadFlow para importar leads calificados automáticamente.</p>
                <input
                  type="text"
                  placeholder="URL de la API de LeadFlow"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700">
                  Conectar y importar
                </button>
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
