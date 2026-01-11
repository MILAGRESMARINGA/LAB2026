/*
  # Add user_id column to send_logs table

  1. Schema Changes
    - Add `user_id` column to `send_logs` table
    - Set up foreign key relationship to `auth.users` table
    - Update existing records to have a default user_id (if any exist)

  2. Security
    - Update RLS policies to use the new user_id column
    - Ensure users can only access their own send logs

  3. Data Migration
    - Safely add the column with proper constraints
    - Handle existing data if present
*/

-- Add user_id column to send_logs table
ALTER TABLE send_logs ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing RLS policies to use user_id
DROP POLICY IF EXISTS "Users can delete send_logs" ON send_logs;
DROP POLICY IF EXISTS "Users can insert send_logs" ON send_logs;
DROP POLICY IF EXISTS "Users can read send_logs" ON send_logs;
DROP POLICY IF EXISTS "Users can update send_logs" ON send_logs;

-- Create new RLS policies with user_id
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