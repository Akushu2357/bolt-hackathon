export interface ScheduleRow {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduleInsert {
  id?: string;
  user_id: string;
  title: string;
  subject: string;
  date: string;
  time: string;
  completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ScheduleUpdate {
  id?: string;
  user_id?: string;
  title?: string;
  subject?: string;
  date?: string;
  time?: string;
  completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ScheduleTable {
  Row: ScheduleRow;
  Insert: ScheduleInsert;
  Update: ScheduleUpdate;
}