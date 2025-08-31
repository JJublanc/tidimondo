#!/usr/bin/env node

/**
 * Pipeline principale d'ingestion de contenu TidiMondo
 * Génère et insère automatiquement des recettes avec ingrédients et ustensiles
 */

// Charger les variables d'environnement depuis .env
require('dotenv').config();

const fs = require('fs').promises;
const path = require('path');

// Core modules
const AuthManager = require('./core/auth-manager.js');
const AuditLogger = require('./core/audit-logger.js');
const LLMClient = require('./core/llm-client.js');
const Validator = require('./core/validator.js');

// Database services
const IngredientService = require('./database/ingredient-service.js');
const UstensileService = require('./database/ustensile-service.js');
const RecipeService = require('./database/recipe-service.js');

class IngestionPipeline {
  constructor() {
    this.authManager = new AuthManager();
    this.auditLogger = null;
    this.llmClient = new LLMClient();
    this.validator = new Validator();
    
    this.ingredientService = null;
    this.ustensileService = null;
    this.recipeService = null;
    
    this.isInitialized = false;
  }

  /**
   * Initialise la pipeline
   */
  async initialize() {
    try {
      console.log('🚀 Initialisation de la pipeline d\'ingestion TidiMondo...');
      
      // Initialiser l'authentification
      const authResult = await this.authManager.initialize();
      if (!authResult.success) {
        throw new Error('Impossible d\'initialiser l\'authentification');
      }

      const supabaseClient = this.authManager.getSupabaseClient();
      const systemUserId = this.authManager.getSystemUserId();

      // Initialiser l'audit logger
      this.auditLogger = new AuditLogger(supabaseClient, systemUserId);

      // Initialiser les services
      this.ingredientService = new IngredientService(supabaseClient, systemUserId, this.auditLogger);
      this.ustensileService = new UstensileService(supabaseClient, systemUserId, this.auditLogger);
      this.recipeService = new RecipeService(supabaseClient, systemUserId, this.auditLogger);

      this.isInitialized = true;
      console.log('✅ Pipeline initialisée avec succès');

      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de la pipeline:', error);
      throw error;
    }
  }

