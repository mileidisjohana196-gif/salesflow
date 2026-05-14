'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import Pipeline from '@/components/Pipeline';

export default function Home() {
  const [currentTab, setCurrentTab] = useState('pipeline');

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav currentTab={currentTab} onTabChange={setCurrentTab} />
        <main className="flex-1 overflow-auto">
          {currentTab === 'pipeline' && <Pipeline />}
          {currentTab === 'dashboard' && <div className="p-6">Dashboard próximamente</div>}
          {currentTab === 'seguimiento' && <div className="p-6">Seguimiento próximamente</div>}
          {currentTab === 'mensajeria' && <div className="p-6">Mensajería próximamente</div>}
          {currentTab === 'metricas' && <div className="p-6">Métricas próximamente</div>}
          {currentTab === 'configuracion' && <div className="p-6">Configuración próximamente</div>}
        </main>
      </div>
    </div>
  );
}
