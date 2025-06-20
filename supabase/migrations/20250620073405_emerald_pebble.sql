/*
  # Create schedule table

  1. New Tables
    - `schedule`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `title` (text)
      - `subject` (text)
      - `date` (date)
      - `time` (time)
      - `completed` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `schedule` table
    - Add policy for users to manage their own schedule items
*/

CREATE TABLE IF NOT EXISTS schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  subject text NOT NULL,
  date date NOT NULL,
  time time NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own schedule"
  ON schedule
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS schedule_user_id_idx ON schedule(user_id);
CREATE INDEX IF NOT EXISTS schedule_date_idx ON schedule(date);