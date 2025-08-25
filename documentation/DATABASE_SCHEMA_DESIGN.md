# Schéma de base de données TidiMondo - Outil d'organisation de séjours

## Vue d'ensemble

Ce document définit le schéma complet de la base de données pour l'outil d'organisation de séjours TidiMondo, en s'appuyant sur l'infrastructure existante (Supabase + Clerk).

## Principes de conception

1. **Compatibilité** : Préservation de l'existant (tables `users` et `subscriptions`)
2. **Évolutivité** : Structure permettant l'ajout de fonctionnalités futures
3. **Performance** : Index optimisés pour les requêtes fréquentes
4. **Sécurité** : RLS (Row Level Security) sur toutes les tables sensibles
5. **Intégrité** : Contraintes et relations cohérentes

## Structure des tables

### 1. Tables existantes (à conserver)

```sql
-- Table users (existante)
users (
  id UUID PRIMARY KEY,
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  subscription_id TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table subscriptions (existante)
subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Nouvelles tables métier

#### 2.1 Table `ingredients`
```sql
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT UNIQUE NOT NULL,
  nom_normalise TEXT NOT NULL, -- Version normalisée pour la recherche
  unite_base TEXT NOT NULL CHECK (unite_base IN ('g', 'kg', 'ml', 'l', 'piece', 'cuillere_soupe', 'cuillere_cafe')),
  categorie TEXT CHECK (categorie IN ('legume', 'fruit', 'viande', 'poisson', 'feculent', 'produit_laitier', 'epice', 'condiment', 'boisson', 'autre')),
  prix_moyen_euro DECIMAL(8,2), -- Prix moyen pour estimation budget
  saison TEXT[], -- ['printemps', 'ete', 'automne', 'hiver'] ou NULL si toute l'année
  allergenes TEXT[], -- ['gluten', 'lactose', 'oeuf', 'arachide', 'fruits_coque', 'soja', 'poisson', 'crustace']
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2.2 Table `ustensiles`
```sql
CREATE TABLE ustensiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT UNIQUE NOT NULL,
  nom_normalise TEXT NOT NULL,
  categorie TEXT CHECK (categorie IN ('cuisson', 'preparation', 'service', 'mesure', 'autre')),
  description TEXT,
  obligatoire BOOLEAN DEFAULT false, -- Si l'ustensile est indispensable pour la recette
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2.3 Table `recettes`
```sql
CREATE TABLE recettes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  nom_normalise TEXT NOT NULL,
  description TEXT,
  instructions TEXT NOT NULL,
  temps_preparation INTEGER, -- en minutes
  temps_cuisson INTEGER, -- en minutes
  difficulte INTEGER CHECK (difficulte BETWEEN 1 AND 5),
  portions INTEGER NOT NULL DEFAULT 4,
  regime_alimentaire TEXT[] DEFAULT '{}', -- ['vegetarien', 'vegan', 'sans_gluten', 'sans_lactose', 'halal', 'casher']
  type_repas TEXT[] DEFAULT '{}', -- ['petit_dejeuner', 'dejeuner', 'diner', 'collation', 'apero']
  saison TEXT[], -- ['printemps', 'ete', 'automne', 'hiver'] ou NULL
  cout_estime DECIMAL(8,2), -- Coût estimé par portion
  calories_par_portion INTEGER,
  image_url TEXT,
  source TEXT, -- Source de la recette (livre, site web, etc.)
  notes_personnelles TEXT,
  is_public BOOLEAN DEFAULT false, -- Pour partage futur entre utilisateurs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2.4 Table `recette_ingredients` (relation many-to-many)
```sql
CREATE TABLE recette_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recette_id UUID NOT NULL REFERENCES recettes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  quantite DECIMAL(10,3) NOT NULL CHECK (quantite > 0),
  unite TEXT NOT NULL CHECK (unite IN ('g', 'kg', 'ml', 'l', 'piece', 'cuillere_soupe', 'cuillere_cafe', 'pincee', 'verre')),
  optionnel BOOLEAN DEFAULT false,
  notes TEXT, -- Ex: "bien mûr", "coupé en dés"
  ordre_affichage INTEGER DEFAULT 0, -- Pour ordonner les ingrédients
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2.5 Table `recette_ustensiles` (relation many-to-many)
```sql
CREATE TABLE recette_ustensiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recette_id UUID NOT NULL REFERENCES recettes(id) ON DELETE CASCADE,
  ustensile_id UUID NOT NULL REFERENCES ustensiles(id) ON DELETE RESTRICT,
  obligatoire BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2.6 Table `sejours`
```sql
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
```

