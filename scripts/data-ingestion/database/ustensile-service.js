/**
 * Service de gestion des ustensiles
 * Gère la vérification d'existence et la création d'ustensiles
 */

const Validator = require('../core/validator.js');

class UstensileService {
  constructor(supabaseClient, systemUserId, auditLogger) {
    this.supabase = supabaseClient;
    this.systemUserId = systemUserId;
    this.auditLogger = auditLogger;
    this.validator = new Validator();
  }

  /**
   * Vérifie si un ustensile existe par nom normalisé
   */
  async findByNormalizedName(nom) {
    try {
      const nomNormalise = this.validator.normalizeString(nom);
      
      // D'abord chercher par nom normalisé
      let { data, error } = await this.supabase
        .from('ustensiles')
        .select('id, nom, categorie, description, obligatoire, is_public, user_id')
        .eq('nom_normalise', nomNormalise)
        .single();

      if (data) return data;

      // Si pas trouvé, chercher par nom exact (case insensitive)
      ({ data, error } = await this.supabase
        .from('ustensiles')
        .select('id, nom, categorie, description, obligatoire, is_public, user_id')
        .ilike('nom', nom)
        .single());

      if (data) return data;

      // Aucun ustensile trouvé
      return null;
    } catch (error) {
      console.log(`⚠️ Erreur lors de la recherche de l'ustensile "${nom}":`, error.message);
      return null;
    }
  }

