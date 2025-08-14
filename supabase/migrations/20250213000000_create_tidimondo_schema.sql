-- Migration TidiMondo - Création du schéma complet
-- Date: 2025-02-13
-- Description: Création de toutes les tables métier pour l'outil d'organisation de séjours

-- Extension pour unaccent (normalisation des noms)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- =====================================================
-- 1. TABLES DE BASE (INGRÉDIENTS ET USTENSILES)
-- =====================================================

-- Table des ingrédients
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT UNIQUE NOT NULL,
  nom_normalise TEXT NOT NULL,
  unite_base TEXT NOT NULL CHECK (unite_base IN ('g', 'kg', 'ml', 'l', 'piece', 'cuillere_soupe', 'cuillere_cafe')),
  categorie TEXT CHECK (categorie IN ('legume', 'fruit', 'viande', 'poisson', 'feculent', 'produit_laitier', 'epice', 'condiment', 'boisson', 'autre')),
  prix_moyen_euro DECIMAL(8,2),
  saison TEXT[],
  allergenes TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des ustensiles
CREATE TABLE ustensiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT UNIQUE NOT NULL,
  nom_normalise TEXT NOT NULL,
  categorie TEXT CHECK (categorie IN ('cuisson', 'preparation', 'service', 'mesure', 'autre')),
  description TEXT,
  obligatoire BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. TABLES RECETTES
-- =====================================================

-- Table des recettes
CREATE TABLE recettes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  nom_normalise TEXT NOT NULL,
  description TEXT,
  instructions TEXT NOT NULL,
  temps_preparation INTEGER,
  temps_cuisson INTEGER,
  difficulte INTEGER CHECK (difficulte BETWEEN 1 AND 5),
  portions INTEGER NOT NULL DEFAULT 4,
  regime_alimentaire TEXT[] DEFAULT '{}',
  type_repas TEXT[] DEFAULT '{}',
  saison TEXT[],
  cout_estime DECIMAL(8,2),
  calories_par_portion INTEGER,
  image_url TEXT,
  source TEXT,
  notes_personnelles TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de liaison recettes-ingrédients
CREATE TABLE recette_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recette_id UUID NOT NULL REFERENCES recettes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  quantite DECIMAL(10,3) NOT NULL CHECK (quantite > 0),
  unite TEXT NOT NULL CHECK (unite IN ('g', 'kg', 'ml', 'l', 'piece', 'cuillere_soupe', 'cuillere_cafe', 'pincee', 'verre')),
  optionnel BOOLEAN DEFAULT false,
  notes TEXT,
  ordre_affichage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de liaison recettes-ustensiles
CREATE TABLE recette_ustensiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recette_id UUID NOT NULL REFERENCES recettes(id) ON DELETE CASCADE,
  ustensile_id UUID NOT NULL REFERENCES ustensiles(id) ON DELETE RESTRICT,
  obligatoire BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. TABLES SÉJOURS
-- =====================================================

-- Table des séjours
CREATE TABLE sejours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  description TEXT,
  lieu TEXT,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  nombre_participants INTEGER NOT NULL DEFAULT 1 CHECK (nombre_participants > 0),
  type_sejour TEXT CHECK (type_sejour IN ('weekend', 'semaine', 'court', 'long')),
  budget_prevu DECIMAL(10,2),
  notes TEXT,
  statut TEXT DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'planifie', 'en_cours', 'termine', 'annule')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des participants aux séjours
