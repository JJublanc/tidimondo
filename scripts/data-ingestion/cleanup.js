#!/usr/bin/env node

/**
 * Script de nettoyage des données d'ingestion TidiMondo
 * Supprime toutes les données créées par le système d'ingestion
 */

// Charger les variables d'environnement
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

class CleanupManager {
  constructor() {
    this.systemUserId = null;
  }

  async run() {
    try {
      console.log('🧹 Nettoyage des données d\'ingestion TidiMondo');
      console.log('==================================================');

      // Récupérer l'ID de l'utilisateur système
      await this._getSystemUserId();

      if (!this.systemUserId) {
        console.log('ℹ️ Aucun utilisateur système trouvé, rien à nettoyer');
        return;
      }

      console.log(`🎯 Nettoyage des données de l'utilisateur système: ${this.systemUserId}`);

      // Supprimer dans l'ordre (contraintes de clés étrangères)
      await this._cleanupRecipeRelations();
      await this._cleanupRecipes();
      await this._cleanupIngredients();
      await this._cleanupUstensiles();
      await this._cleanupAuditLogs();

      console.log('\n✅ Nettoyage terminé avec succès !');
      console.log('🚀 Vous pouvez maintenant relancer la pipeline sur une base propre.');

    } catch (error) {
      console.error('\n❌ Erreur lors du nettoyage:', error.message);
      process.exit(1);
    }
  }

  async _getSystemUserId() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', 'system_content_ingestion')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      this.systemUserId = data?.id;
      
      if (this.systemUserId) {
        console.log(`👤 Utilisateur système trouvé: ${this.systemUserId}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de l\'utilisateur système:', error);
      throw error;
    }
  }

  async _cleanupRecipeRelations() {
    console.log('\n🔗 Suppression des relations de recettes...');

    try {
      // D'abord récupérer les IDs des recettes du système
      const { data: recettes, error: recettesError } = await supabase
        .from('recettes')
        .select('id')
        .eq('user_id', this.systemUserId);

      if (recettesError) {
        throw recettesError;
      }

      if (!recettes || recettes.length === 0) {
        console.log('ℹ️ Aucune recette système à nettoyer');
        return;
      }

      const recetteIds = recettes.map(r => r.id);
      console.log(`🔍 ${recetteIds.length} recettes système trouvées`);

      // Supprimer les relations recette_ingredients
      const { error: ingredientsError } = await supabase
        .from('recette_ingredients')
        .delete()
        .in('recette_id', recetteIds);

      if (ingredientsError) {
        console.warn('⚠️ Erreur suppression recette_ingredients:', ingredientsError.message);
      } else {
        console.log('✅ Relations recette_ingredients supprimées');
      }

      // Supprimer les relations recette_ustensiles
      const { error: ustensilesError } = await supabase
        .from('recette_ustensiles')
        .delete()
        .in('recette_id', recetteIds);

      if (ustensilesError) {
        console.warn('⚠️ Erreur suppression recette_ustensiles:', ustensilesError.message);
      } else {
        console.log('✅ Relations recette_ustensiles supprimées');
      }

    } catch (error) {
      console.error('❌ Erreur lors de la suppression des relations:', error);
      throw error;
    }
  }

  async _cleanupRecipes() {
    console.log('\n📝 Suppression des recettes système...');

    try {
      const { data, error } = await supabase
        .from('recettes')
        .delete()
        .eq('user_id', this.systemUserId)
        .select('id, nom');

      if (error) {
        throw error;
      }

      console.log(`✅ ${data?.length || 0} recettes supprimées`);
      if (data && data.length > 0) {
        data.forEach(recipe => {
          console.log(`   - ${recipe.nom} (${recipe.id})`);
        });
      }

    } catch (error) {
      console.error('❌ Erreur lors de la suppression des recettes:', error);
      throw error;
    }
  }

  async _cleanupIngredients() {
    console.log('\n🥬 Suppression des ingrédients système...');

    try {
      const { data, error } = await supabase
        .from('ingredients')
        .delete()
        .eq('user_id', this.systemUserId)
        .select('id, nom');

      if (error) {
        throw error;
      }

      console.log(`✅ ${data?.length || 0} ingrédients supprimés`);
      if (data && data.length > 0) {
        data.forEach(ingredient => {
          console.log(`   - ${ingredient.nom} (${ingredient.id})`);
        });
      }

    } catch (error) {
      console.error('❌ Erreur lors de la suppression des ingrédients:', error);
      throw error;
    }
  }

  async _cleanupUstensiles() {
    console.log('\n🔪 Suppression des ustensiles système...');

    try {
      const { data, error } = await supabase
        .from('ustensiles')
        .delete()
        .eq('user_id', this.systemUserId)
        .select('id, nom');

      if (error) {
        throw error;
      }

      console.log(`✅ ${data?.length || 0} ustensiles supprimés`);
      if (data && data.length > 0) {
        data.forEach(ustensile => {
          console.log(`   - ${ustensile.nom} (${ustensile.id})`);
        });
      }

    } catch (error) {
      console.error('❌ Erreur lors de la suppression des ustensiles:', error);
      throw error;
    }
  }

  async _cleanupAuditLogs() {
    console.log('\n📊 Suppression des logs d\'audit...');

    try {
      const { data, error } = await supabase
        .from('ingestion_audit_log')
        .delete()
        .eq('system_user_id', this.systemUserId)
        .select('id, batch_name');

      if (error) {
        throw error;
      }

      console.log(`✅ ${data?.length || 0} logs d'audit supprimés`);

    } catch (error) {
      console.error('❌ Erreur lors de la suppression des logs:', error);
      throw error;
    }
  }

  async showStats() {
    try {
      console.log('\n📊 Statistiques avant nettoyage:');
      console.log('================================');

      if (!this.systemUserId) {
        await this._getSystemUserId();
      }

      if (!this.systemUserId) {
        console.log('ℹ️ Aucun utilisateur système trouvé');
        return;
      }

      const [recettes, ingredients, ustensiles, logs] = await Promise.all([
        supabase.from('recettes').select('id', { count: 'exact' }).eq('user_id', this.systemUserId),
        supabase.from('ingredients').select('id', { count: 'exact' }).eq('user_id', this.systemUserId),
        supabase.from('ustensiles').select('id', { count: 'exact' }).eq('user_id', this.systemUserId),
        supabase.from('ingestion_audit_log').select('id', { count: 'exact' }).eq('system_user_id', this.systemUserId)
      ]);

      console.log(`📝 Recettes système: ${recettes.count || 0}`);
      console.log(`🥬 Ingrédients système: ${ingredients.count || 0}`);
      console.log(`🔪 Ustensiles système: ${ustensiles.count || 0}`);
      console.log(`📊 Logs d'audit: ${logs.count || 0}`);

    } catch (error) {
      console.error('❌ Erreur lors du calcul des statistiques:', error);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const cleanup = new CleanupManager();

  if (args.includes('--stats')) {
    await cleanup.showStats();
    return;
  }

  if (args.includes('--help')) {
    console.log(`
Script de nettoyage de la pipeline d'ingestion TidiMondo

Usage: node cleanup.js [options]

Options:
  --stats     Afficher les statistiques sans nettoyer
  --help      Afficher cette aide

Exemples:
  node cleanup.js          # Nettoyer toutes les données système
  node cleanup.js --stats  # Voir ce qui serait supprimé
`);
    return;
  }

  await cleanup.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CleanupManager;