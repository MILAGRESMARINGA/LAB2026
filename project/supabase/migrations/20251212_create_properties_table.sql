-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  title text NOT NULL,
  type text NOT NULL, -- Ex: 'Casa', 'Apartamento', 'Terreno', 'Lançamento'
  price numeric NOT NULL,
  address text NOT NULL,
  description text,
  status text DEFAULT 'Disponível', -- Ex: 'Disponível', 'Vendido', 'Em Negociação'
  photos_url text[] -- Array of URLs for images
);

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own properties"
  ON properties FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own properties"
  ON properties
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add Foreign Key to leads table (if leads table exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'property_interest_id') THEN
        ALTER TABLE leads ADD COLUMN property_interest_id uuid REFERENCES properties(id) ON DELETE SET NULL;
    END IF;
END $$;