CREATE TABLE sejour_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sejour_id UUID NOT NULL REFERENCES sejours(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  email TEXT,
  regime_alimentaire TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  preferences TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des repas planifiés
CREATE TABLE sejour_repas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sejour_id UUID NOT NULL REFERENCES sejours(id) ON DELETE CASCADE,
  recette_id UUID REFERENCES recettes(id) ON DELETE SET NULL,
  date_repas DATE NOT NULL,
  type_repas TEXT NOT NULL CHECK (type_repas IN ('petit_dejeuner', 'dejeuner', 'diner', 'collation', 'apero')),
  nombre_portions INTEGER NOT NULL DEFAULT 1 CHECK (nombre_portions > 0),
  notes TEXT,
  repas_libre TEXT,
  cout_estime DECIMAL(8,2),
  ordre_dans_journee INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des listes de courses générées
CREATE TABLE listes_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sejour_id UUID NOT NULL REFERENCES sejours(id) ON DELETE CASCADE,
  nom TEXT NOT NULL DEFAULT 'Liste de courses',
  contenu JSONB NOT NULL,
  cout_total_estime DECIMAL(10,2),
  date_generation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. CONTRAINTES MÉTIER
-- =====================================================

-- Contrainte pour vérifier que date_fin >= date_debut
ALTER TABLE sejours ADD CONSTRAINT check_dates_sejour 
    CHECK (date_fin >= date_debut);

-- =====================================================
-- 5. INDEX POUR LES PERFORMANCES
-- =====================================================

-- Index sur ingredients
CREATE INDEX idx_ingredients_nom_normalise ON ingredients(nom_normalise);
CREATE INDEX idx_ingredients_categorie ON ingredients(categorie);

-- Index sur ustensiles
CREATE INDEX idx_ustensiles_nom_normalise ON ustensiles(nom_normalise);

-- Index sur recettes
CREATE INDEX idx_recettes_user_id ON recettes(user_id);
CREATE INDEX idx_recettes_nom_normalise ON recettes(nom_normalise);
CREATE INDEX idx_recettes_regime_alimentaire ON recettes USING GIN(regime_alimentaire);
CREATE INDEX idx_recettes_type_repas ON recettes USING GIN(type_repas);
CREATE INDEX idx_recettes_is_public ON recettes(is_public);

-- Index sur les liaisons recettes
CREATE INDEX idx_recette_ingredients_recette_id ON recette_ingredients(recette_id);
CREATE INDEX idx_recette_ingredients_ingredient_id ON recette_ingredients(ingredient_id);
CREATE INDEX idx_recette_ustensiles_recette_id ON recette_ustensiles(recette_id);

-- Index sur séjours
CREATE INDEX idx_sejours_user_id ON sejours(user_id);
CREATE INDEX idx_sejours_dates ON sejours(date_debut, date_fin);
CREATE INDEX idx_sejours_statut ON sejours(statut);

-- Index sur les tables liées aux séjours
CREATE INDEX idx_sejour_participants_sejour_id ON sejour_participants(sejour_id);
CREATE INDEX idx_sejour_repas_sejour_id ON sejour_repas(sejour_id);
CREATE INDEX idx_sejour_repas_date ON sejour_repas(date_repas);
CREATE INDEX idx_sejour_repas_recette_id ON sejour_repas(recette_id);
CREATE INDEX idx_listes_courses_sejour_id ON listes_courses(sejour_id);

-- =====================================================
-- 6. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour normaliser les noms
CREATE OR REPLACE FUNCTION normaliser_nom(nom TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(unaccent(trim(nom)));
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Triggers pour updated_at
CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON ingredients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ustensiles_updated_at BEFORE UPDATE ON ustensiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recettes_updated_at BEFORE UPDATE ON recettes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sejours_updated_at BEFORE UPDATE ON sejours
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sejour_repas_updated_at BEFORE UPDATE ON sejour_repas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers pour auto-normalisation des noms
CREATE OR REPLACE FUNCTION auto_normaliser_ingredient()
RETURNS TRIGGER AS $$
BEGIN
    NEW.nom_normalise = normaliser_nom(NEW.nom);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_normaliser_ingredient
    BEFORE INSERT OR UPDATE ON ingredients
    FOR EACH ROW EXECUTE FUNCTION auto_normaliser_ingredient();

CREATE OR REPLACE FUNCTION auto_normaliser_ustensile()
RETURNS TRIGGER AS $$
BEGIN
    NEW.nom_normalise = normaliser_nom(NEW.nom);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_normaliser_ustensile
    BEFORE INSERT OR UPDATE ON ustensiles
    FOR EACH ROW EXECUTE FUNCTION auto_normaliser_ustensile();

CREATE OR REPLACE FUNCTION auto_normaliser_recette()
RETURNS TRIGGER AS $$
BEGIN
    NEW.nom_normalise = normaliser_nom(NEW.nom);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_normaliser_recette
    BEFORE INSERT OR UPDATE ON recettes
    FOR EACH ROW EXECUTE FUNCTION auto_normaliser_recette();

-- Trigger pour vérifier que les repas sont dans la période du séjour
CREATE OR REPLACE FUNCTION check_repas_dans_sejour()
RETURNS TRIGGER AS $$
DECLARE
    sejour_debut DATE;
    sejour_fin DATE;
BEGIN
    SELECT date_debut, date_fin INTO sejour_debut, sejour_fin
    FROM sejours WHERE id = NEW.sejour_id;
    
    IF NEW.date_repas < sejour_debut OR NEW.date_repas > sejour_fin THEN
        RAISE EXCEPTION 'La date du repas doit être comprise dans la période du séjour';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_repas_dans_sejour
    BEFORE INSERT OR UPDATE ON sejour_repas
    FOR EACH ROW EXECUTE FUNCTION check_repas_dans_sejour();