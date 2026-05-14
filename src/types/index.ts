export interface Lead {
  id: string;
  user_id?: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  score: 'Alto' | 'Caliente' | 'Medio' | 'Bajo';
  insights?: string;
  gemini_score?: number;
  source: string;
  stage: string;
  value: number;
  created_at: string;
  updated_at: string;
}

export interface PipelineStage {
  id: string;
  user_id?: string;
  name: string;
  color: string;
  order_index: number;
}

export interface Task {
  id: string;
  user_id?: string;
  lead_id?: string;
  title: string;
  description?: string;
  due_date?: string;
  completed: boolean;
  type: 'llamada' | 'email' | 'reunion' | 'seguimiento';
  created_at: string;
}

export interface AIMessage {
  id: string;
  user_id?: string;
  lead_id?: string;
  content: string;
  type: 'propuesta' | 'seguimiento' | 'personalizado';
  created_at: string;
}

export interface DailyMetrics {
  date: string;
  leads_contacted: number;
  meetings_booked: number;
  proposals_sent: number;
  deals_closed: number;
  total_value: number;
}
