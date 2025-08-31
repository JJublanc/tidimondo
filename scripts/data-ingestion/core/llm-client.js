/**
 * Client LLM pour OpenRouter
 * Gère la génération de contenu via l'API OpenRouter
 */

const CONFIG = require('../config/pipeline.config.js');

class LLMClient {
  constructor() {
    this.apiKey = CONFIG.llm.apiKey;
    this.baseUrl = CONFIG.llm.baseUrl;
    this.defaultModel = CONFIG.llm.defaultModel;
    this.fallbackModel = CONFIG.llm.fallbackModel;
    this.maxTokens = CONFIG.llm.maxTokens;
    this.temperature = CONFIG.llm.temperature;
  }

  /**
   * Génère une recette complète à partir d'une description
   */
  async generateRecipe(description, contraintes = {}) {
    const prompt = this._buildRecipePrompt(description, contraintes);
    
    try {
      const response = await this._callOpenRouter(prompt, this.defaultModel);
      return this._parseRecipeResponse(response);
    } catch (error) {
      console.warn(`Erreur avec le modèle principal, tentative avec le modèle de fallback...`);
      const response = await this._callOpenRouter(prompt, this.fallbackModel);
      return this._parseRecipeResponse(response);
    }
  }

  /**
   * Génère uniquement le nom d'une recette pour vérification de doublon
   */
  async generateRecipeName(description, contraintes = {}) {
    const prompt = this._buildRecipeNamePrompt(description, contraintes);
    
    try {
      const response = await this._callOpenRouter(prompt, this.defaultModel);
      return this._parseRecipeNameResponse(response);
    } catch (error) {
      console.warn(`Erreur avec le modèle principal pour le nom, tentative avec le modèle de fallback...`);
      const response = await this._callOpenRouter(prompt, this.fallbackModel);
      return this._parseRecipeNameResponse(response);
    }
  }

  /**
   * Génère des informations détaillées pour un ingrédient
   */
  async generateIngredientDetails(nom, context = '') {
    const prompt = this._buildIngredientPrompt(nom, context);
    
    try {
      const response = await this._callOpenRouter(prompt, this.defaultModel);
      return this._parseIngredientResponse(response);
    } catch (error) {
      console.warn(`Erreur avec le modèle principal pour l'ingrédient "${nom}"`);
      const response = await this._callOpenRouter(prompt, this.fallbackModel);
      return this._parseIngredientResponse(response);
    }
  }

  /**
   * Génère des informations détaillées pour un ustensile
   */
  async generateUstensileDetails(nom, context = '') {
    const prompt = this._buildUstensilePrompt(nom, context);
    
    try {
      const response = await this._callOpenRouter(prompt, this.defaultModel);
      return this._parseUstensileResponse(response);
    } catch (error) {
      console.warn(`Erreur avec le modèle principal pour l'ustensile "${nom}"`);
      const response = await this._callOpenRouter(prompt, this.fallbackModel);
      return this._parseUstensileResponse(response);
    }
  }

  /**
   * Construit le prompt pour la génération de recette
   */
  _buildRecipePrompt(description, contraintes) {
    return `Tu es un chef cuisinier expert spécialisé dans la création de recettes détaillées et réalistes. 

MISSION: Créer une recette complète à partir de cette description: "${description}"

CONTRAINTES À RESPECTER:
${JSON.stringify(contraintes, null, 2)}

INFORMATIONS IMPORTANTES:
- Saisons disponibles: ${CONFIG.constants.saisons.join(', ')}
- Régimes alimentaires: ${CONFIG.constants.regimesAlimentaires.join(', ')}
- Types de repas: ${CONFIG.constants.typesRepas.join(', ')}
- Unités disponibles: ${CONFIG.constants.unites.join(', ')}
- Allergènes possibles: ${CONFIG.constants.allergenes.join(', ')}
- Catégories d'ingrédients: ${CONFIG.constants.categoriesIngredients.join(', ')}
- Catégories d'ustensiles: ${CONFIG.constants.categoriesUstensiles.join(', ')}

RÈGLES STRICTES:
1. La recette doit être réaliste et réalisable
2. Les saisons des ingrédients doivent être cohérentes avec la saison demandée
3. Les allergènes doivent être précisément identifiés
4. Les quantités doivent être logiques pour le nombre de portions
5. Les temps de préparation et cuisson doivent être réalistes
6. Utilise UNIQUEMENT les catégories, unités, et valeurs énumérées ci-dessus

RÉPONSE ATTENDUE (JSON STRICT):
{
  "recette": {
    "nom": "nom de la recette",
    "description": "description courte et appétissante",
    "instructions": "instructions détaillées étape par étape, minimum 100 caractères",
    "temps_preparation": nombre_en_minutes,
    "temps_cuisson": nombre_en_minutes_ou_0,
    "portions": nombre_de_portions,
    "difficulte": nombre_entre_1_et_5,
    "regime_alimentaire": ["liste des régimes compatibles"],
    "type_repas": ["types de repas appropriés"],
    "saison": ["saisons appropriées"],
    "cout_estime": nombre_decimal_euro,
    "calories_par_portion": nombre_approximatif
  },
  "ingredients": [
    {
      "nom": "nom exact de l'ingrédient",
      "quantite": nombre_decimal,
      "unite": "unité de la liste autorisée",
      "optionnel": boolean,
      "notes": "notes optionnelles",
      "categorie": "catégorie de la liste autorisée",
      "allergenes": ["allergènes présents"],
      "saison": ["saisons de disponibilité"],
      "prix_moyen_euro": nombre_decimal_par_kg_ou_unite_base
    }
  ],
  "ustensiles": [
    {
      "nom": "nom de l'ustensile",
      "categorie": "catégorie de la liste autorisée",
      "obligatoire": boolean,
      "description": "description de l'usage"
    }
  ]
}

IMPORTANT: Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.`;
  }

