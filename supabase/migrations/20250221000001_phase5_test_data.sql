-- Migration TidiMondo - Phase 5 : Données de test pour restrictions freemium
-- Date: 2025-02-21
-- Description: Création de données de test pour valider le fonctionnement des restrictions freemium

-- =====================================================
-- 1. CRÉATION D'UTILISATEURS DE TEST
-- =====================================================

-- Utilisateur gratuit pour tester les limitations
INSERT INTO users (id, clerk_user_id, email, subscription_status, created_at, updated_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'user_test_gratuit', 'test.gratuit@tidimondo.com', 'free', NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'user_test_pro', 'test.pro@tidimondo.com', 'active', NOW(), NOW())
ON CONFLICT (clerk_user_id) DO UPDATE SET
    email = EXCLUDED.email,
    subscription_status = EXCLUDED.subscription_status,
    updated_at = NOW();

-- =====================================================
-- 2. NOTIFICATION DE SUCCÈS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration de test réussie : utilisateurs de test créés';
    RAISE NOTICE 'Utilisateur gratuit : user_test_gratuit (subscription_status: free)';
    RAISE NOTICE 'Utilisateur Pro : user_test_pro (subscription_status: active)';
END $$;