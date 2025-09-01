/**
 * Gestionnaire d'authentification hybride sécurisée
 * Gère l'authentification avec Service Role Key et System User
 */

const { createClient } = require('@supabase/supabase-js');
const CONFIG = require('../config/pipeline.config.js');

class AuthManager {
  constructor() {
    this.supabaseClient = null;
    this.systemUserId = null;
    this.isInitialized = false;
  }

  /**
   * Initialise l'authentification hybride
   */
  async initialize() {
    try {
      console.log('🔐 Initialisation du gestionnaire d\'authentification...');
      
      // Vérifier les variables d'environnement
      this._validateEnvironmentVariables();
      
      // Créer le client Supabase avec Service Role Key
      this.supabaseClient = createClient(
        CONFIG.authentication.supabase.url,
        CONFIG.authentication.supabase.serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      // Vérifier la connexion
      await this._validateConnection();

      // Initialiser ou récupérer l'utilisateur système
      await this._initializeSystemUser();

      this.isInitialized = true;
      console.log('✅ Gestionnaire d\'authentification initialisé avec succès');
      
      return {
        success: true,
        systemUserId: this.systemUserId
      };

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de l\'authentification:', error.message);
      throw error;
    }
  }

  /**
   * Valide les variables d'environnement requises
   */
  _validateEnvironmentVariables() {
    const required = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENROUTER_API_KEY'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Variables d'environnement manquantes: ${missing.join(', ')}`);
    }

    console.log('📋 Variables d\'environnement validées');
  }

  /**
   * Vérifie la connexion à Supabase
   */
  async _validateConnection() {
    try {
      const { data, error } = await this.supabaseClient
        .from('users')
        .select('id')
        .limit(1)
        .single();

      if (error) {
        throw new Error(`Connexion Supabase échouée: ${error.message}`);
      }

      console.log('🔗 Connexion Supabase validée');
    } catch (error) {
      throw new Error(`Impossible de se connecter à Supabase: ${error.message}`);
    }
  }

  /**
   * Initialise ou récupère l'utilisateur système
   */
  async _initializeSystemUser() {
    try {
      // Si un SYSTEM_USER_ID est fourni, l'utiliser directement
      if (process.env.TIDIMONDO_SYSTEM_USER_ID) {
        this.systemUserId = process.env.TIDIMONDO_SYSTEM_USER_ID;
        
        // Vérifier que l'utilisateur existe
        const { data: user, error } = await this.supabaseClient
          .from('users')
          .select('id, clerk_user_id, nom, prenom')
          .eq('id', this.systemUserId)
          .single();

        if (error || !user) {
          throw new Error(`Utilisateur système avec l'ID ${this.systemUserId} non trouvé`);
        }

        console.log(`👤 Utilisateur système trouvé: ${user.nom} ${user.prenom} (${user.clerk_user_id})`);
        return;
      }

      // Sinon, utiliser la fonction SQL pour créer/récupérer l'utilisateur système
      const { data, error } = await this.supabaseClient
        .rpc('create_or_get_system_user');

      if (error) {
        throw new Error(`Erreur lors de la création de l'utilisateur système: ${error.message}`);
      }

      this.systemUserId = data;
      console.log(`👤 Utilisateur système configuré avec l'ID: ${this.systemUserId}`);

    } catch (error) {
      throw new Error(`Impossible d'initialiser l'utilisateur système: ${error.message}`);
    }
  }

  /**
   * Retourne le client Supabase authentifié
   */
  getSupabaseClient() {
    if (!this.isInitialized) {
      throw new Error('AuthManager n\'est pas initialisé. Appelez initialize() d\'abord.');
    }
    return this.supabaseClient;
  }

  /**
   * Retourne l'ID de l'utilisateur système
   */
  getSystemUserId() {
    if (!this.isInitialized) {
      throw new Error('AuthManager n\'est pas initialisé. Appelez initialize() d\'abord.');
    }
    return this.systemUserId;
  }

  /**
   * Vérifie si le gestionnaire est initialisé
   */
  isReady() {
    return this.isInitialized && this.supabaseClient && this.systemUserId;
  }

  /**
   * Ferme les connexions et nettoie les ressources
   */
  async cleanup() {
    if (this.supabaseClient) {
      // Supabase client n'a pas de méthode close explicite
      this.supabaseClient = null;
    }
    
    this.systemUserId = null;
    this.isInitialized = false;
    
    console.log('🧹 Gestionnaire d\'authentification nettoyé');
  }

  /**
   * Retourne les informations de configuration pour logging
   */
  getAuthInfo() {
    return {
      isInitialized: this.isInitialized,
      hasSupabaseClient: !!this.supabaseClient,
      systemUserId: this.systemUserId,
      supabaseUrl: CONFIG.authentication.supabase.url
    };
  }
}

module.exports = AuthManager;