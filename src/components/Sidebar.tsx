'use client';

import { CheckCircle, Calendar, Send, AlertCircle } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-purple-700 text-white flex flex-col">
      <div className="p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-200 mb-3">
          Enfoque de hoy
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 bg-purple-600 rounded-lg text-sm">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>Contact de hoy</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg text-sm">
            <Calendar className="w-4 h-4 text-purple-300" />
            <span>Reunión agendada</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg text-sm">
            <Send className="w-4 h-4 text-purple-300" />
            <span className="flex items-center gap-2">
              Propuesta enviada
              <span className="bg-yellow-400 text-purple-900 text-xs px-2 py-0.5 rounded-full">1</span>
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-purple-600">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-200 mb-3">
          Tareas pendientes
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <span className="flex items-center gap-2">
              Enfoque de odos
              <span className="bg-yellow-400 text-purple-900 text-xs px-2 py-0.5 rounded-full">2</span>
            </span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <span className="flex items-center gap-2">
              Tareas pendientes
              <span className="bg-yellow-400 text-purple-900 text-xs px-2 py-0.5 rounded-full">3</span>
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
