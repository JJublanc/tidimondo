/**
 * Service de gestion des recettes
 * Gère la vérification d'existence et la création de recettes complètes
 */

const Validator = require('../core/validator.js');

class RecipeService {
  constructor(supabaseClient, systemUserId, auditLogger) {
    this.supabase = supabaseClient;
    this.systemUserId = systemUserId;
    this.auditLogger = auditLogger;
    this.validator = new Validator();
  }

  /**
   * Vérifie si une recette existe par nom normalisé
   */
  async findByNormalizedName(nom) {
    try {
      const nomNormalise = this.validator.normalizeString(nom);
      
      const { data, error } = await this.supabase
        .from('recettes')
        .select('id, nom, description, user_id, is_public, created_at')
        .eq('nom_normalise', nomNormalise)
        .eq('is_public', true) // Seulement les recettes publiques pour éviter les conflits
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      return data;
    } catch (error) {
      // Si c'est juste "pas trouvé", retourner null au lieu de lever une exception
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error(`Erreur lors de la recherche de la recette "${nom}":`, error);
      return null; // Retourner null plutôt que de lever l'exception pour éviter de casser la pré-vérification
    }
  }

  /**
   * Recherche une recette similaire basée sur la description et les contraintes
   */
  async findSimilarRecipe(description, contraintes = {}) {
    try {
      // Extraire les mots-clés de la description
      const keywords = this._extractKeywords(description);
      const seasonFilter = contraintes.saison ? contraintes.saison[0] : null;
      
      console.log(`🔍 Recherche de recette similaire avec mots-clés: [${keywords.join(', ')}]`);
      
      // Recherche par mots-clés dans le nom ou la description
      let query = this.supabase
        .from('recettes')
        .select('id, nom, description, user_id, is_public, created_at')
        .eq('is_public', true);
      
      // Construire une recherche avec OR sur les mots-clés
      if (keywords.length > 0) {
        const searchTerms = keywords
          .map(keyword => `nom.ilike.%${keyword}%,description.ilike.%${keyword}%`)
          .join(',');
        query = query.or(searchTerms);
      }
      
      const { data, error } = await query.limit(5);
      
      if (error) {
        console.log('⚠️ Erreur lors de la recherche de recette similaire:', error.message);
        return null;
      }
      
      if (data && data.length > 0) {
        // Retourner la première recette trouvée
        const found = data[0];
        console.log(`✅ Recette similaire trouvée: "${found.nom}"`);
        return found;
      }
      
      console.log('ℹ️ Aucune recette similaire trouvée');
      return null;
    } catch (error) {
      console.log('⚠️ Erreur lors de la recherche de recette similaire:', error.message);
      return null;
    }
  }

  /**
   * Extrait les mots-clés importants d'une description
   */
  _extractKeywords(description) {
    if (!description || typeof description !== 'string') return [];
    
    // Mots à ignorer
    const stopWords = new Set([
      'de', 'des', 'du', 'le', 'la', 'les', 'un', 'une', 'avec', 'aux', 'et',
      'à', 'en', 'dans', 'sur', 'pour', 'par', 'ou', 'que', 'qui', 'dont',
      'frais', 'fraîche', 'fraîches'
    ]);
    
    // Extraire les mots significatifs (3 caractères minimum)
    const words = description
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remplacer la ponctuation par des espaces
      .split(/\s+/)
      .filter(word => word.length >= 3 && !stopWords.has(word))
      .slice(0, 4); // Prendre les 4 premiers mots-clés
    
    return words;
  }

