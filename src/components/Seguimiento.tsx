'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Clock, Check, AlertCircle, Calendar, Trash2 } from 'lucide-react';

type Task = {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  completed: boolean;
  type: string;
  lead_name?: string;
};

export default function Seguimiento() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ title: '', description: '', due_date: '', type: 'seguimiento', lead_id: '' });

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    const { data: tasksData } = await supabase.from('tasks').select('*, leads(name)').eq('user_id', user!.id).order('due_date', { ascending: true });
    const { data: leadsData } = await supabase.from('leads').select('id, name').eq('user_id', user!.id);
    if (tasksData) setTasks(tasksData.map((t: any) => ({ ...t, lead_name: t.leads?.name })));
    if (leadsData) setLeads(leadsData);
    setLoading(false);
  };

  const createTask = async () => {
    if (!formData.title || !user) return;
    const { error } = await supabase.from('tasks').insert({
      user_id: user.id,
      lead_id: formData.lead_id || null,
      title: formData.title,
      description: formData.description || null,
      due_date: formData.due_date || null,
      type: formData.type,
    });
    if (!error) { setShowModal(false); setFormData({ title: '', description: '', due_date: '', type: 'seguimiento', lead_id: '' }); loadData(); }
  };

  const toggleTask = async (task: Task) => {
    await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id);
    loadData();
  };

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id);
    loadData();
  };

  const isOverdue = (dueDate?: string) => dueDate ? new Date(dueDate) < new Date() : false;

  if (loading) return <div className="p-6 text-purple-600">Cargando...</div>;

  const pending = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);
  const overdue = pending.filter(t => isOverdue(t.due_date));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seguimiento</h1>
          <p className="text-sm text-gray-500">{pending.length} pendientes · {completed.length} completadas</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700">
          <Plus className="w-4 h-4" /> Nueva tarea
        </button>
      </div>

      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Vencidas</h3>
          {overdue.map(t => (
            <div key={t.id} className="flex items-center gap-3 py-2 border-b border-red-100 last:border-0">
              <button onClick={() => toggleTask(t)} className="p-1 hover:bg-red-100 rounded"><Check className="w-4 h-4 text-red-600" /></button>
              <div className="flex-1"><p className="text-sm font-medium text-red-900">{t.title}</p><p className="text-xs text-red-600">{t.lead_name && `→ ${t.lead_name}`} · Vencida</p></div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Pendientes</h3>
        {pending.filter(t => !isOverdue(t.due_date)).length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No hay tareas pendientes</p>
        ) : (
          pending.filter(t => !isOverdue(t.due_date)).map(t => (
            <div key={t.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
              <button onClick={() => toggleTask(t)} className="p-1 hover:bg-gray-100 rounded"><Check className="w-4 h-4 text-gray-400" /></button>
              <div className="flex-1">
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-xs text-gray-500">{t.lead_name && `→ ${t.lead_name}`} · {t.due_date ? new Date(t.due_date).toLocaleDateString('es') : 'Sin fecha'}</p>
              </div>
              <button onClick={() => deleteTask(t.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" /></button>
            </div>
          ))
        )}
      </div>

      {completed.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 opacity-60">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Check className="w-4 h-4" /> Completadas</h3>
          {completed.map(t => (
            <div key={t.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
              <button onClick={() => toggleTask(t)} className="p-1 hover:bg-gray-100 rounded"><Check className="w-4 h-4 text-green-600" /></button>
              <p className="text-sm text-gray-500 line-through flex-1">{t.title}</p>
              <button onClick={() => deleteTask(t.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-gray-400" /></button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-3">
            <h2 className="text-lg font-semibold">Nueva tarea</h2>
            <input placeholder="Título" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
            <input placeholder="Descripción (opcional)" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
            <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="seguimiento">Seguimiento</option>
              <option value="llamada">Llamada</option>
              <option value="email">Email</option>
              <option value="reunion">Reunión</option>
            </select>
            <select value={formData.lead_id} onChange={e => setFormData({...formData, lead_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">Sin lead asociado</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
            <div className="flex gap-2 pt-2">
              <button onClick={createTask} className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm hover:bg-purple-700">Crear</button>
              <button onClick={() => setShowModal(false)} className="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
