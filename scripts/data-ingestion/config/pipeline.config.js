/**
 * Configuration principale de la pipeline d'ingestion TidiMondo
 */

const PIPELINE_CONFIG = {
  authentication: {
    supabase: {
      url: process.env.SUPABASE_URL,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    },
    systemUser: {
      id: process.env.TIDIMONDO_SYSTEM_USER_ID,
      clerkId: 'system_content_ingestion',
      name: 'Système d\'Ingestion TidiMondo',
      email: 'system-ingestion@tidimondo.local'
    }
  },
  
  security: {
    validateSystemUser: true,
    enableAuditLog: true,
    markAsPublic: true,
    validateDataIntegrity: true,
    maxBatchSize: 50
  },
  
  llm: {
    provider: 'openrouter',
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    fallbackModel: 'openai/gpt-4o',
    maxTokens: 4000,
    temperature: 0.1
  },
  
  validation: {
    maxIngredientsPerRecipe: 20,
    maxUstensilesPerRecipe: 10,
    requiredRecipeFields: ['nom', 'instructions', 'portions'],
    strictSeasonValidation: true,
    strictAllergenValidation: true,
    minInstructionLength: 50,
    maxRetries: 3
  },

  constants: {
    categoriesIngredients: ['legume', 'fruit', 'viande', 'poisson', 'feculent', 'produit_laitier', 'epice', 'condiment', 'boisson', 'autre'],
    unitesBase: ['g', 'kg', 'ml', 'l', 'piece', 'cuillere_soupe', 'cuillere_cafe'],
    unites: ['g', 'kg', 'ml', 'l', 'piece', 'cuillere_soupe', 'cuillere_cafe', 'pincee', 'verre'],
    allergenes: ['gluten', 'lactose', 'oeuf', 'arachide', 'fruits_coque', 'soja', 'poisson', 'crustace'],
    saisons: ['printemps', 'ete', 'automne', 'hiver'],
    regimesAlimentaires: ['vegetarien', 'vegan', 'sans_gluten', 'sans_lactose', 'halal', 'casher'],
    typesRepas: ['petit_dejeuner', 'dejeuner', 'diner', 'collation', 'apero'],
    categoriesUstensiles: ['cuisson', 'preparation', 'service', 'mesure', 'autre'],
    difficultes: [1, 2, 3, 4, 5]
  }
};

module.exports = PIPELINE_CONFIG;