  /**
   * Traite un fichier d'input et génère le contenu
   */
  async processInputFile(inputFilePath, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Pipeline non initialisée. Appelez initialize() d\'abord.');
    }

    try {
      console.log(`📄 Traitement du fichier: ${inputFilePath}`);

      // 1. Lire et valider le fichier d'input
      const inputData = await this._loadAndValidateInput(inputFilePath);
      
      // 2. Démarrer le batch d'audit
      const batchName = inputData.metadata?.batch_name || `batch_${Date.now()}`;
      await this.auditLogger.startBatch(batchName, {
        inputFile: inputFilePath,
        recettesCount: inputData.recettes.length,
        options
      });

      let processedRecipes = [];
      let totalCreated = 0;
      let totalSkipped = 0;
      let totalErrors = 0;

      try {
        // 3. Traiter chaque recette
        for (let i = 0; i < inputData.recettes.length; i++) {
          const recetteInput = inputData.recettes[i];
          console.log(`\n🍽️ Traitement de la recette ${i + 1}/${inputData.recettes.length}: "${recetteInput.description}"`);

          try {
            const result = await this._processRecette(recetteInput, options);
            processedRecipes.push(result);

            if (result.created) {
              totalCreated++;
            } else {
              totalSkipped++;
            }
          } catch (error) {
            console.error(`❌ Erreur lors du traitement de la recette ${i + 1}:`, error);
            totalErrors++;
            
            processedRecipes.push({
              success: false,
              error: error.message,
              input: recetteInput
            });
          }
        }

        // 4. Finaliser le batch
        await this.auditLogger.endBatch(true);

        // 5. Générer le rapport final
        const report = this._generateReport(processedRecipes, totalCreated, totalSkipped, totalErrors);
        
        console.log('\n📊 RAPPORT FINAL');
        console.log('================');
        console.log(`✅ Créées: ${totalCreated}`);
        console.log(`⏭️ Ignorées: ${totalSkipped}`);
        console.log(`❌ Erreurs: ${totalErrors}`);
        console.log(`📝 Total: ${inputData.recettes.length}`);

        return {
          success: totalErrors === 0,
          batchName,
          summary: {
            total: inputData.recettes.length,
            created: totalCreated,
            skipped: totalSkipped,
            errors: totalErrors
          },
          processedRecipes,
          report
        };

      } catch (error) {
        await this.auditLogger.endBatch(false, error.message);
        throw error;
      }

    } catch (error) {
      console.error('❌ Erreur lors du traitement du fichier:', error);
      throw error;
    }
  }

  /**
   * Traite une recette individuelle
   */
  async _processRecette(recetteInput, options = {}) {
    try {
      // 1. Pré-génération : obtenir seulement le nom de la recette
      console.log('🔍 Pré-vérification basée sur la description...');
      
      // D'abord vérifier par description/contraintes avant génération de nom
      const existingByDescription = await this.recipeService.findSimilarRecipe(
        recetteInput.description,
        recetteInput.contraintes || {}
      );
      
      if (existingByDescription) {
        console.log(`⏭️ Recette similaire trouvée: "${existingByDescription.nom}", ignorée`);
        await this.auditLogger.logRecetteOperation('skipped', { description: recetteInput.description }, existingByDescription.id, 'Recette similaire détectée avant génération LLM');
        return {
          success: true,
          created: false,
          data: existingByDescription,
          message: `Recette "${existingByDescription.nom}" similaire trouvée (évité génération LLM)`,
          skippedBeforeGeneration: true
        };
      }

      console.log('🔍 Génération du nom de recette...');
      const recipeName = await this.llmClient.generateRecipeName(
        recetteInput.description,
        recetteInput.contraintes || {}
      );
      
      console.log(`📝 Nom généré: "${recipeName}"`);

      // 2. Vérifier si une recette avec ce nom exact existe déjà
      const existingRecipe = await this.recipeService.findByNormalizedName(recipeName);
      if (existingRecipe) {
        console.log(`⏭️ Recette "${existingRecipe.nom}" déjà existante, ignorée`);
        await this.auditLogger.logRecetteOperation('skipped', { nom: recipeName }, existingRecipe.id, 'Recette existante détectée après génération nom');
        return {
          success: true,
          created: false,
          data: existingRecipe,
          message: `Recette "${existingRecipe.nom}" déjà existante`,
          skippedBeforeGeneration: true
        };
      }

      // 3. Générer la recette complète avec le LLM (seulement si nouvelle)
      console.log(`🤖 Génération du contenu complet avec LLM pour "${recipeName}"...`);
      const generatedData = await this.llmClient.generateRecipe(
        recetteInput.description,
        recetteInput.contraintes || {}
      );

      // 4. Valider les données générées
      console.log('✅ Validation des données générées...');
      const validation = this.validator.validateCompleteRecipe(generatedData);
      if (!validation.isValid) {
        throw new Error(`Données invalides: ${validation.errors.join(', ')}`);
      }

      if (validation.warnings.length > 0) {
        console.warn('⚠️ Avertissements:', validation.warnings.join(', '));
      }

      // 5. Vérifier et créer les ingrédients manquants
      console.log('🥬 Traitement des ingrédients...');
      const ingredientsMap = await this.ingredientService.ensureIngredientsExist(
        generatedData.ingredients
      );

      // 6. Vérifier et créer les ustensiles manquants
      console.log('🔪 Traitement des ustensiles...');
      const ustensilesMap = await this.ustensileService.ensureUstensilesExist(
        generatedData.ustensiles
      );

      // 7. Vérifier la cohérence finale
      const consistencyCheck = this.recipeService.validateRecipeConsistency(
        generatedData,
        ingredientsMap
      );
      
      if (!consistencyCheck.isConsistent) {
        throw new Error(`Incohérences détectées: ${consistencyCheck.issues.join(', ')}`);
      }

      // 8. Créer la recette complète
      console.log('📝 Création de la recette complète...');
      const result = await this.recipeService.createComplete(
        generatedData,
        ingredientsMap,
        ustensilesMap
      );

      return {
        success: true,
        created: result.created,
        data: result.data,
        message: result.message,
        generatedData,
        warnings: consistencyCheck.warnings
      };

    } catch (error) {
      console.error('❌ Erreur lors du traitement de la recette:', error);
      throw error;
    }
  }

  /**
   * Charge et valide le fichier d'input
   */
  async _loadAndValidateInput(inputFilePath) {
    try {
      // Vérifier que le fichier existe
      const fileContent = await fs.readFile(inputFilePath, 'utf-8');
      const inputData = JSON.parse(fileContent);

      // Valider la structure
      const validation = this.validator.validateInputBatch(inputData);
      if (!validation.isValid) {
        throw new Error(`Fichier d'input invalide: ${validation.errors.join(', ')}`);
      }

      if (validation.warnings.length > 0) {
        console.warn('⚠️ Avertissements d\'input:', validation.warnings.join(', '));
      }

      return inputData;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Fichier non trouvé: ${inputFilePath}`);
      }
      if (error instanceof SyntaxError) {
        throw new Error(`JSON invalide dans le fichier: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Génère un rapport détaillé
   */
  _generateReport(processedRecipes, totalCreated, totalSkipped, totalErrors) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: processedRecipes.length,
        created: totalCreated,
        skipped: totalSkipped,
        errors: totalErrors,
        successRate: ((totalCreated + totalSkipped) / processedRecipes.length * 100).toFixed(2) + '%'
      },
      details: {
        created: processedRecipes.filter(r => r.created).map(r => ({
          nom: r.data?.recette?.nom || r.data?.nom,
          id: r.data?.recette?.id || r.data?.id
        })),
        skipped: processedRecipes.filter(r => r.success && !r.created).map(r => ({
          nom: r.data?.recette?.nom || r.data?.nom,
          reason: r.message
        })),
        errors: processedRecipes.filter(r => !r.success).map(r => ({
          input: r.input?.description,
          error: r.error
        }))
      }
    };

    return report;
  }

  /**
   * Sauvegarde un rapport dans un fichier
   */
  async saveReport(report, outputPath) {
    try {
      await fs.writeFile(outputPath, JSON.stringify(report, null, 2), 'utf-8');
      console.log(`📄 Rapport sauvegardé: ${outputPath}`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du rapport:', error);
    }
  }

  /**
   * Nettoie les ressources
   */
  async cleanup() {
    try {
      if (this.authManager) {
        await this.authManager.cleanup();
      }
      console.log('🧹 Nettoyage terminé');
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
    }
  }

  /**
   * Affiche les statistiques actuelles
   */
  async showStats() {
    if (!this.isInitialized) {
      console.log('Pipeline non initialisée');
      return;
    }

    try {
      console.log('\n📈 STATISTIQUES ACTUELLES');
      console.log('==========================');

      const [ingredientStats, ustensileStats, recipeStats] = await Promise.all([
        this.ingredientService.getStats(),
        this.ustensileService.getStats(),
        this.recipeService.getStats()
      ]);

      if (ingredientStats) {
        console.log(`🥬 Ingrédients: ${ingredientStats.total} (système: ${ingredientStats.systeme})`);
        console.log('   Par catégorie:', ingredientStats.parCategorie);
      }

      if (ustensileStats) {
        console.log(`🔪 Ustensiles: ${ustensileStats.total} (système: ${ustensileStats.systeme})`);
        console.log('   Par catégorie:', ustensileStats.parCategorie);
      }

      if (recipeStats) {
        console.log(`📝 Recettes: ${recipeStats.total} (système: ${recipeStats.systeme})`);
        console.log('   Par difficulté:', recipeStats.parDifficulte);
      }

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des statistiques:', error);
    }
  }
}

