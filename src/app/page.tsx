'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import Dashboard from '@/components/Dashboard';
import Pipeline from '@/components/Pipeline';
import Seguimiento from '@/components/Seguimiento';
import Mensajeria from '@/components/Mensajeria';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('pipeline');
  const [filter, setFilter] = useState<{ type: string; value?: string }>({ type: 'all' });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user); else router.push('/login');
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null);
      if (!s?.user) router.push('/login');
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const handleStageClick = (stageId: string) => {
    setFilter({ type: 'stage', value: stageId });
    setCurrentTab('pipeline');
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-purple-600">Cargando...</div></div>;
  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar filter={filter} onStageClick={handleStageClick} onAllClick={() => { setFilter({ type: 'all' }); setCurrentTab('pipeline'); }} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav currentTab={currentTab} onTabChange={setCurrentTab} />
        <main className="flex-1 overflow-auto">
          {currentTab === 'pipeline' && <Pipeline filter={filter} />}
          {currentTab === 'dashboard' && <Dashboard />}
          {currentTab === 'seguimiento' && <Seguimiento />}
          {currentTab === 'mensajeria' && <Mensajeria />}
          {currentTab === 'metricas' && <Dashboard />}
          {currentTab === 'configuracion' && <div className="p-6">Configuración próximamente</div>}
        </main>
      </div>
    </div>
  );
}
