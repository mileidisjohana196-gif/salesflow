'use client';

import { 
  LayoutGrid, 
  ListTodo, 
  ArrowUpRight, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Bell,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutGrid className="w-4 h-4" /> },
  { id: 'pipeline', label: 'Pipeline', icon: <ListTodo className="w-4 h-4" /> },
  { id: 'seguimiento', label: 'Seguimiento', icon: <ArrowUpRight className="w-4 h-4" /> },
  { id: 'mensajeria', label: 'Mensajería', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'metricas', label: 'Métricas', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'configuracion', label: 'Configuración', icon: <Settings className="w-4 h-4" /> },
];

export default function TopNav({ 
  currentTab, 
  onTabChange 
}: { 
  currentTab: string;
  onTabChange: (tab: string) => void;
}) {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">→$</span>
            <span className="text-xl font-bold text-purple-800">SalesFlow</span>
          </div>
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === tab.id
                    ? 'bg-purple-100 text-purple-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 text-gray-500 hover:text-gray-700">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.email?.[0].toUpperCase()}
            </div>
            <button
              onClick={() => signOut()}
              className="p-2 text-gray-500 hover:text-red-600"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
