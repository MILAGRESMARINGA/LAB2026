/*
  # Criar tabela de grupos

  1. Nova Tabela
    - `groups`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `created_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `groups`
    - Adicionar políticas para usuários autenticados
*/

CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  created_at timestamp DEFAULT now()
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read groups"
  ON groups
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update groups"
  ON groups
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete groups"
  ON groups
  FOR DELETE
  TO authenticated
  USING (true);