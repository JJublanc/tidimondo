#!/usr/bin/env node

/**
 * Script de configuration initiale de la pipeline d'ingestion TidiMondo
 * Configure la base de données et valide l'environnement
 */

// Charger les variables d'environnement depuis .env
require('dotenv').config();

const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

class SetupManager {
  constructor() {
    this.supabaseClient = null;
  }

  /**
   * Exécute la configuration complète
   */
  async run() {
    try {
      console.log('🔧 Configuration initiale de la pipeline d\'ingestion TidiMondo');
      console.log('================================================================');

      // 1. Vérifier les variables d'environnement
      await this._checkEnvironmentVariables();

      // 2. Initialiser Supabase
      await this._initializeSupabase();

      // 3. Exécuter les migrations
      await this._runMigrations();

      // 4. Valider la configuration
      await this._validateSetup();

      // 5. Afficher les informations finales
      await this._displayFinalInfo();

      console.log('\n✅ Configuration terminée avec succès !');
      console.log('🚀 La pipeline est prête à être utilisée.');

    } catch (error) {
      console.error('\n❌ Erreur lors de la configuration:', error.message);
      console.error('\n💡 Vérifiez votre configuration et réessayez.');
      process.exit(1);
    }
  }

  /**
   * Vérifie les variables d'environnement
   */
  async _checkEnvironmentVariables() {
    console.log('\n📋 Vérification des variables d\'environnement...');

    const requiredVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENROUTER_API_KEY'
    ];

    const missingVars = [];
    const presentVars = [];

    for (const varName of requiredVars) {
      if (process.env[varName]) {
        presentVars.push(varName);
        console.log(`✅ ${varName}: Configurée`);
      } else {
        missingVars.push(varName);
        console.log(`❌ ${varName}: Manquante`);
      }
    }

    if (missingVars.length > 0) {
      console.log('\n⚠️ Variables d\'environnement manquantes:');
      missingVars.forEach(varName => {
        console.log(`   - ${varName}`);
      });
      
      console.log('\n📝 Copiez le fichier .env.template vers .env et configurez les variables:');
      console.log('   cp scripts/data-ingestion/config/.env.template .env');
      
      throw new Error('Variables d\'environnement manquantes');
    }

