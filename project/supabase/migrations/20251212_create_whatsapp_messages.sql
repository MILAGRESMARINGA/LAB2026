-- Create whatsapp_messages table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  "to" text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
  sent_at timestamptz DEFAULT now(),
  metadata jsonb,
  
  CONSTRAINT whatsapp_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own messages"
  ON whatsapp_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON whatsapp_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for Service Role (Backend) to insert/manage all messages
-- Note: Service Role bypasses RLS by default, but explicit policy helps clarity if needed.
-- We usually don't need explicit policy for service_role if it has bypassrls privilege.
