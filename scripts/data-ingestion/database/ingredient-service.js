/**
 * Service de gestion des ingrédients
 * Gère la vérification d'existence et la création d'ingrédients
 */

const Validator = require('../core/validator.js');

class IngredientService {
  constructor(supabaseClient, systemUserId, auditLogger) {
    this.supabase = supabaseClient;
    this.systemUserId = systemUserId;
    this.auditLogger = auditLogger;
    this.validator = new Validator();
  }

  /**
   * Vérifie si un ingrédient existe par nom normalisé OU nom exact
   */
  async findByNormalizedName(nom) {
    try {
      const nomNormalise = this.validator.normalizeString(nom);
      
      // D'abord chercher par nom normalisé
      let { data, error } = await this.supabase
        .from('ingredients')
        .select('id, nom, categorie, unite_base, prix_moyen_euro, allergenes, saison, is_public, user_id')
        .eq('nom_normalise', nomNormalise)
        .single();

      if (data) return data;

      // Si pas trouvé, chercher par nom exact (case insensitive)
      ({ data, error } = await this.supabase
        .from('ingredients')
        .select('id, nom, categorie, unite_base, prix_moyen_euro, allergenes, saison, is_public, user_id')
        .ilike('nom', nom)
        .single());

      if (data) return data;

      // Pas trouvé du tout
      return null;
    } catch (error) {
      // Ignorer les erreurs "no rows found"
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error(`Erreur lors de la recherche de l'ingrédient "${nom}":`, error);
      return null;
    }
  }

