-- Force le rafraîchissement du cache du schéma Supabase
NOTIFY pgrst, 'reload schema';

-- Alternative : utiliser la fonction de notification
SELECT pg_notify('pgrst', 'reload schema');