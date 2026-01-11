/*
  # Criar tabela de contatos

  1. Nova Tabela
    - `contacts`
      - `id` (uuid, primary key)
      - `name` (text)
      - `phone` (text, unique)
      - `type` (text)
      - `created_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `contacts`
    - Adicionar política para usuários autenticados lerem seus próprios dados
*/

CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  phone text UNIQUE,
  type text,
  created_at timestamp DEFAULT now()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own contacts"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert contacts"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update contacts"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete contacts"
  ON contacts
  FOR DELETE
  TO authenticated
  USING (true);