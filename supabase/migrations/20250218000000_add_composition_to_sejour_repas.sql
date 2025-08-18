-- Migration pour ajouter la colonne composition à la table sejour_repas
-- Cette colonne stockera les détails de composition des repas (entrée, plat, dessert, ingrédients, etc.)

ALTER TABLE sejour_repas 
ADD COLUMN composition JSONB;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN sejour_repas.composition IS 'Composition détaillée du repas en JSON (entrée, plat, dessert, ingrédients, boissons, accompagnements)';

-- Créer un index pour améliorer les performances des requêtes sur la composition
CREATE INDEX IF NOT EXISTS idx_sejour_repas_composition ON sejour_repas USING GIN (composition);