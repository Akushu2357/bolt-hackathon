export interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileUpdate {
  id?: string;
  email?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileTable {
  Row: ProfileRow;
  Insert: ProfileInsert;
  Update: ProfileUpdate;
}