-- Migration pour le système d'ingestion automatique TidiMondo
-- Date: 2025-08-30
-- Description: Configuration de l'utilisateur système et de l'audit trail

-- =====================================================
-- 1. TABLE D'AUDIT TRAIL POUR L'INGESTION
-- =====================================================

-- Table pour l'audit trail des opérations d'ingestion
CREATE TABLE IF NOT EXISTS ingestion_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_name TEXT,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('ingredient', 'ustensile', 'recette', 'batch_start', 'batch_end')),
  operation_action TEXT NOT NULL CHECK (operation_action IN ('created', 'updated', 'skipped', 'error', 'started', 'completed')),
  entity_id UUID,
  entity_name TEXT,
  source_description TEXT,
  metadata JSONB DEFAULT '{}',
  system_user_id UUID REFERENCES users(id),
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_audit_log_operation ON ingestion_audit_log(operation_type, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_batch ON ingestion_audit_log(batch_name, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_system_user ON ingestion_audit_log(system_user_id);

-- =====================================================
-- 2. FONCTION POUR CRÉER L'UTILISATEUR SYSTÈME
-- =====================================================

-- Fonction pour créer ou récupérer l'utilisateur système d'ingestion
CREATE OR REPLACE FUNCTION create_or_get_system_user()
RETURNS UUID AS $$
DECLARE
    system_user_uuid UUID;
    system_clerk_id TEXT := 'system_content_ingestion';
BEGIN
    -- Vérifier si l'utilisateur système existe déjà
    SELECT id INTO system_user_uuid
    FROM users 
    WHERE clerk_user_id = system_clerk_id;
    
    -- Si l'utilisateur n'existe pas, le créer
    IF system_user_uuid IS NULL THEN
        INSERT INTO users (
            id,
            clerk_user_id,
            email,
            subscription_status,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            system_clerk_id,
            'system-ingestion@tidimondo.local',
            'active',
            NOW(),
            NOW()
        )
        RETURNING id INTO system_user_uuid;
        
        -- Ajouter le rôle admin au nouvel utilisateur système
        UPDATE users SET is_admin = true WHERE id = system_user_uuid;
        
        RAISE NOTICE 'Utilisateur système créé avec l''ID: %', system_user_uuid;
    ELSE
        RAISE NOTICE 'Utilisateur système existant trouvé avec l''ID: %', system_user_uuid;
    END IF;
    
    RETURN system_user_uuid;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. MISE À JOUR DES TABLES POUR SUPPORT SYSTEM USER
-- =====================================================

-- Ajouter la colonne user_id aux ingrédients si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ingredients' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE ingredients ADD COLUMN user_id UUID REFERENCES users(id);
        CREATE INDEX IF NOT EXISTS idx_ingredients_user_id ON ingredients(user_id);
    END IF;
END $$;

-- Ajouter la colonne is_public aux ingrédients si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ingredients' AND column_name = 'is_public'
    ) THEN
        ALTER TABLE ingredients ADD COLUMN is_public BOOLEAN DEFAULT false;
        CREATE INDEX IF NOT EXISTS idx_ingredients_is_public ON ingredients(is_public);
    END IF;
END $$;

-- Ajouter la colonne user_id aux ustensiles si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ustensiles' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE ustensiles ADD COLUMN user_id UUID REFERENCES users(id);
        CREATE INDEX IF NOT EXISTS idx_ustensiles_user_id ON ustensiles(user_id);
    END IF;
END $$;

-- Ajouter la colonne is_public aux ustensiles si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ustensiles' AND column_name = 'is_public'
    ) THEN
        ALTER TABLE ustensiles ADD COLUMN is_public BOOLEAN DEFAULT false;
        CREATE INDEX IF NOT EXISTS idx_ustensiles_is_public ON ustensiles(is_public);
    END IF;
END $$;

-- =====================================================
-- 4. FONCTIONS UTILITAIRES POUR L'INGESTION
-- =====================================================

-- Fonction pour logger une opération d'ingestion
CREATE OR REPLACE FUNCTION log_ingestion_operation(
    p_batch_name TEXT,
    p_operation_type TEXT,
    p_operation_action TEXT,
    p_entity_id UUID DEFAULT NULL,
    p_entity_name TEXT DEFAULT NULL,
    p_source_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}',
    p_system_user_id UUID DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_processing_time_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO ingestion_audit_log (
        batch_name,
        operation_type,
        operation_action,
        entity_id,
        entity_name,
        source_description,
        metadata,
        system_user_id,
        error_message,
        processing_time_ms
    ) VALUES (
        p_batch_name,
        p_operation_type,
        p_operation_action,
        p_entity_id,
        p_entity_name,
        p_source_description,
        p_metadata,
        p_system_user_id,
        p_error_message,
        p_processing_time_ms
    )
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. EXÉCUTION DE LA CONFIGURATION INITIALE
-- =====================================================

-- Créer l'utilisateur système
SELECT create_or_get_system_user();