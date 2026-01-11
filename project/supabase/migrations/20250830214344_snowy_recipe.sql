/*
  # WhatsApp Auto-Import System Tables

  1. New Tables
    - `leads`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text)
      - `phone` (text, unique)
      - `whatsapp_chat_id` (text)
      - `pipeline_stage` (text)
      - `tags` (text array)
      - `notes` (text)
      - `assigned_to` (uuid)
      - `first_contact_date` (timestamp)
      - `last_interaction_date` (timestamp)
      - `last_message_content` (text)
      - `response_status` (text)
      - `ai_classification` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `whatsapp_messages`
      - `id` (uuid, primary key)
      - `lead_id` (uuid, foreign key to leads)
      - `chat_id` (text)
      - `message_id` (text)
      - `content` (text)
      - `from_me` (boolean)
      - `message_type` (text)
      - `media_url` (text)
      - `timestamp` (timestamp)
      - `status` (text)
      - `created_at` (timestamp)
    
    - `pipeline_logs`
      - `id` (uuid, primary key)
      - `lead_id` (uuid, foreign key to leads)
      - `previous_stage` (text)
      - `new_stage` (text)
      - `reason` (text)
      - `automated` (boolean)
      - `changed_by` (uuid)
      - `timestamp` (timestamp)
    
    - `lead_assignments`
      - `id` (uuid, primary key)
      - `lead_id` (uuid, foreign key to leads)
      - `assigned_to` (uuid, foreign key to auth.users)
      - `assigned_by` (uuid, foreign key to auth.users)
      - `assigned_at` (timestamp)
      - `notes` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for team collaboration
*/

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text,
  phone text UNIQUE NOT NULL,
  whatsapp_chat_id text,
  pipeline_stage text DEFAULT 'new',
  tags text[] DEFAULT ARRAY[]::text[],
  notes text,
  assigned_to uuid REFERENCES auth.users(id),
  first_contact_date timestamptz,
  last_interaction_date timestamptz,
  last_message_content text,
  response_status text DEFAULT 'waiting',
  ai_classification jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create whatsapp_messages table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  chat_id text NOT NULL,
  message_id text,
  content text,
  from_me boolean DEFAULT false,
  message_type text DEFAULT 'text',
  media_url text,
  timestamp timestamptz NOT NULL,
  status text DEFAULT 'sent',
  created_at timestamptz DEFAULT now()
);

-- Create pipeline_logs table
CREATE TABLE IF NOT EXISTS pipeline_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  previous_stage text,
  new_stage text NOT NULL,
  reason text,
  automated boolean DEFAULT false,
  changed_by uuid REFERENCES auth.users(id),
  timestamp timestamptz DEFAULT now()
);

-- Create lead_assignments table
CREATE TABLE IF NOT EXISTS lead_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  notes text
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads
CREATE POLICY "Users can read own leads"
  ON leads
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY "Users can insert own leads"
  ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own leads"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR assigned_to = auth.uid())
  WITH CHECK (user_id = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY "Users can delete own leads"
  ON leads
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for whatsapp_messages
CREATE POLICY "Users can read messages from their leads"
  ON whatsapp_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leads 
      WHERE leads.id = whatsapp_messages.lead_id 
      AND (leads.user_id = auth.uid() OR leads.assigned_to = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages for their leads"
  ON whatsapp_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leads 
      WHERE leads.id = whatsapp_messages.lead_id 
      AND (leads.user_id = auth.uid() OR leads.assigned_to = auth.uid())
    )
  );

-- RLS Policies for pipeline_logs
CREATE POLICY "Users can read pipeline logs from their leads"
  ON pipeline_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leads 
      WHERE leads.id = pipeline_logs.lead_id 
      AND (leads.user_id = auth.uid() OR leads.assigned_to = auth.uid())
    )
  );

CREATE POLICY "Users can insert pipeline logs for their leads"
  ON pipeline_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leads 
      WHERE leads.id = pipeline_logs.lead_id 
      AND (leads.user_id = auth.uid() OR leads.assigned_to = auth.uid())
    )
  );

-- RLS Policies for lead_assignments
CREATE POLICY "Users can read assignments for their leads"
  ON lead_assignments
  FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "Users can create assignments for their leads"
  ON lead_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (assigned_by = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage ON leads(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_lead_id ON whatsapp_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_chat_id ON whatsapp_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_logs_lead_id ON pipeline_logs(lead_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_leads_updated_at 
  BEFORE UPDATE ON leads 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();