/*
  # Criar tabela de logs de envio

  1. Nova Tabela
    - `send_logs`
      - `id` (uuid, primary key)
      - `contact_id` (uuid, foreign key para contacts)
      - `message_id` (uuid, foreign key para messages)
      - `status` (text)
      - `timestamp` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `send_logs`
    - Adicionar políticas para usuários autenticados
*/

CREATE TABLE IF NOT EXISTS send_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id),
  message_id uuid REFERENCES messages(id),
  status text,
  timestamp timestamp DEFAULT now()
);

ALTER TABLE send_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read send_logs"
  ON send_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert send_logs"
  ON send_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update send_logs"
  ON send_logs
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete send_logs"
  ON send_logs
  FOR DELETE
  TO authenticated
  USING (true);