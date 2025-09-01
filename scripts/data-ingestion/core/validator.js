/**
 * Validateur de données pour la pipeline d'ingestion
 * Valide les données générées par le LLM selon les contraintes métier
 */

const CONFIG = require('../config/pipeline.config.js');

class Validator {
  constructor() {
    this.constants = CONFIG.constants;
    this.validationRules = CONFIG.validation;
  }

  /**
   * Valide une recette complète (recette + ingrédients + ustensiles)
   */
  validateCompleteRecipe(recipeData) {
    const errors = [];
    const warnings = [];

    try {
      // Valider la recette principale
      const recipeErrors = this.validateRecipe(recipeData.recette);
      errors.push(...recipeErrors);

      // Valider les ingrédients
      if (!recipeData.ingredients || !Array.isArray(recipeData.ingredients)) {
        errors.push('La liste des ingrédients est requise et doit être un tableau');
      } else {
        if (recipeData.ingredients.length === 0) {
          errors.push('Au moins un ingrédient est requis');
        }
        
        if (recipeData.ingredients.length > this.validationRules.maxIngredientsPerRecipe) {
          errors.push(`Trop d'ingrédients (max: ${this.validationRules.maxIngredientsPerRecipe})`);
        }

        recipeData.ingredients.forEach((ingredient, index) => {
          const ingredientErrors = this.validateIngredient(ingredient, `Ingrédient ${index + 1}`);
          errors.push(...ingredientErrors);
        });
      }

      // Valider les ustensiles
      if (!recipeData.ustensiles || !Array.isArray(recipeData.ustensiles)) {
        warnings.push('Aucun ustensile spécifié');
      } else {
        if (recipeData.ustensiles.length > this.validationRules.maxUstensilesPerRecipe) {
          errors.push(`Trop d'ustensiles (max: ${this.validationRules.maxUstensilesPerRecipe})`);
        }

        recipeData.ustensiles.forEach((ustensile, index) => {
          const ustensileErrors = this.validateUstensile(ustensile, `Ustensile ${index + 1}`);
          errors.push(...ustensileErrors);
        });
      }

      // Validations croisées
      const crossValidationErrors = this._validateCrossReferences(recipeData);
      errors.push(...crossValidationErrors);

    } catch (error) {
      errors.push(`Erreur lors de la validation: ${error.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valide une recette individuelle
   */
  validateRecipe(recette, prefix = 'Recette') {
    const errors = [];

    if (!recette || typeof recette !== 'object') {
      return [`${prefix}: Données de recette invalides`];
    }

    // Champs requis
    this.validationRules.requiredRecipeFields.forEach(field => {
      if (!recette[field] || (typeof recette[field] === 'string' && recette[field].trim() === '')) {
        errors.push(`${prefix}: Le champ "${field}" est requis`);
      }
    });

    // Validation du nom
    if (recette.nom && (recette.nom.length < 3 || recette.nom.length > 100)) {
      errors.push(`${prefix}: Le nom doit faire entre 3 et 100 caractères`);
    }

    // Validation des instructions
    if (recette.instructions && recette.instructions.length < this.validationRules.minInstructionLength) {
      errors.push(`${prefix}: Les instructions doivent faire au moins ${this.validationRules.minInstructionLength} caractères`);
    }

    // Validation des valeurs numériques
    if (recette.portions !== undefined) {
      if (!Number.isInteger(recette.portions) || recette.portions < 1 || recette.portions > 20) {
        errors.push(`${prefix}: Le nombre de portions doit être entre 1 et 20`);
      }
    }

    if (recette.difficulte !== undefined) {
      if (!this.constants.difficultes.includes(recette.difficulte)) {
        errors.push(`${prefix}: La difficulté doit être entre 1 et 5`);
      }
    }

    if (recette.temps_preparation !== undefined) {
      if (!Number.isInteger(recette.temps_preparation) || recette.temps_preparation < 1 || recette.temps_preparation > 480) {
        errors.push(`${prefix}: Le temps de préparation doit être entre 1 et 480 minutes`);
      }
    }

    if (recette.temps_cuisson !== undefined) {
      if (!Number.isInteger(recette.temps_cuisson) || recette.temps_cuisson < 0 || recette.temps_cuisson > 480) {
        errors.push(`${prefix}: Le temps de cuisson doit être entre 0 et 480 minutes`);
      }
    }

    // Validation des tableaux
    if (recette.regime_alimentaire && Array.isArray(recette.regime_alimentaire)) {
      const invalidRegimes = recette.regime_alimentaire.filter(r => !this.constants.regimesAlimentaires.includes(r));
      if (invalidRegimes.length > 0) {
        errors.push(`${prefix}: Régimes alimentaires invalides: ${invalidRegimes.join(', ')}`);
      }
    }

    if (recette.type_repas && Array.isArray(recette.type_repas)) {
      const invalidTypes = recette.type_repas.filter(t => !this.constants.typesRepas.includes(t));
      if (invalidTypes.length > 0) {
        errors.push(`${prefix}: Types de repas invalides: ${invalidTypes.join(', ')}`);
      }
    }

    if (recette.saison && Array.isArray(recette.saison)) {
      const invalidSaisons = recette.saison.filter(s => !this.constants.saisons.includes(s));
      if (invalidSaisons.length > 0) {
        errors.push(`${prefix}: Saisons invalides: ${invalidSaisons.join(', ')}`);
      }
    }

    return errors;
  }

  /**
   * Valide un ingrédient
   */
  validateIngredient(ingredient, prefix = 'Ingrédient') {
    const errors = [];

    if (!ingredient || typeof ingredient !== 'object') {
      return [`${prefix}: Données d'ingrédient invalides`];
    }

    // Champs requis
    if (!ingredient.nom || ingredient.nom.trim() === '') {
      errors.push(`${prefix}: Le nom est requis`);
    }

    if (ingredient.quantite === undefined || ingredient.quantite === null) {
      errors.push(`${prefix}: La quantité est requise`);
    } else if (typeof ingredient.quantite !== 'number' || ingredient.quantite <= 0) {
      errors.push(`${prefix}: La quantité doit être un nombre positif`);
    }

    if (!ingredient.unite || !this.constants.unites.includes(ingredient.unite)) {
      errors.push(`${prefix}: Unité invalide. Unités autorisées: ${this.constants.unites.join(', ')}`);
    }

    // Validation catégorie (si présente)
    if (ingredient.categorie && !this.constants.categoriesIngredients.includes(ingredient.categorie)) {
      errors.push(`${prefix}: Catégorie invalide. Catégories autorisées: ${this.constants.categoriesIngredients.join(', ')}`);
    }

    // Validation allergènes
    if (ingredient.allergenes && Array.isArray(ingredient.allergenes)) {
      const invalidAllergenes = ingredient.allergenes.filter(a => !this.constants.allergenes.includes(a));
      if (invalidAllergenes.length > 0) {
        errors.push(`${prefix}: Allergènes invalides: ${invalidAllergenes.join(', ')}`);
      }
    }

    // Validation saisons
    if (ingredient.saison && Array.isArray(ingredient.saison)) {
      const invalidSaisons = ingredient.saison.filter(s => !this.constants.saisons.includes(s));
      if (invalidSaisons.length > 0) {
        errors.push(`${prefix}: Saisons invalides: ${invalidSaisons.join(', ')}`);
      }
    }

    // Validation prix
    if (ingredient.prix_moyen_euro !== undefined && (typeof ingredient.prix_moyen_euro !== 'number' || ingredient.prix_moyen_euro < 0)) {
      errors.push(`${prefix}: Le prix moyen doit être un nombre positif`);
    }

    return errors;
  }

  /**
   * Valide un ustensile
   */
  validateUstensile(ustensile, prefix = 'Ustensile') {
    const errors = [];

    if (!ustensile || typeof ustensile !== 'object') {
      return [`${prefix}: Données d'ustensile invalides`];
    }

    // Champs requis
    if (!ustensile.nom || ustensile.nom.trim() === '') {
      errors.push(`${prefix}: Le nom est requis`);
    }

    if (!ustensile.categorie || !this.constants.categoriesUstensiles.includes(ustensile.categorie)) {
      errors.push(`${prefix}: Catégorie invalide. Catégories autorisées: ${this.constants.categoriesUstensiles.join(', ')}`);
    }

    // Validation du type obligatoire
    if (ustensile.obligatoire !== undefined && typeof ustensile.obligatoire !== 'boolean') {
      errors.push(`${prefix}: Le champ "obligatoire" doit être un booléen`);
    }

    return errors;
  }

  /**
   * Valide les références croisées dans une recette complète
   */
  _validateCrossReferences(recipeData) {
    const errors = [];

    // Vérifier la cohérence des saisons entre recette et ingrédients
    if (this.validationRules.strictSeasonValidation && recipeData.recette.saison && recipeData.ingredients) {
      const recipeSaisons = recipeData.recette.saison;
      
      recipeData.ingredients.forEach((ingredient, index) => {
        if (ingredient.saison && ingredient.saison.length > 0) {
          const hasCommonSeason = ingredient.saison.some(s => recipeSaisons.includes(s));
          if (!hasCommonSeason) {
            errors.push(`Ingrédient ${index + 1} (${ingredient.nom}): Aucune saison commune avec la recette`);
          }
        }
      });
    }

    // Vérifier la cohérence des allergènes
    if (this.validationRules.strictAllergenValidation && recipeData.recette.regime_alimentaire && recipeData.ingredients) {
      const regimes = recipeData.recette.regime_alimentaire;
      
      // Vérifications spécifiques par régime
      if (regimes.includes('sans_gluten')) {
        const ingredientsAvecGluten = recipeData.ingredients.filter(ing => 
          ing.allergenes && ing.allergenes.includes('gluten')
        );
        if (ingredientsAvecGluten.length > 0) {
          errors.push(`Recette marquée "sans gluten" mais contient des ingrédients avec gluten: ${ingredientsAvecGluten.map(i => i.nom).join(', ')}`);
        }
      }

      if (regimes.includes('sans_lactose')) {
        const ingredientsAvecLactose = recipeData.ingredients.filter(ing => 
          ing.allergenes && ing.allergenes.includes('lactose')
        );
        if (ingredientsAvecLactose.length > 0) {
          errors.push(`Recette marquée "sans lactose" mais contient des ingrédients avec lactose: ${ingredientsAvecLactose.map(i => i.nom).join(', ')}`);
        }
      }

      if (regimes.includes('vegan')) {
        const categoriesNonVegan = ['viande', 'poisson', 'produit_laitier'];
        const ingredientsNonVegan = recipeData.ingredients.filter(ing => 
          ing.categorie && categoriesNonVegan.includes(ing.categorie)
        );
        if (ingredientsNonVegan.length > 0) {
          errors.push(`Recette marquée "vegan" mais contient des ingrédients non-vegan: ${ingredientsNonVegan.map(i => i.nom).join(', ')}`);
        }
      }
    }

    return errors;
  }

  /**
   * Normalise une chaîne de caractères pour la comparaison
   */
  normalizeString(str) {
    if (!str || typeof str !== 'string') return '';
    
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Valide un batch d'input complet
   */
  validateInputBatch(inputData) {
    const errors = [];
    const warnings = [];

    if (!inputData || typeof inputData !== 'object') {
      return {
        isValid: false,
        errors: ['Données d\'entrée invalides'],
        warnings: []
      };
    }

    // Valider les métadonnées
    if (!inputData.metadata) {
      warnings.push('Aucune métadonnée fournie');
    } else {
      if (!inputData.metadata.batch_name) {
        warnings.push('Nom de batch non spécifié');
      }
    }

    // Valider les recettes
    if (!inputData.recettes || !Array.isArray(inputData.recettes)) {
      errors.push('La liste des recettes est requise et doit être un tableau');
    } else {
      if (inputData.recettes.length === 0) {
        errors.push('Au moins une recette est requise');
      }

      if (inputData.recettes.length > CONFIG.security.maxBatchSize) {
        errors.push(`Trop de recettes dans le batch (max: ${CONFIG.security.maxBatchSize})`);
      }

      inputData.recettes.forEach((recette, index) => {
        if (!recette.description || recette.description.trim() === '') {
          errors.push(`Recette ${index + 1}: Description requise`);
        }

        if (recette.contraintes) {
          const contrainteErrors = this._validateContraintes(recette.contraintes, `Recette ${index + 1}`);
          errors.push(...contrainteErrors);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valide les contraintes d'une recette d'input
   */
  _validateContraintes(contraintes, prefix) {
    const errors = [];

    if (contraintes.saison && Array.isArray(contraintes.saison)) {
      const invalidSaisons = contraintes.saison.filter(s => !this.constants.saisons.includes(s));
      if (invalidSaisons.length > 0) {
        errors.push(`${prefix}: Saisons invalides dans les contraintes: ${invalidSaisons.join(', ')}`);
      }
    }

    if (contraintes.regime_alimentaire && Array.isArray(contraintes.regime_alimentaire)) {
      const invalidRegimes = contraintes.regime_alimentaire.filter(r => !this.constants.regimesAlimentaires.includes(r));
      if (invalidRegimes.length > 0) {
        errors.push(`${prefix}: Régimes alimentaires invalides dans les contraintes: ${invalidRegimes.join(', ')}`);
      }
    }

    if (contraintes.type_repas && Array.isArray(contraintes.type_repas)) {
      const invalidTypes = contraintes.type_repas.filter(t => !this.constants.typesRepas.includes(t));
      if (invalidTypes.length > 0) {
        errors.push(`${prefix}: Types de repas invalides dans les contraintes: ${invalidTypes.join(', ')}`);
      }
    }

    if (contraintes.difficulte !== undefined) {
      if (!this.constants.difficultes.includes(contraintes.difficulte)) {
        errors.push(`${prefix}: Difficulté invalide dans les contraintes (doit être entre 1 et 5)`);
      }
    }

    if (contraintes.portions !== undefined) {
      if (!Number.isInteger(contraintes.portions) || contraintes.portions < 1 || contraintes.portions > 20) {
        errors.push(`${prefix}: Nombre de portions invalide dans les contraintes (doit être entre 1 et 20)`);
      }
    }

    return errors;
  }
}

module.exports = Validator;