  /**
   * Crée une recette complète avec ingrédients et ustensiles
   */
  async createComplete(recetteData, ingredientsMap, ustensilesMap) {
    try {
      // Valider la recette complète
      const validation = this.validator.validateCompleteRecipe({
        recette: recetteData.recette,
        ingredients: recetteData.ingredients,
        ustensiles: recetteData.ustensiles
      });

      if (!validation.isValid) {
        const errorMessage = `Données de recette invalides: ${validation.errors.join(', ')}`;
        await this.auditLogger.logRecetteOperation('error', recetteData.recette, null, errorMessage);
        throw new Error(errorMessage);
      }

      // Vérifier si la recette existe déjà
      const existing = await this.findByNormalizedName(recetteData.recette.nom);
      if (existing) {
        await this.auditLogger.logRecetteOperation('skipped', recetteData.recette, existing.id, 'Recette déjà existante');
        return {
          success: true,
          data: existing,
          created: false,
          message: `Recette "${existing.nom}" déjà existante`
        };
      }

      // Commencer la transaction
      const result = await this._createRecipeTransaction(recetteData, ingredientsMap, ustensilesMap);
      
      // Logger la création
      await this.auditLogger.logRecetteOperation('created', recetteData.recette, result.recette.id);

      console.log(`✅ Recette créée: ${result.recette.nom} (${result.recette.id})`);

      return {
        success: true,
        data: result,
        created: true,
        message: `Recette "${result.recette.nom}" créée avec succès`
      };

    } catch (error) {
      console.error(`❌ Erreur lors de la création de la recette "${recetteData.recette.nom}":`, error);
      await this.auditLogger.logRecetteOperation('error', recetteData.recette, null, error.message);
      throw error;
    }
  }

  /**
   * Transaction pour créer une recette complète
   */
  async _createRecipeTransaction(recetteData, ingredientsMap, ustensilesMap) {
    // 1. Créer la recette principale
    const recetteInsertData = {
      ...recetteData.recette,
      user_id: this.systemUserId,
      nom_normalise: this.validator.normalizeString(recetteData.recette.nom),
      is_public: true, // Les recettes créées par le système sont publiques
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newRecette, error: recetteError } = await this.supabase
      .from('recettes')
      .insert(recetteInsertData)
      .select()
      .single();

    if (recetteError) {
      throw new Error(`Erreur création recette: ${recetteError.message}`);
    }

    try {
      // 2. Insérer les ingrédients
      const ingredientInserts = [];
      if (recetteData.ingredients && recetteData.ingredients.length > 0) {
        for (let i = 0; i < recetteData.ingredients.length; i++) {
          const ingredient = recetteData.ingredients[i];
          const existingIngredient = ingredientsMap.get(ingredient.nom);
          
          if (!existingIngredient) {
            throw new Error(`Ingrédient non trouvé: ${ingredient.nom}`);
          }

          ingredientInserts.push({
            recette_id: newRecette.id,
            ingredient_id: existingIngredient.id,
            quantite: ingredient.quantite,
            unite: ingredient.unite,
            optionnel: ingredient.optionnel || false,
            notes: ingredient.notes || null,
            ordre_affichage: i + 1,
            created_at: new Date().toISOString()
          });
        }

        const { error: ingredientsError } = await this.supabase
          .from('recette_ingredients')
          .insert(ingredientInserts);

        if (ingredientsError) {
          // Rollback: supprimer la recette
          await this._rollbackRecette(newRecette.id);
          throw new Error(`Erreur insertion ingrédients: ${ingredientsError.message}`);
        }
      }

      // 3. Insérer les ustensiles
      const ustensileInserts = [];
      if (recetteData.ustensiles && recetteData.ustensiles.length > 0) {
        for (const ustensile of recetteData.ustensiles) {
          const existingUstensile = ustensilesMap.get(ustensile.nom);
          
          if (!existingUstensile) {
            throw new Error(`Ustensile non trouvé: ${ustensile.nom}`);
          }

          ustensileInserts.push({
            recette_id: newRecette.id,
            ustensile_id: existingUstensile.id,
            obligatoire: ustensile.obligatoire !== undefined ? ustensile.obligatoire : true,
            notes: ustensile.notes || null,
            created_at: new Date().toISOString()
          });
        }

        const { error: ustensilesError } = await this.supabase
          .from('recette_ustensiles')
          .insert(ustensileInserts);

        if (ustensilesError) {
          // Rollback: supprimer la recette et les ingrédients
          await this._rollbackRecette(newRecette.id);
          throw new Error(`Erreur insertion ustensiles: ${ustensilesError.message}`);
        }
      }

      // 4. Récupérer la recette complète
      const completeRecipe = await this.getCompleteById(newRecette.id);
      
      return completeRecipe;

    } catch (error) {
      // En cas d'erreur, nettoyer la recette créée
      await this._rollbackRecette(newRecette.id);
      throw error;
    }
  }

