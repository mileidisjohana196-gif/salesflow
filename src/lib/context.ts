'use client';

import { createContext, useContext, useState, useCallback } from 'react';

type FilterType = { type: 'all' } | { type: 'stage'; value: string } | { type: 'task' };

interface AppContextType {
  filter: FilterType;
  setFilter: (f: FilterType) => void;
  sidebarTab: string;
  setSidebarTab: (tab: string) => void;
}

const AppContext = createContext<AppContextType>({
  filter: { type: 'all' },
  setFilter: () => {},
  sidebarTab: 'pipeline',
  setSidebarTab: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [filter, setFilter] = useState<FilterType>({ type: 'all' });
  const [sidebarTab, setSidebarTab] = useState('pipeline');
  return (
    <AppContext.Provider value={{ filter, setFilter, sidebarTab, setSidebarTab }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
