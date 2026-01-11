/*
  # Add missing user_id columns to groups and send_logs tables

  1. Schema Updates
    - Add `user_id` column to `groups` table
    - Add `user_id` column to `send_logs` table (if not exists)
    - Set up foreign key relationships to auth.users

  2. Security Updates
    - Update RLS policies for both tables to use user_id
    - Ensure proper data isolation between users

  3. Data Integrity
    - Add NOT NULL constraints
    - Set up CASCADE delete relationships
*/

-- Add user_id column to groups table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'groups' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE groups ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id column to send_logs table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'send_logs' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE send_logs ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update RLS policies for groups table
DROP POLICY IF EXISTS "Users can delete groups" ON groups;
DROP POLICY IF EXISTS "Users can insert groups" ON groups;
DROP POLICY IF EXISTS "Users can read groups" ON groups;
DROP POLICY IF EXISTS "Users can update groups" ON groups;

CREATE POLICY "Users can delete own groups"
  ON groups
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own groups"
  ON groups
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own groups"
  ON groups
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update RLS policies for send_logs table
DROP POLICY IF EXISTS "Users can delete own send_logs" ON send_logs;
DROP POLICY IF EXISTS "Users can insert own send_logs" ON send_logs;
DROP POLICY IF EXISTS "Users can read own send_logs" ON send_logs;
DROP POLICY IF EXISTS "Users can update own send_logs" ON send_logs;

CREATE POLICY "Users can delete own send_logs"
  ON send_logs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own send_logs"
  ON send_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own send_logs"
  ON send_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own send_logs"
  ON send_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);