  /**
   * Rollback: supprime une recette et ses relations
   */
  async _rollbackRecette(recetteId) {
    try {
      // Supprimer les relations (CASCADE devrait le faire automatiquement)
      await this.supabase.from('recette_ingredients').delete().eq('recette_id', recetteId);
      await this.supabase.from('recette_ustensiles').delete().eq('recette_id', recetteId);
      await this.supabase.from('recettes').delete().eq('id', recetteId);
      
      console.log(`🔄 Rollback effectué pour la recette ${recetteId}`);
    } catch (rollbackError) {
      console.error(`Erreur lors du rollback de la recette ${recetteId}:`, rollbackError);
    }
  }

  /**
   * Récupère une recette complète par ID
   */
  async getCompleteById(id) {
    try {
      const { data: recette, error } = await this.supabase
        .from('recettes')
        .select(`
          *,
          recette_ingredients (
            id,
            quantite,
            unite,
            optionnel,
            notes,
            ordre_affichage,
            ingredient:ingredients (
              id,
              nom,
              categorie,
              unite_base,
              prix_moyen_euro,
              allergenes,
              saison
            )
          ),
          recette_ustensiles (
            id,
            obligatoire,
            notes,
            ustensile:ustensiles (
              id,
              nom,
              categorie,
              description
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      // Transformer les données pour correspondre au format attendu
      const transformed = {
        recette: {
          ...recette,
          recette_ingredients: undefined,
          recette_ustensiles: undefined
        },
        ingredients: (recette.recette_ingredients || [])
          .sort((a, b) => a.ordre_affichage - b.ordre_affichage)
          .map(ri => ({
            id: ri.id,
            quantite: ri.quantite,
            unite: ri.unite,
            optionnel: ri.optionnel,
            notes: ri.notes,
            ingredient: ri.ingredient
          })),
        ustensiles: (recette.recette_ustensiles || []).map(ru => ({
          id: ru.id,
          obligatoire: ru.obligatoire,
          notes: ru.notes,
          ustensile: ru.ustensile
        }))
      };

      return transformed;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la recette complète ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crée plusieurs recettes en batch
   */
  async createBatch(recettesData, ingredientsMap, ustensilesMap) {
    const results = [];
    const createdRecettes = [];
    const skippedRecettes = [];
    const errorRecettes = [];

    console.log(`🔄 Traitement de ${recettesData.length} recettes...`);

    for (const recetteData of recettesData) {
      try {
        const result = await this.createComplete(recetteData, ingredientsMap, ustensilesMap);
        results.push(result);

        if (result.created) {
          createdRecettes.push(result.data);
        } else {
          skippedRecettes.push(result.data);
        }
      } catch (error) {
        errorRecettes.push({
          recette: recetteData.recette,
          error: error.message
        });
        results.push({
          success: false,
          data: null,
          created: false,
          message: error.message
        });
      }
    }

    const summary = {
      total: recettesData.length,
      created: createdRecettes.length,
      skipped: skippedRecettes.length,
      errors: errorRecettes.length
    };

    console.log(`📊 Recettes - Créées: ${summary.created}, Ignorées: ${summary.skipped}, Erreurs: ${summary.errors}`);

    return {
      success: errorRecettes.length === 0,
      summary,
      results,
      createdRecettes,
      skippedRecettes,
      errorRecettes
    };
  }

  /**
   * Recherche des recettes par nom
   */
  async searchByName(searchTerm, limit = 10) {
    try {
      const normalizedSearch = this.validator.normalizeString(searchTerm);
      
      const { data, error } = await this.supabase
        .from('recettes')
        .select('id, nom, description, difficulte, temps_preparation, temps_cuisson, portions')
        .eq('is_public', true)
        .or(`nom.ilike.%${searchTerm}%,nom_normalise.ilike.%${normalizedSearch}%`)
        .order('nom')
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error(`Erreur lors de la recherche de recettes "${searchTerm}":`, error);
      return [];
    }
  }

  /**
   * Calcule le coût estimé d'une recette
   */
  calculateEstimatedCost(recetteIngredients, ingredientsMap) {
    let totalCost = 0;
    let hasAllPrices = true;

    for (const recetteIngredient of recetteIngredients) {
      const ingredient = ingredientsMap.get(recetteIngredient.nom);
      if (ingredient && ingredient.prix_moyen_euro) {
        // Convertir la quantité en unité de base pour le calcul
        const baseQuantity = this._convertToBaseUnit(
          recetteIngredient.quantite,
          recetteIngredient.unite,
          ingredient.unite_base
        );
        totalCost += baseQuantity * ingredient.prix_moyen_euro;
      } else {
        hasAllPrices = false;
      }
    }

    return {
      estimatedCost: totalCost,
      hasAllPrices,
      costPerPortion: totalCost / (recetteIngredients[0]?.portions || 4)
    };
  }

  /**
   * Convertit une quantité vers l'unité de base
   */
  _convertToBaseUnit(quantite, unite, uniteBase) {
    // Facteurs de conversion simples
    const conversions = {
      'g': { 'kg': 0.001, 'g': 1 },
      'kg': { 'kg': 1, 'g': 1000 },
      'ml': { 'l': 0.001, 'ml': 1 },
      'l': { 'l': 1, 'ml': 1000 },
      'piece': { 'piece': 1 },
      'cuillere_soupe': { 'g': 15, 'ml': 15 },
      'cuillere_cafe': { 'g': 5, 'ml': 5 },
      'pincee': { 'g': 1 },
      'verre': { 'ml': 200 }
    };

    const conversion = conversions[unite]?.[uniteBase];
    return conversion ? quantite * conversion : quantite;
  }

  /**
   * Statistiques sur les recettes
   */
  async getStats() {
    try {
      const { data, error } = await this.supabase
        .from('recettes')
        .select('difficulte, regime_alimentaire, type_repas, is_public, user_id, saison')
        .eq('is_public', true);

      if (error) {
        throw error;
      }

      const stats = {
        total: data.length,
        parDifficulte: {},
        parRegime: {},
        parTypeRepas: {},
        parSaison: {},
        systeme: 0
      };

      data.forEach(recette => {
        // Comptage par difficulté
        if (recette.difficulte) {
          stats.parDifficulte[recette.difficulte] = (stats.parDifficulte[recette.difficulte] || 0) + 1;
        }

        // Comptage par régime alimentaire
        if (recette.regime_alimentaire && Array.isArray(recette.regime_alimentaire)) {
          recette.regime_alimentaire.forEach(regime => {
            stats.parRegime[regime] = (stats.parRegime[regime] || 0) + 1;
          });
        }

        // Comptage par type de repas
        if (recette.type_repas && Array.isArray(recette.type_repas)) {
          recette.type_repas.forEach(type => {
            stats.parTypeRepas[type] = (stats.parTypeRepas[type] || 0) + 1;
          });
        }

        // Comptage par saison
        if (recette.saison && Array.isArray(recette.saison)) {
          recette.saison.forEach(saison => {
            stats.parSaison[saison] = (stats.parSaison[saison] || 0) + 1;
          });
        }

        // Comptage des recettes système
        if (recette.user_id === this.systemUserId) {
          stats.systeme++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques recettes:', error);
      return null;
    }
  }

  /**
   * Valide la cohérence d'une recette avec ses ingrédients
   */
  validateRecipeConsistency(recetteData, ingredientsMap) {
    const issues = [];
    const warnings = [];

    // Vérifier que tous les ingrédients existent
    if (recetteData.ingredients) {
      recetteData.ingredients.forEach((ingredient, index) => {
        if (!ingredientsMap.has(ingredient.nom)) {
          issues.push(`Ingrédient ${index + 1} "${ingredient.nom}" non trouvé`);
        }
      });
    }

    // Vérifier la cohérence des saisons
    if (recetteData.recette.saison && recetteData.ingredients) {
      const recipeSaisons = recetteData.recette.saison;
      
      recetteData.ingredients.forEach((ingredient, index) => {
        const existingIngredient = ingredientsMap.get(ingredient.nom);
        if (existingIngredient && existingIngredient.saison && existingIngredient.saison.length > 0) {
          const hasCommonSeason = existingIngredient.saison.some(s => recipeSaisons.includes(s));
          if (!hasCommonSeason) {
            warnings.push(`Ingrédient ${index + 1} "${ingredient.nom}" n'est pas de saison`);
          }
        }
      });
    }

    return {
      isConsistent: issues.length === 0,
      issues,
      warnings
    };
  }
}

module.exports = RecipeService;