  /**
   * Construit le prompt pour générer seulement le nom de la recette
   */
  _buildRecipeNamePrompt(description, contraintes) {
    return `Tu es un chef cuisinier expert. Génère UNIQUEMENT le nom d'une recette basée sur cette description.

DESCRIPTION: "${description}"

CONTRAINTES:
${JSON.stringify(contraintes, null, 2)}

RÈGLES:
1. Le nom doit être descriptif et appétissant
2. Maximum 80 caractères
3. Style français traditionnel
4. Respecter les contraintes données

RÉPONSE ATTENDUE (JSON SIMPLE):
{
  "nom": "nom exact de la recette"
}

IMPORTANT: Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.`;
  }

  /**
   * Construit le prompt pour la génération d'ingrédient
   */
  _buildIngredientPrompt(nom, context) {
    return `Tu es un expert en nutrition et en ingredients culinaires.

MISSION: Compléter les informations détaillées pour cet ingrédient: "${nom}"
CONTEXTE: ${context}

CONTRAINTES:
- Catégories disponibles: ${CONFIG.constants.categoriesIngredients.join(', ')}
- Unités de base: ${CONFIG.constants.unitesBase.join(', ')}
- Allergènes possibles: ${CONFIG.constants.allergenes.join(', ')}
- Saisons: ${CONFIG.constants.saisons.join(', ')}

RÈGLES STRICTES:
1. Les informations doivent être précises et réalistes
2. Le prix doit être cohérent avec le marché français actuel
3. Les allergènes doivent être exhaustifs et précis
4. Les saisons doivent correspondre à la disponibilité naturelle en France
5. Utilise UNIQUEMENT les valeurs énumérées ci-dessus

RÉPONSE ATTENDUE (JSON STRICT):
{
  "nom": "${nom}",
  "categorie": "catégorie de la liste autorisée",
  "unite_base": "unité de base appropriée",
  "prix_moyen_euro": nombre_decimal_par_unite_base,
  "allergenes": ["liste des allergènes présents"],
  "saison": ["saisons de disponibilité optimale"],
  "description": "description nutritionnelle et culinaire"
}

IMPORTANT: Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.`;
  }

  /**
   * Construit le prompt pour la génération d'ustensile
   */
  _buildUstensilePrompt(nom, context) {
    return `Tu es un expert en équipement culinaire et ustensiles de cuisine.

MISSION: Compléter les informations détaillées pour cet ustensile: "${nom}"
CONTEXTE: ${context}

CONTRAINTES:
- Catégories disponibles: ${CONFIG.constants.categoriesUstensiles.join(', ')}

RÈGLES STRICTES:
1. Les informations doivent être précises et utiles
2. La description doit expliquer l'usage et l'importance
3. Utilise UNIQUEMENT les catégories énumérées ci-dessus

RÉPONSE ATTENDUE (JSON STRICT):
{
  "nom": "${nom}",
  "categorie": "catégorie de la liste autorisée",
  "description": "description détaillée de l'ustensile et de son usage",
  "obligatoire": boolean_selon_importance_dans_cuisine_standard
}

IMPORTANT: Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.`;
  }

  /**
   * Appelle l'API OpenRouter
   */
  async _callOpenRouter(prompt, model) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://tidimondo.com',
        'X-Title': 'TidiMondo Content Generation'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur OpenRouter (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Réponse OpenRouter invalide');
    }

    return data.choices[0].message.content;
  }

  /**
   * Parse la réponse de génération de recette
   */
  _parseRecipeResponse(response) {
    try {
      // Nettoyer la réponse pour extraire le JSON
      const cleaned = response.trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Aucun JSON trouvé dans la réponse');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Valider la structure
      if (!parsed.recette || !parsed.ingredients || !parsed.ustensiles) {
        throw new Error('Structure de réponse invalide');
      }

      return parsed;
    } catch (error) {
      console.error('Erreur lors du parsing de la réponse recette:', error);
      console.error('Réponse brute:', response);
      throw new Error(`Impossible de parser la réponse de génération de recette: ${error.message}`);
    }
  }

  /**
   * Parse la réponse de génération d'ingrédient
   */
  _parseIngredientResponse(response) {
    try {
      const cleaned = response.trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Aucun JSON trouvé dans la réponse');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Erreur lors du parsing de la réponse ingrédient:', error);
      throw new Error(`Impossible de parser la réponse de génération d'ingrédient: ${error.message}`);
    }
  }

  /**
   * Parse la réponse de génération d'ustensile
   */
  _parseUstensileResponse(response) {
    try {
      const cleaned = response.trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Aucun JSON trouvé dans la réponse');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Erreur lors du parsing de la réponse ustensile:', error);
      throw new Error(`Impossible de parser la réponse de génération d'ustensile: ${error.message}`);
    }
  }

  /**
   * Parse la réponse de génération de nom de recette
   */
  _parseRecipeNameResponse(response) {
    try {
      const cleaned = response.trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Aucun JSON trouvé dans la réponse');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.nom) {
        throw new Error('Nom de recette manquant dans la réponse');
      }

      return parsed.nom;
    } catch (error) {
      console.error('Erreur lors du parsing du nom de recette:', error);
      console.error('Réponse brute:', response);
      throw new Error(`Impossible de parser le nom de recette: ${error.message}`);
    }
  }
}

module.exports = LLMClient;