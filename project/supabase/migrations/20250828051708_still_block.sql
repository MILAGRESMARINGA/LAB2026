/*
  # Criar tabela de mensagens

  1. Nova Tabela
    - `messages`
      - `id` (uuid, primary key)
      - `template` (text)
      - `created_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `messages`
    - Adicionar políticas para usuários autenticados
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template text,
  created_at timestamp DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete messages"
  ON messages
  FOR DELETE
  TO authenticated
  USING (true);