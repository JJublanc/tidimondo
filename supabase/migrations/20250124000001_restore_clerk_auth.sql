-- Restaurer la structure pour l'authentification Clerk
-- Supprimer la table users actuelle et la recréer pour Clerk

DROP TABLE IF EXISTS public.users CASCADE;

-- Créer la table users pour Clerk
CREATE TABLE public.users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id text UNIQUE NOT NULL,
  email text,
  subscription_status text DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'canceled', 'past_due')),
  stripe_customer_id text,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir leurs propres données
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Politique pour permettre aux utilisateurs de mettre à jour leurs propres données
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Politique pour permettre l'insertion de nouveaux utilisateurs
CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- Index pour améliorer les performances
CREATE INDEX idx_users_clerk_user_id ON public.users(clerk_user_id);
CREATE INDEX idx_users_stripe_customer_id ON public.users(stripe_customer_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();