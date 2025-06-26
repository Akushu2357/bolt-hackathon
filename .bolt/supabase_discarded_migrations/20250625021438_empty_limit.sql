/*
  # Create Learning Dashboard Tables

  1. New Tables
    - `weaknesses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `title` (text)
      - `description` (text)
      - `improve_action` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `learning_path`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `title` (text)
      - `description` (text)
      - `completed` (boolean, default false)
      - `order_index` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own data
*/

-- Create weaknesses table
CREATE TABLE IF NOT EXISTS weaknesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  improve_action text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create learning_path table
CREATE TABLE IF NOT EXISTS learning_path (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  completed boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE weaknesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path ENABLE ROW LEVEL SECURITY;

-- Create policies for weaknesses
CREATE POLICY "Users can manage own weaknesses"
  ON weaknesses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for learning_path
CREATE POLICY "Users can manage own learning path"
  ON learning_path
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS weaknesses_user_id_idx ON weaknesses(user_id);
CREATE INDEX IF NOT EXISTS weaknesses_created_at_idx ON weaknesses(created_at);

CREATE INDEX IF NOT EXISTS learning_path_user_id_idx ON learning_path(user_id);
CREATE INDEX IF NOT EXISTS learning_path_order_idx ON learning_path(user_id, order_index);
CREATE INDEX IF NOT EXISTS learning_path_completed_idx ON learning_path(user_id, completed);