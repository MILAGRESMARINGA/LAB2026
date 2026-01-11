/*
  # Add user_id column to contacts table

  1. Schema Changes
    - Add `user_id` column to `contacts` table as foreign key to auth.users
    - Add `tags` column as text array for contact categorization
    - Add `notes` column for additional contact information
    - Add `email` column for contact email addresses
    - Add `status` column to replace `type` for better naming consistency
    - Add `property_interest` column for real estate specific data
    - Add `budget` column for budget tracking
    - Add `last_contact` column for tracking last interaction

  2. Security Updates
    - Update RLS policies to use user_id for proper data isolation
    - Ensure users can only access their own contacts

  3. Data Migration
    - Safely add columns with appropriate defaults
    - Preserve existing data
*/

-- Add missing columns to contacts table
DO $$
BEGIN
  -- Add user_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE contacts ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add tags column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'tags'
  ) THEN
    ALTER TABLE contacts ADD COLUMN tags text[] DEFAULT ARRAY[]::text[];
  END IF;

  -- Add notes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'notes'
  ) THEN
    ALTER TABLE contacts ADD COLUMN notes text;
  END IF;

  -- Add email column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'email'
  ) THEN
    ALTER TABLE contacts ADD COLUMN email text;
  END IF;

  -- Add status column if it doesn't exist (rename from type)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'status'
  ) THEN
    ALTER TABLE contacts ADD COLUMN status text DEFAULT 'new';
    -- Copy data from type to status if type column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'contacts' AND column_name = 'type'
    ) THEN
      UPDATE contacts SET status = type WHERE type IS NOT NULL;
    END IF;
  END IF;

  -- Add property_interest column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'property_interest'
  ) THEN
    ALTER TABLE contacts ADD COLUMN property_interest text;
  END IF;

  -- Add budget column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'budget'
  ) THEN
    ALTER TABLE contacts ADD COLUMN budget numeric;
  END IF;

  -- Add last_contact column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'last_contact'
  ) THEN
    ALTER TABLE contacts ADD COLUMN last_contact timestamptz;
  END IF;
END $$;

-- Update RLS policies to use user_id
DROP POLICY IF EXISTS "Users can read own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can insert contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update contacts" ON contacts;
DROP POLICY IF EXISTS "Users can delete contacts" ON contacts;

-- Create new RLS policies with user_id
CREATE POLICY "Users can read own contacts"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts"
  ON contacts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);