// Fonction principale pour l'exécution en ligne de commande
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage: node pipeline.js <input-file.json> [options]

Options:
  --dry-run          Simulation sans insertion en base
  --stats            Afficher les statistiques actuelles
  --output <file>    Fichier de sortie pour le rapport
  --help             Afficher cette aide

Exemples:
  node pipeline.js recettes-ete.json
  node pipeline.js recettes-ete.json --output rapport.json
  node pipeline.js --stats
`);
    process.exit(1);
  }

  const pipeline = new IngestionPipeline();
  
  try {
    await pipeline.initialize();

    // Gestion des commandes
    if (args.includes('--stats')) {
      await pipeline.showStats();
      return;
    }

    if (args.includes('--help')) {
      console.log('Aide affichée ci-dessus');
      return;
    }

    const inputFile = args[0];
    const isDryRun = args.includes('--dry-run');
    const outputIndex = args.indexOf('--output');
    const outputFile = outputIndex !== -1 && args[outputIndex + 1] ? args[outputIndex + 1] : null;

    if (!inputFile) {
      throw new Error('Fichier d\'input requis');
    }

    // Traiter le fichier
    const result = await pipeline.processInputFile(inputFile, { dryRun: isDryRun });

    // Sauvegarder le rapport si demandé
    if (outputFile) {
      await pipeline.saveReport(result.report, outputFile);
    }

    console.log('\n🎉 Pipeline terminée avec succès !');
    
    if (!result.success) {
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 Erreur fatale:', error.message);
    process.exit(1);
  } finally {
    await pipeline.cleanup();
  }
}

// Exécuter si ce fichier est appelé directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = IngestionPipeline;