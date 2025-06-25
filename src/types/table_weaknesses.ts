export interface WeaknessRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  improve_action: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeaknessInsert {
  id?: string;
  user_id: string;
  title: string;
  description: string;
  improve_action?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface WeaknessUpdate {
  id?: string;
  user_id?: string;
  title?: string;
  description?: string;
  improve_action?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface WeaknessTable {
  Row: WeaknessRow;
  Insert: WeaknessInsert;
  Update: WeaknessUpdate;
}