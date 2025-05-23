export interface Evidence {
  date: string;
  note: string;
  link?: string;
}

export interface Prediction {
  id: string;
  text: string;
  confidence: number;
  dateCreated: string;
  targetDate: string;
  status: 'pending' | 'on_track' | 'at_risk' | 'succeeded' | 'failed' | 'revised';
  category: 'ai_capabilities' | 'adoption' | 'economic' | 'technical' | 'social';
  evidence: Evidence[];
  reasoning: string;
  source: string;
}