#### 2.7 Table `sejour_participants`
```sql
CREATE TABLE sejour_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sejour_id UUID NOT NULL REFERENCES sejours(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  email TEXT,
  regime_alimentaire TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  preferences TEXT, -- Préférences alimentaires en texte libre
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2.8 Table `sejour_repas`
```sql
CREATE TABLE sejour_repas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sejour_id UUID NOT NULL REFERENCES sejours(id) ON DELETE CASCADE,
  recette_id UUID REFERENCES recettes(id) ON DELETE SET NULL,
  date_repas DATE NOT NULL,
  type_repas TEXT NOT NULL CHECK (type_repas IN ('petit_dejeuner', 'dejeuner', 'diner', 'collation', 'apero')),
  nombre_portions INTEGER NOT NULL DEFAULT 1 CHECK (nombre_portions > 0),
  notes TEXT,
  repas_libre TEXT, -- Pour les repas sans recette (ex: "Restaurant", "Pique-nique libre")
  cout_estime DECIMAL(8,2),
  ordre_dans_journee INTEGER DEFAULT 0, -- Pour ordonner les repas dans la journée
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2.9 Table `listes_courses` (pour sauvegarder les listes générées)
```sql
CREATE TABLE listes_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sejour_id UUID NOT NULL REFERENCES sejours(id) ON DELETE CASCADE,
  nom TEXT NOT NULL DEFAULT 'Liste de courses',
  contenu JSONB NOT NULL, -- Structure JSON avec les ingrédients agrégés
  cout_total_estime DECIMAL(10,2),
  date_generation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Index pour les performances

```sql
-- Index sur les tables existantes (si pas déjà présents)
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- Index sur les nouvelles tables
CREATE INDEX idx_ingredients_nom_normalise ON ingredients(nom_normalise);
CREATE INDEX idx_ingredients_categorie ON ingredients(categorie);
CREATE INDEX idx_ustensiles_nom_normalise ON ustensiles(nom_normalise);

CREATE INDEX idx_recettes_user_id ON recettes(user_id);
CREATE INDEX idx_recettes_nom_normalise ON recettes(nom_normalise);
CREATE INDEX idx_recettes_regime_alimentaire ON recettes USING GIN(regime_alimentaire);
CREATE INDEX idx_recettes_type_repas ON recettes USING GIN(type_repas);
CREATE INDEX idx_recettes_is_public ON recettes(is_public);

CREATE INDEX idx_recette_ingredients_recette_id ON recette_ingredients(recette_id);
CREATE INDEX idx_recette_ingredients_ingredient_id ON recette_ingredients(ingredient_id);
CREATE INDEX idx_recette_ustensiles_recette_id ON recette_ustensiles(recette_id);

CREATE INDEX idx_sejours_user_id ON sejours(user_id);
CREATE INDEX idx_sejours_dates ON sejours(date_debut, date_fin);
CREATE INDEX idx_sejours_statut ON sejours(statut);

CREATE INDEX idx_sejour_participants_sejour_id ON sejour_participants(sejour_id);
CREATE INDEX idx_sejour_repas_sejour_id ON sejour_repas(sejour_id);
CREATE INDEX idx_sejour_repas_date ON sejour_repas(date_repas);
CREATE INDEX idx_sejour_repas_recette_id ON sejour_repas(recette_id);

CREATE INDEX idx_listes_courses_sejour_id ON listes_courses(sejour_id);
```

## Contraintes et triggers

```sql
-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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

-- Fonction pour normaliser les noms (supprime accents, met en minuscules)
CREATE OR REPLACE FUNCTION normaliser_nom(nom TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(unaccent(trim(nom)));
END;
$$ LANGUAGE plpgsql;

-- Triggers pour auto-remplir les champs normalisés
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

-- Contrainte pour vérifier que date_fin >= date_debut
ALTER TABLE sejours ADD CONSTRAINT check_dates_sejour 
    CHECK (date_fin >= date_debut);

-- Contrainte pour vérifier que les repas sont dans la période du séjour
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
```

## Politiques RLS (Row Level Security)

```sql
-- Activer RLS sur toutes les nouvelles tables
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ustensiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recette_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recette_ustensiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sejours ENABLE ROW LEVEL SECURITY;
ALTER TABLE sejour_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sejour_repas ENABLE ROW LEVEL SECURITY;
ALTER TABLE listes_courses ENABLE ROW LEVEL SECURITY;

-- Politiques pour ingredients et ustensiles (lecture publique, écriture admin)
CREATE POLICY "Lecture publique ingredients" ON ingredients
    FOR SELECT USING (true);

CREATE POLICY "Lecture publique ustensiles" ON ustensiles
    FOR SELECT USING (true);

-- Politiques pour recettes (propriétaire + publiques)
CREATE POLICY "Utilisateurs voient leurs recettes" ON recettes
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
        ) OR is_public = true
    );

