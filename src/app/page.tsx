'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import Pipeline from '@/components/Pipeline';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('pipeline');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) router.push('/login');
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-purple-600 text-lg">Cargando...</div>
      </div>
    );
  }

  if (!user) return null;

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
