'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { TrendingUp, Users, DollarSign, Clock, Calendar, CheckCircle2, ArrowUpRight } from 'lucide-react';

type Metrics = {
  totalLeads: number;
  byStage: Record<string, number>;
  totalValue: number;
  closedValue: number;
  closeRate: number;
  avgTimePerStage: number;
  todayTasks: number;
  overdueTasks: number;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadMetrics = async () => {
      // Total leads by stage
      const { data: leads } = await supabase.from('leads').select('stage, value').eq('user_id', user.id);
      
      if (!leads) { setLoading(false); return; }

      const byStage: Record<string, number> = {};
      let totalValue = 0;
      let closedValue = 0;

      leads.forEach((l: any) => {
        byStage[l.stage] = (byStage[l.stage] || 0) + 1;
        totalValue += l.value || 0;
        if (l.stage === 'cerrado') closedValue += l.value || 0;
      });

      setMetrics({
        totalLeads: leads.length,
        byStage,
        totalValue,
        closedValue,
        closeRate: leads.length > 0 ? Math.round((byStage['cerrado'] || 0) / leads.length * 100) : 0,
        avgTimePerStage: 3.5,
        todayTasks: 0,
        overdueTasks: 0,
      });

      // Recent leads
      const { data: recent } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recent) setRecentLeads(recent);
      setLoading(false);
    };

    loadMetrics();
  }, [user]);

  if (loading || !metrics) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-purple-600">Cargando dashboard...</div>
      </div>
    );
  }

  const stageNames: Record<string, string> = {
    contactado: 'Contactado',
    reunion_agendada: 'Reunión agendada',
    propuesta_enviada: 'Propuesta enviada',
    negociacion: 'Negociación',
    cerrado: 'Cerrado',
  };

  const stageColors: Record<string, string> = {
    contactado: '#3b82f6',
    reunion_agendada: '#a855f7',
    propuesta_enviada: '#22c55e',
    negociacion: '#f59e0b',
    cerrado: '#10b981',
  };

  const kpis = [
    { label: 'Total Leads', value: metrics.totalLeads, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Valor Pipeline', value: `$${metrics.totalValue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Tasa de Cierre', value: `${metrics.closeRate}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Ventas Cerradas', value: `$${metrics.closedValue.toLocaleString()}`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{kpi.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
              </div>
              <div className={`${kpi.bg} p-3 rounded-lg`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline visual */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Etapa</h2>
        <div className="space-y-3">
          {Object.entries(stageNames).map(([key, name]) => {
            const count = metrics.byStage[key] || 0;
            const pct = metrics.totalLeads > 0 ? Math.round((count / metrics.totalLeads) * 100) : 0;
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-36">{name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: stageColors[key] }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-16 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leads recientes */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Leads Recientes</h2>
        {recentLeads.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay leads todavía. Importá desde LeadFlow para empezar.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-500 font-medium">Nombre</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Empresa</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Score</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Etapa</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-gray-100">
                    <td className="py-2 font-medium">{lead.name}</td>
                    <td className="py-2 text-gray-600">{lead.company || '-'}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        lead.score === 'Alto' ? 'bg-green-100 text-green-800' :
                        lead.score === 'Caliente' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{lead.score}</span>
                    </td>
                    <td className="py-2 text-gray-600">{stageNames[lead.stage] || lead.stage}</td>
                    <td className="py-2 text-right font-medium">${(lead.value || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
