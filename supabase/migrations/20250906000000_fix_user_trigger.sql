-- ===================================================================
-- CORRECTION: Trigger utilisateur qui interfère avec create_user_profile
-- Date: 2025-09-06
-- Problème: Le trigger se déclenche sur INSERT...ON CONFLICT DO UPDATE
-- Solution: Modifier le trigger pour éviter les conflits
-- ===================================================================

BEGIN;

-- Supprimer le trigger problématique
DROP TRIGGER IF EXISTS trigger_update_articles_on_user_change ON users;

-- Recréer le trigger avec une condition plus restrictive
-- Il ne se déclenche que si l'email a vraiment changé (pas lors de la création)
CREATE TRIGGER trigger_update_articles_on_user_change
  AFTER UPDATE ON users
  FOR EACH ROW 
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION update_articles_on_user_change();

COMMIT;