CREATE POLICY "Utilisateurs modifient leurs recettes" ON recettes
    FOR ALL USING (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
        )
    );

-- Politiques pour recette_ingredients et recette_ustensiles
CREATE POLICY "Accès via recette" ON recette_ingredients
    FOR ALL USING (
        recette_id IN (
            SELECT id FROM recettes WHERE 
            user_id IN (
                SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
            ) OR is_public = true
        )
    );

CREATE POLICY "Accès via recette" ON recette_ustensiles
    FOR ALL USING (
        recette_id IN (
            SELECT id FROM recettes WHERE 
            user_id IN (
                SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
            ) OR is_public = true
        )
    );

-- Politiques pour séjours (propriétaire uniquement)
CREATE POLICY "Utilisateurs voient leurs séjours" ON sejours
    FOR ALL USING (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
        )
    );

-- Politiques pour les tables liées aux séjours
CREATE POLICY "Accès via séjour" ON sejour_participants
    FOR ALL USING (
        sejour_id IN (
            SELECT id FROM sejours WHERE 
            user_id IN (
                SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
            )
        )
    );

CREATE POLICY "Accès via séjour" ON sejour_repas
    FOR ALL USING (
        sejour_id IN (
            SELECT id FROM sejours WHERE 
            user_id IN (
                SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
            )
        )
    );

CREATE POLICY "Accès via séjour" ON listes_courses
    FOR ALL USING (
        sejour_id IN (
            SELECT id FROM sejours WHERE 
            user_id IN (
                SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
            )
        )
    );
```

## Données de base à insérer

```sql
-- Ingrédients de base
INSERT INTO ingredients (nom, unite_base, categorie, allergenes) VALUES
('Farine de blé', 'g', 'feculent', ARRAY['gluten']),
('Œufs', 'piece', 'autre', ARRAY['oeuf']),
('Lait', 'ml', 'produit_laitier', ARRAY['lactose']),
('Beurre', 'g', 'produit_laitier', ARRAY['lactose']),
('Sucre', 'g', 'autre', ARRAY[]::TEXT[]),
('Sel', 'g', 'condiment', ARRAY[]::TEXT[]),
('Poivre', 'g', 'epice', ARRAY[]::TEXT[]),
('Huile d''olive', 'ml', 'condiment', ARRAY[]::TEXT[]),
('Oignon', 'piece', 'legume', ARRAY[]::TEXT[]),
('Ail', 'piece', 'legume', ARRAY[]::TEXT[]),
('Tomate', 'piece', 'legume', ARRAY[]::TEXT[]),
('Carotte', 'piece', 'legume', ARRAY[]::TEXT[]),
('Pomme de terre', 'piece', 'legume', ARRAY[]::TEXT[]),
('Riz', 'g', 'feculent', ARRAY[]::TEXT[]),
('Pâtes', 'g', 'feculent', ARRAY['gluten']),
('Poulet', 'g', 'viande', ARRAY[]::TEXT[]),
('Bœuf', 'g', 'viande', ARRAY[]::TEXT[]),
('Saumon', 'g', 'poisson', ARRAY['poisson']),
('Fromage râpé', 'g', 'produit_laitier', ARRAY['lactose']),
('Pain', 'piece', 'feculent', ARRAY['gluten']);

-- Ustensiles de base
INSERT INTO ustensiles (nom, categorie, obligatoire) VALUES
('Casserole', 'cuisson', true),
('Poêle', 'cuisson', true),
('Four', 'cuisson', false),
('Couteau', 'preparation', true),
('Planche à découper', 'preparation', true),
('Saladier', 'preparation', false),
('Fouet', 'preparation', false),
('Spatule', 'preparation', false),
('Balance de cuisine', 'mesure', false),
('Verre doseur', 'mesure', false),
('Assiettes', 'service', true),
('Couverts', 'service', true);
```

## Validation du schéma

### Points de validation :
1. ✅ **Intégrité référentielle** : Toutes les clés étrangères sont correctement définies
2. ✅ **Contraintes métier** : Dates cohérentes, quantités positives, énumérations valides
3. ✅ **Performance** : Index sur les colonnes fréquemment requêtées
4. ✅ **Sécurité** : RLS activé avec politiques appropriées
5. ✅ **Évolutivité** : Structure permettant l'ajout de fonctionnalités
6. ✅ **Normalisation** : Recherche facilitée par les champs normalisés

### Cas d'usage couverts :
- ✅ Création et gestion de recettes personnalisées
- ✅ Planification complète de séjours
- ✅ Gestion des participants et contraintes alimentaires
- ✅ Génération de listes de courses
- ✅ Estimation des coûts
- ✅ Restrictions freemium (via user_id et comptage)

Ce schéma est prêt pour l'implémentation en Phase 1.2.