  /**
   * Crée un nouvel ingrédient
   */
  async create(ingredientData) {
    try {
      // Valider les données
      const validationErrors = this.validator.validateIngredient(ingredientData);
      if (validationErrors.length > 0) {
        const errorMessage = `Données d'ingrédient invalides: ${validationErrors.join(', ')}`;
        await this.auditLogger.logIngredientOperation('error', ingredientData, null, errorMessage);
        throw new Error(errorMessage);
      }

      // Vérifier si l'ingrédient existe déjà
      const existing = await this.findByNormalizedName(ingredientData.nom);
      if (existing) {
        await this.auditLogger.logIngredientOperation('skipped', ingredientData, existing.id, 'Ingrédient déjà existant');
        return {
          success: true,
          data: existing,
          created: false,
          message: `Ingrédient "${existing.nom}" déjà existant`
        };
      }

      // Préparer les données pour l'insertion
      const dataToInsert = {
        nom: ingredientData.nom.trim(),
        nom_normalise: this.validator.normalizeString(ingredientData.nom),
        categorie: ingredientData.categorie,
        unite_base: ingredientData.unite_base || this._inferBaseUnit(ingredientData.unite || 'g'),
        prix_moyen_euro: ingredientData.prix_moyen_euro || null,
        allergenes: ingredientData.allergenes || [],
        saison: ingredientData.saison || [],
        user_id: this.systemUserId,
        is_public: true, // Les ingrédients créés par le système sont publics
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insérer en base
      const { data: newIngredient, error } = await this.supabase
        .from('ingredients')
        .insert(dataToInsert)
        .select()
        .single();

      if (error) {
        // Si c'est une erreur de doublon, récupérer l'ingrédient existant
        if (error.code === '23505' && error.message.includes('ingredients_nom_key')) {
          console.log(`ℹ️ Ingrédient "${ingredientData.nom}" existe déjà, récupération...`);
          try {
            const existing = await this.findByNormalizedName(ingredientData.nom);
            if (existing) {
              await this.auditLogger.logIngredientOperation('skipped', ingredientData, existing.id, 'Ingrédient existant récupéré après tentative de création');
              console.log(`✅ Ingrédient récupéré: ${existing.nom} (${existing.id})`);
              return {
                success: true,
                data: existing,
                created: false,
                message: `Ingrédient "${existing.nom}" récupéré après détection de doublon`
              };
            }
          } catch (findError) {
            console.error(`❌ Impossible de récupérer l'ingrédient "${ingredientData.nom}":`, findError.message);
          }
        }
        
        await this.auditLogger.logIngredientOperation('error', ingredientData, null, error.message);
        throw error;
      }

      // Logger la création
      await this.auditLogger.logIngredientOperation('created', ingredientData, newIngredient.id);

      console.log(`✅ Ingrédient créé: ${newIngredient.nom} (${newIngredient.id})`);

      return {
        success: true,
        data: newIngredient,
        created: true,
        message: `Ingrédient "${newIngredient.nom}" créé avec succès`
      };

    } catch (error) {
      console.error(`❌ Erreur lors de la création de l'ingrédient "${ingredientData.nom}":`, error);
      await this.auditLogger.logIngredientOperation('error', ingredientData, null, error.message);
      throw error;
    }
  }

  /**
   * Crée plusieurs ingrédients en batch
   */
  async createBatch(ingredientsData) {
    const results = [];
    const createdIngredients = [];
    const skippedIngredients = [];
    const errorIngredients = [];

    console.log(`🔄 Traitement de ${ingredientsData.length} ingrédients...`);

    for (const ingredientData of ingredientsData) {
      try {
        const result = await this.create(ingredientData);
        results.push(result);

        if (result.created) {
          createdIngredients.push(result.data);
        } else {
          skippedIngredients.push(result.data);
        }
      } catch (error) {
        // Les doublons sont maintenant gérés dans create() et ne lèvent plus d'exception
        errorIngredients.push({
          ingredient: ingredientData,
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
      total: ingredientsData.length,
      created: createdIngredients.length,
      skipped: skippedIngredients.length,
      errors: errorIngredients.length
    };

    console.log(`📊 Ingrédients - Créés: ${summary.created}, Ignorés: ${summary.skipped}, Erreurs: ${summary.errors}`);

    return {
      success: errorIngredients.length === 0,
      summary,
      results,
      createdIngredients,
      skippedIngredients,
      errorIngredients
    };
  }

  /**
   * Récupère un ingrédient par ID
   */
  async getById(id) {
    try {
      const { data, error } = await this.supabase
        .from('ingredients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'ingrédient ${id}:`, error);
      throw error;
    }
  }

  /**
   * Recherche des ingrédients par nom (recherche floue)
   */
  async searchByName(searchTerm, limit = 10) {
    try {
      const normalizedSearch = this.validator.normalizeString(searchTerm);
      
      const { data, error } = await this.supabase
        .from('ingredients')
        .select('id, nom, categorie, unite_base, allergenes, saison')
        .eq('is_public', true)
        .or(`nom.ilike.%${searchTerm}%,nom_normalise.ilike.%${normalizedSearch}%`)
        .order('nom')
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error(`Erreur lors de la recherche d'ingrédients "${searchTerm}":`, error);
      return [];
    }
  }

  /**
   * Infère l'unité de base à partir d'une unité donnée
   */
  _inferBaseUnit(unite) {
    const uniteMappings = {
      'g': 'g',
      'kg': 'kg',
      'ml': 'ml',
      'l': 'l',
      'piece': 'piece',
      'cuillere_soupe': 'g',
      'cuillere_cafe': 'g',
      'pincee': 'g',
      'verre': 'ml'
    };

    return uniteMappings[unite] || 'piece';
  }

  /**
   * Vérifie et crée les ingrédients manquants à partir d'une liste
   */
  async ensureIngredientsExist(ingredientsList) {
    const ingredientsMap = new Map();
    const toCreate = [];

    console.log(`🔍 Vérification de ${ingredientsList.length} ingrédients...`);

    // Vérifier l'existence de chaque ingrédient
    for (const ingredient of ingredientsList) {
      try {
        const existing = await this.findByNormalizedName(ingredient.nom);
        if (existing) {
          ingredientsMap.set(ingredient.nom, existing);
        } else {
          toCreate.push(ingredient);
        }
      } catch (error) {
        console.warn(`Erreur lors de la vérification de l'ingrédient "${ingredient.nom}":`, error);
        toCreate.push(ingredient);
      }
    }

    // Créer les ingrédients manquants
    if (toCreate.length > 0) {
      console.log(`📝 Création de ${toCreate.length} ingrédients manquants...`);
      const batchResult = await this.createBatch(toCreate);
      
      // Ajouter les nouveaux ingrédients à la map
      batchResult.createdIngredients.forEach(ingredient => {
        ingredientsMap.set(ingredient.nom, ingredient);
      });

      // Ajouter aussi les ingrédients ignorés (récupérés après doublons)
      batchResult.skippedIngredients.forEach(ingredient => {
        ingredientsMap.set(ingredient.nom, ingredient);
      });

      if (!batchResult.success) {
        console.warn(`⚠️ Certains ingrédients n'ont pas pu être créés:`, batchResult.errorIngredients);
      }
    }

    return ingredientsMap;
  }

  /**
   * Statistiques sur les ingrédients
   */
  async getStats() {
    try {
      const { data, error } = await this.supabase
        .from('ingredients')
        .select('categorie, is_public, user_id')
        .eq('is_public', true);

      if (error) {
        throw error;
      }

      const stats = {
        total: data.length,
        parCategorie: {},
        systeme: 0
      };

      data.forEach(ingredient => {
        // Comptage par catégorie
        if (ingredient.categorie) {
          stats.parCategorie[ingredient.categorie] = (stats.parCategorie[ingredient.categorie] || 0) + 1;
        }

        // Comptage des ingrédients système
        if (ingredient.user_id === this.systemUserId) {
          stats.systeme++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques ingrédients:', error);
      return null;
    }
  }
}

module.exports = IngredientService;