  /**
   * Crée un nouvel ustensile
   */
  async create(ustensileData) {
    try {
      // Valider les données
      const validationErrors = this.validator.validateUstensile(ustensileData);
      if (validationErrors.length > 0) {
        const errorMessage = `Données d'ustensile invalides: ${validationErrors.join(', ')}`;
        await this.auditLogger.logUstensileOperation('error', ustensileData, null, errorMessage);
        throw new Error(errorMessage);
      }

      // Vérifier si l'ustensile existe déjà
      const existing = await this.findByNormalizedName(ustensileData.nom);
      if (existing) {
        await this.auditLogger.logUstensileOperation('skipped', ustensileData, existing.id, 'Ustensile déjà existant');
        return {
          success: true,
          data: existing,
          created: false,
          message: `Ustensile "${existing.nom}" déjà existant`
        };
      }

      // Préparer les données pour l'insertion
      const dataToInsert = {
        nom: ustensileData.nom.trim(),
        nom_normalise: this.validator.normalizeString(ustensileData.nom),
        categorie: ustensileData.categorie,
        description: ustensileData.description || null,
        obligatoire: ustensileData.obligatoire || false,
        user_id: this.systemUserId,
        is_public: true, // Les ustensiles créés par le système sont publics
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insérer en base
      const { data: newUstensile, error } = await this.supabase
        .from('ustensiles')
        .insert(dataToInsert)
        .select()
        .single();

      if (error) {
        // Si c'est une erreur de doublon, récupérer l'ustensile existant
        if (error.code === '23505' && error.message.includes('ustensiles_nom_key')) {
          console.log(`ℹ️ Ustensile "${ustensileData.nom}" existe déjà, récupération...`);
          try {
            const existing = await this.findByNormalizedName(ustensileData.nom);
            if (existing) {
              await this.auditLogger.logUstensileOperation('skipped', ustensileData, existing.id, 'Ustensile existant récupéré après tentative de création');
              console.log(`✅ Ustensile récupéré: ${existing.nom} (${existing.id})`);
              return {
                success: true,
                data: existing,
                created: false,
                message: `Ustensile "${existing.nom}" récupéré après détection de doublon`
              };
            }
          } catch (findError) {
            console.error(`❌ Impossible de récupérer l'ustensile "${ustensileData.nom}":`, findError.message);
          }
        }
        
        await this.auditLogger.logUstensileOperation('error', ustensileData, null, error.message);
        throw error;
      }

      // Logger la création
      await this.auditLogger.logUstensileOperation('created', ustensileData, newUstensile.id);

      console.log(`✅ Ustensile créé: ${newUstensile.nom} (${newUstensile.id})`);

      return {
        success: true,
        data: newUstensile,
        created: true,
        message: `Ustensile "${newUstensile.nom}" créé avec succès`
      };

    } catch (error) {
      console.error(`❌ Erreur lors de la création de l'ustensile "${ustensileData.nom}":`, error);
      await this.auditLogger.logUstensileOperation('error', ustensileData, null, error.message);
      throw error;
    }
  }

  /**
   * Crée plusieurs ustensiles en batch
   */
  async createBatch(ustensilesData) {
    const results = [];
    const createdUstensiles = [];
    const skippedUstensiles = [];
    const errorUstensiles = [];

    console.log(`🔄 Traitement de ${ustensilesData.length} ustensiles...`);

    for (const ustensileData of ustensilesData) {
      try {
        const result = await this.create(ustensileData);
        results.push(result);

        if (result.created) {
          createdUstensiles.push(result.data);
        } else {
          skippedUstensiles.push(result.data);
        }
      } catch (error) {
        errorUstensiles.push({
          ustensile: ustensileData,
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
      total: ustensilesData.length,
      created: createdUstensiles.length,
      skipped: skippedUstensiles.length,
      errors: errorUstensiles.length
    };

    console.log(`📊 Ustensiles - Créés: ${summary.created}, Ignorés: ${summary.skipped}, Erreurs: ${summary.errors}`);

    return {
      success: errorUstensiles.length === 0,
      summary,
      results,
      createdUstensiles,
      skippedUstensiles,
      errorUstensiles
    };
  }

  /**
   * Récupère un ustensile par ID
   */
  async getById(id) {
    try {
      const { data, error } = await this.supabase
        .from('ustensiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'ustensile ${id}:`, error);
      throw error;
    }
  }

  /**
   * Recherche des ustensiles par nom (recherche floue)
   */
  async searchByName(searchTerm, limit = 10) {
    try {
      const normalizedSearch = this.validator.normalizeString(searchTerm);
      
      const { data, error } = await this.supabase
        .from('ustensiles')
        .select('id, nom, categorie, description, obligatoire')
        .eq('is_public', true)
        .or(`nom.ilike.%${searchTerm}%,nom_normalise.ilike.%${normalizedSearch}%`)
        .order('nom')
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error(`Erreur lors de la recherche d'ustensiles "${searchTerm}":`, error);
      return [];
    }
  }

  /**
   * Vérifie et crée les ustensiles manquants à partir d'une liste
   */
  async ensureUstensilesExist(ustensilesList) {
    const ustensilesMap = new Map();
    const toCreate = [];

    console.log(`🔍 Vérification de ${ustensilesList.length} ustensiles...`);

    // Vérifier l'existence de chaque ustensile
    for (const ustensile of ustensilesList) {
      try {
        const existing = await this.findByNormalizedName(ustensile.nom);
        if (existing) {
          ustensilesMap.set(ustensile.nom, existing);
        } else {
          toCreate.push(ustensile);
        }
      } catch (error) {
        console.warn(`Erreur lors de la vérification de l'ustensile "${ustensile.nom}":`, error);
        toCreate.push(ustensile);
      }
    }

    // Créer les ustensiles manquants
    if (toCreate.length > 0) {
      console.log(`📝 Création de ${toCreate.length} ustensiles manquants...`);
      const batchResult = await this.createBatch(toCreate);
      
      // Ajouter les nouveaux ustensiles à la map
      batchResult.createdUstensiles.forEach(ustensile => {
        ustensilesMap.set(ustensile.nom, ustensile);
      });
      
      // Ajouter aussi les ustensiles ignorés (doublons) à la map
      batchResult.skippedUstensiles.forEach(ustensile => {
        ustensilesMap.set(ustensile.nom, ustensile);
      });

      if (!batchResult.success) {
        console.warn(`⚠️ Certains ustensiles n'ont pas pu être créés:`, batchResult.errorUstensiles);
      }
    }

    return ustensilesMap;
  }

  /**
   * Récupère les ustensiles les plus couramment utilisés
   */
  async getMostUsed(limit = 20) {
    try {
      // Requête pour récupérer les ustensiles les plus utilisés dans les recettes
      const { data, error } = await this.supabase
        .from('ustensiles')
        .select(`
          id, nom, categorie, description,
          recette_ustensiles!inner(recette_id)
        `)
        .eq('is_public', true)
        .limit(limit);

      if (error) {
        throw error;
      }

      // Compter les utilisations et trier
      const usageCount = {};
      data.forEach(ustensile => {
        const count = ustensile.recette_ustensiles?.length || 0;
        usageCount[ustensile.id] = {
          ...ustensile,
          usage_count: count
        };
        delete usageCount[ustensile.id].recette_ustensiles;
      });

      // Trier par usage décroissant
      const sorted = Object.values(usageCount)
        .sort((a, b) => b.usage_count - a.usage_count)
        .slice(0, limit);

      return sorted;
    } catch (error) {
      console.error('Erreur lors de la récupération des ustensiles les plus utilisés:', error);
      return [];
    }
  }

  /**
   * Statistiques sur les ustensiles
   */
  async getStats() {
    try {
      const { data, error } = await this.supabase
        .from('ustensiles')
        .select('categorie, is_public, user_id, obligatoire')
        .eq('is_public', true);

      if (error) {
        throw error;
      }

      const stats = {
        total: data.length,
        parCategorie: {},
        obligatoires: 0,
        systeme: 0
      };

      data.forEach(ustensile => {
        // Comptage par catégorie
        if (ustensile.categorie) {
          stats.parCategorie[ustensile.categorie] = (stats.parCategorie[ustensile.categorie] || 0) + 1;
        }

        // Comptage des ustensiles obligatoires
        if (ustensile.obligatoire) {
          stats.obligatoires++;
        }

        // Comptage des ustensiles système
        if (ustensile.user_id === this.systemUserId) {
          stats.systeme++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques ustensiles:', error);
      return null;
    }
  }

  /**
   * Récupère les ustensiles de base recommandés pour une cuisine
   */
  getBasicUstensiles() {
    return [
      {
        nom: 'Couteau de cuisine',
        categorie: 'preparation',
        description: 'Couteau de chef pour la découpe des ingrédients',
        obligatoire: true
      },
      {
        nom: 'Planche à découper',
        categorie: 'preparation',
        description: 'Surface de travail pour la découpe',
        obligatoire: true
      },
      {
        nom: 'Casserole',
        categorie: 'cuisson',
        description: 'Récipient de cuisson pour liquides et sauces',
        obligatoire: true
      },
      {
        nom: 'Poêle',
        categorie: 'cuisson',
        description: 'Récipient de cuisson pour grillades et sautés',
        obligatoire: true
      },
      {
        nom: 'Cuillère en bois',
        categorie: 'preparation',
        description: 'Ustensile pour mélanger sans rayer',
        obligatoire: false
      }
    ];
  }

  /**
   * Suggère des ustensiles en fonction d'une recette
   */
  suggestUstensilesForRecipe(recipeInstructions, recipeType = null) {
    const suggestions = [];
    const instructions = recipeInstructions.toLowerCase();

    // Mapping des mots-clés vers les ustensiles
    const keywordMappings = {
      'couper': ['Couteau de cuisine', 'Planche à découper'],
      'hacher': ['Couteau de cuisine', 'Planche à découper'],
      'micer': ['Couteau de cuisine', 'Planche à découper'],
      'cuire': ['Casserole'],
      'bouillir': ['Casserole'],
      'frire': ['Poêle'],
      'griller': ['Poêle'],
      'sauter': ['Poêle'],
      'mélanger': ['Cuillère en bois', 'Fouet'],
      'battre': ['Fouet'],
      'fouetter': ['Fouet'],
      'râper': ['Râpe'],
      'presser': ['Presse-agrumes'],
      'four': ['Plat à four']
    };

    // Analyser les instructions
    Object.entries(keywordMappings).forEach(([keyword, ustensiles]) => {
      if (instructions.includes(keyword)) {
        ustensiles.forEach(ustensile => {
          if (!suggestions.find(s => s.nom === ustensile)) {
            suggestions.push({
              nom: ustensile,
              categorie: this._getCategorieForUstensile(ustensile),
              obligatoire: this._isUstensileObligatoire(ustensile),
              description: this._getDescriptionForUstensile(ustensile)
            });
          }
        });
      }
    });

    return suggestions;
  }

  /**
   * Helpers pour les suggestions d'ustensiles
   */
  _getCategorieForUstensile(nom) {
    const mappings = {
      'Couteau de cuisine': 'preparation',
      'Planche à découper': 'preparation',
      'Casserole': 'cuisson',
      'Poêle': 'cuisson',
      'Cuillère en bois': 'preparation',
      'Fouet': 'preparation',
      'Râpe': 'preparation',
      'Presse-agrumes': 'preparation',
      'Plat à four': 'cuisson'
    };
    return mappings[nom] || 'autre';
  }

  _isUstensileObligatoire(nom) {
    const obligatoires = ['Couteau de cuisine', 'Planche à découper', 'Casserole', 'Poêle'];
    return obligatoires.includes(nom);
  }

  _getDescriptionForUstensile(nom) {
    const descriptions = {
      'Couteau de cuisine': 'Couteau de chef pour la découpe des ingrédients',
      'Planche à découper': 'Surface de travail pour la découpe',
      'Casserole': 'Récipient de cuisson pour liquides et sauces',
      'Poêle': 'Récipient de cuisson pour grillades et sautés',
      'Cuillère en bois': 'Ustensile pour mélanger sans rayer',
      'Fouet': 'Pour battre et émulsionner',
      'Râpe': 'Pour râper fromage, légumes, agrumes',
      'Presse-agrumes': 'Pour extraire le jus des agrumes',
      'Plat à four': 'Récipient de cuisson au four'
    };
    return descriptions[nom] || 'Ustensile de cuisine';
  }
}

module.exports = UstensileService;