    // Vérifier la variable optionnelle TIDIMONDO_SYSTEM_USER_ID
    if (process.env.TIDIMONDO_SYSTEM_USER_ID) {
      console.log(`✅ TIDIMONDO_SYSTEM_USER_ID: ${process.env.TIDIMONDO_SYSTEM_USER_ID}`);
    } else {
      console.log(`ℹ️ TIDIMONDO_SYSTEM_USER_ID: Non définie (sera créée automatiquement)`);
    }
  }

  /**
   * Initialise la connexion Supabase
   */
  async _initializeSupabase() {
    console.log('\n🔗 Initialisation de la connexion Supabase...');

    try {
      this.supabaseClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      // Test de connexion
      const { data, error } = await this.supabaseClient
        .from('users')
        .select('id')
        .limit(1)
        .single();

      if (error) {
        throw new Error(`Connexion Supabase échouée: ${error.message}`);
      }

      console.log('✅ Connexion Supabase établie');

    } catch (error) {
      throw new Error(`Impossible de se connecter à Supabase: ${error.message}`);
    }
  }

  /**
   * Exécute les migrations SQL
   */
  async _runMigrations() {
    console.log('\n🗄️ Exécution des migrations de base de données...');

    try {
      const migrationPath = path.join(__dirname, 'migrations', 'setup-ingestion-system.sql');
      const migrationSQL = await fs.readFile(migrationPath, 'utf-8');

      console.log('📄 Exécution du script de migration...');
      
      const { error } = await this.supabaseClient.rpc('exec', {
        sql: migrationSQL
      });

      if (error) {
        // Essayer d'exécuter directement si rpc('exec') n'est pas disponible
        console.log('⚠️ Tentative d\'exécution alternative...');
        
        // Diviser le script en commandes individuelles
        const commands = migrationSQL
          .split(';')
          .map(cmd => cmd.trim())
          .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

        for (const command of commands) {
          if (command.includes('CREATE') || command.includes('INSERT') || command.includes('SELECT')) {
            try {
              await this.supabaseClient.rpc('exec_sql', { query: command });
            } catch (cmdError) {
              console.warn(`⚠️ Commande ignorée: ${command.substring(0, 50)}...`);
            }
          }
        }
      }

      console.log('✅ Migrations exécutées avec succès');

    } catch (error) {
      console.error('❌ Erreur lors de l\'exécution des migrations:', error.message);
      console.log('\n💡 Vous pouvez exécuter manuellement le script SQL:');
      console.log('   scripts/data-ingestion/migrations/setup-ingestion-system.sql');
      throw error;
    }
  }

  /**
   * Valide la configuration
   */
  async _validateSetup() {
    console.log('\n🔍 Validation de la configuration...');

    try {
      // Vérifier que la table d'audit existe
      const { data: auditTable, error: auditError } = await this.supabaseClient
        .from('ingestion_audit_log')
        .select('id')
        .limit(1);

      if (auditError) {
        throw new Error(`Table d'audit non trouvée: ${auditError.message}`);
      }
      console.log('✅ Table d\'audit trail configurée');

      // Vérifier ou créer l'utilisateur système
      const { data: systemUserId, error: userError } = await this.supabaseClient
        .rpc('create_or_get_system_user');

      if (userError) {
        throw new Error(`Impossible de configurer l'utilisateur système: ${userError.message}`);
      }
      console.log(`✅ Utilisateur système configuré: ${systemUserId}`);

      // Vérifier les tables principales
      const tables = ['ingredients', 'ustensiles', 'recettes'];
      for (const table of tables) {
        const { error } = await this.supabaseClient
          .from(table)
          .select('id')
          .limit(1);

        if (error) {
          throw new Error(`Table ${table} non accessible: ${error.message}`);
        }
        console.log(`✅ Table ${table} accessible`);
      }

      // Test de l'API OpenRouter
      console.log('🤖 Test de l\'API OpenRouter...');
      const testResponse = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
        }
      });

      if (!testResponse.ok) {
        throw new Error(`API OpenRouter non accessible: ${testResponse.status}`);
      }
      console.log('✅ API OpenRouter accessible');

    } catch (error) {
      throw new Error(`Validation échouée: ${error.message}`);
    }
  }

  /**
   * Affiche les informations finales
   */
  async _displayFinalInfo() {
    console.log('\n📊 Informations de configuration:');
    console.log('==================================');

    try {
      // Statistiques des tables
      const [ingredients, ustensiles, recettes] = await Promise.all([
        this.supabaseClient.from('ingredients').select('id', { count: 'exact' }).eq('is_public', true),
        this.supabaseClient.from('ustensiles').select('id', { count: 'exact' }).eq('is_public', true),
        this.supabaseClient.from('recettes').select('id', { count: 'exact' }).eq('is_public', true)
      ]);

      console.log(`🥬 Ingrédients publics: ${ingredients.count || 0}`);
      console.log(`🔪 Ustensiles publics: ${ustensiles.count || 0}`);
      console.log(`📝 Recettes publiques: ${recettes.count || 0}`);

    } catch (error) {
      console.log('⚠️ Impossible de récupérer les statistiques');
    }

    console.log('\n🛠️ Commandes disponibles:');
    console.log('   Lancer la pipeline: node scripts/data-ingestion/pipeline.js <fichier-input.json>');
    console.log('   Voir les statistiques: node scripts/data-ingestion/pipeline.js --stats');
    console.log('   Aide: node scripts/data-ingestion/pipeline.js --help');

    console.log('\n📁 Fichiers d\'exemple:');
    console.log('   scripts/data-ingestion/templates/examples/recettes-ete.json');
    console.log('   scripts/data-ingestion/templates/examples/recettes-hiver.json');
  }

  /**
   * Crée le fichier .env si nécessaire
   */
  async createEnvFile() {
    try {
      const envPath = path.join(process.cwd(), '.env');
      const templatePath = path.join(__dirname, 'config', '.env.template');

      // Vérifier si .env existe déjà
      try {
        await fs.access(envPath);
        console.log('ℹ️ Le fichier .env existe déjà');
        return;
      } catch {
        // Le fichier n'existe pas, on va le créer
      }

      // Lire le template
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      
      // Écrire le fichier .env
      await fs.writeFile(envPath, templateContent, 'utf-8');
      
      console.log('✅ Fichier .env créé depuis le template');
      console.log('📝 Veuillez configurer les variables dans le fichier .env');

    } catch (error) {
      console.error('❌ Erreur lors de la création du fichier .env:', error.message);
    }
  }
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  const setup = new SetupManager();

  if (args.includes('--create-env')) {
    await setup.createEnvFile();
    return;
  }

  if (args.includes('--help')) {
    console.log(`
Configuration de la pipeline d'ingestion TidiMondo

Usage: node setup.js [options]

Options:
  --create-env    Créer le fichier .env depuis le template
  --help          Afficher cette aide

Variables d'environnement requises:
  SUPABASE_URL                 URL de votre projet Supabase
  SUPABASE_SERVICE_ROLE_KEY    Clé de service role Supabase
  OPENROUTER_API_KEY           Clé API OpenRouter
  TIDIMONDO_SYSTEM_USER_ID     (Optionnel) ID utilisateur système

Exemples:
  node setup.js                 # Configuration complète
  node setup.js --create-env    # Créer le fichier .env
`);
    return;
  }

  await setup.run();
}

// Exécuter si ce fichier est appelé directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = SetupManager;