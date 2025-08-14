// Validation simple pour TidiMondo (sans Zod)
// Fonctions de validation basiques en attendant l'ajout de Zod

import {
  UniteRecette,
  CategorieIngredient,
  RegimeAlimentaire,
  TypeRepas,
  Allergene,
  DifficulteRecette,
  StatutSejour,
  TypeSejour,
  RecetteFormData,
  SejourFormData
} from '@/types/tidimondo'

import {
  UNITES_RECETTE,
  CATEGORIES_INGREDIENT,
  REGIMES_ALIMENTAIRES,
  TYPES_REPAS,
  ALLERGENES,
  DIFFICULTES,
  STATUTS_SEJOUR,
  TYPES_SEJOUR
} from './types-utils'

// =====================================================
// TYPES POUR LA VALIDATION
// =====================================================

export interface ValidationResult {
  success: boolean
  errors: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
  code?: string
}

// =====================================================
// FONCTIONS DE VALIDATION DE BASE
// =====================================================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/) !== null
}

export function isValidUnite(unite: string): unite is UniteRecette {
  return UNITES_RECETTE.includes(unite as UniteRecette)
}

export function isValidRegime(regime: string): regime is RegimeAlimentaire {
  return REGIMES_ALIMENTAIRES.includes(regime as RegimeAlimentaire)
}

export function isValidTypeRepas(type: string): type is TypeRepas {
  return TYPES_REPAS.includes(type as TypeRepas)
}

export function isValidAllergene(allergene: string): allergene is Allergene {
  return ALLERGENES.includes(allergene as Allergene)
}

export function isValidDifficulte(difficulte: number): difficulte is DifficulteRecette {
  return DIFFICULTES.includes(difficulte as DifficulteRecette)
}

export function isValidStatutSejour(statut: string): statut is StatutSejour {
  return STATUTS_SEJOUR.includes(statut as StatutSejour)
}

export function isValidTypeSejour(type: string): type is TypeSejour {
  return TYPES_SEJOUR.includes(type as TypeSejour)
}

// =====================================================
// VALIDATION DES FORMULAIRES
// =====================================================

export function validateRecetteForm(data: Partial<RecetteFormData>): ValidationResult {
  const errors: ValidationError[] = []

  // Nom requis
  if (!data.nom || data.nom.trim().length === 0) {
    errors.push({ field: 'nom', message: 'Le nom est requis' })
  } else if (data.nom.length > 200) {
    errors.push({ field: 'nom', message: 'Le nom est trop long (max 200 caractères)' })
  }

  // Instructions requises
  if (!data.instructions || data.instructions.trim().length < 10) {
    errors.push({ field: 'instructions', message: 'Les instructions sont requises (min 10 caractères)' })
  }

  // Portions
  if (!data.portions || data.portions < 1 || data.portions > 100) {
    errors.push({ field: 'portions', message: 'Le nombre de portions doit être entre 1 et 100' })
  }

  // Type de repas requis
  if (!data.type_repas || data.type_repas.length === 0) {
    errors.push({ field: 'type_repas', message: 'Sélectionnez au moins un type de repas' })
  } else {
    // Vérifier que tous les types sont valides
    const invalidTypes = data.type_repas.filter(type => !isValidTypeRepas(type))
    if (invalidTypes.length > 0) {
      errors.push({ field: 'type_repas', message: 'Types de repas invalides' })
    }
  }

  // Régimes alimentaires
  if (data.regime_alimentaire) {
    const invalidRegimes = data.regime_alimentaire.filter(regime => !isValidRegime(regime))
    if (invalidRegimes.length > 0) {
      errors.push({ field: 'regime_alimentaire', message: 'Régimes alimentaires invalides' })
    }
  }

  // Temps de préparation
  if (data.temps_preparation !== undefined && (data.temps_preparation < 0 || data.temps_preparation > 1440)) {
    errors.push({ field: 'temps_preparation', message: 'Temps de préparation invalide (0-1440 min)' })
  }

  // Temps de cuisson
  if (data.temps_cuisson !== undefined && (data.temps_cuisson < 0 || data.temps_cuisson > 1440)) {
    errors.push({ field: 'temps_cuisson', message: 'Temps de cuisson invalide (0-1440 min)' })
  }

  // Difficulté
  if (data.difficulte !== undefined && !isValidDifficulte(data.difficulte)) {
    errors.push({ field: 'difficulte', message: 'Difficulté invalide (1-5)' })
  }

  // Coût estimé
  if (data.cout_estime !== undefined && (data.cout_estime < 0 || data.cout_estime > 1000)) {
    errors.push({ field: 'cout_estime', message: 'Coût estimé invalide (0-1000€)' })
  }

  // URL de l'image
  if (data.image_url && !isValidUrl(data.image_url)) {
    errors.push({ field: 'image_url', message: 'URL de l\'image invalide' })
  }

  // Ingrédients requis
  if (!data.ingredients || data.ingredients.length === 0) {
    errors.push({ field: 'ingredients', message: 'Au moins un ingrédient est requis' })
  } else {
    // Valider chaque ingrédient
    data.ingredients.forEach((ingredient, index) => {
      if (!ingredient.ingredient_id || !isValidUUID(ingredient.ingredient_id)) {
        errors.push({ field: `ingredients.${index}.ingredient_id`, message: 'Ingrédient invalide' })
      }
      if (!ingredient.quantite || ingredient.quantite <= 0) {
        errors.push({ field: `ingredients.${index}.quantite`, message: 'Quantité invalide' })
      }
      if (!ingredient.unite || !isValidUnite(ingredient.unite)) {
        errors.push({ field: `ingredients.${index}.unite`, message: 'Unité invalide' })
      }
    })
  }

  return {
    success: errors.length === 0,
    errors
  }
}

export function validateSejourForm(data: Partial<SejourFormData>): ValidationResult {
  const errors: ValidationError[] = []

  // Nom requis
  if (!data.nom || data.nom.trim().length === 0) {
    errors.push({ field: 'nom', message: 'Le nom est requis' })
  } else if (data.nom.length > 200) {
    errors.push({ field: 'nom', message: 'Le nom est trop long (max 200 caractères)' })
  }

  // Dates requises
  if (!data.date_debut || !isValidDate(data.date_debut)) {
    errors.push({ field: 'date_debut', message: 'Date de début invalide' })
  }

  if (!data.date_fin || !isValidDate(data.date_fin)) {
    errors.push({ field: 'date_fin', message: 'Date de fin invalide' })
  }

  // Vérifier l'ordre des dates
  if (data.date_debut && data.date_fin && isValidDate(data.date_debut) && isValidDate(data.date_fin)) {
    if (new Date(data.date_fin) < new Date(data.date_debut)) {
      errors.push({ field: 'date_fin', message: 'La date de fin doit être postérieure à la date de début' })
    }

    // Vérifier que la date de début n'est pas dans le passé
    const aujourd_hui = new Date()
    aujourd_hui.setHours(0, 0, 0, 0)
    if (new Date(data.date_debut) < aujourd_hui) {
      errors.push({ field: 'date_debut', message: 'La date de début ne peut pas être dans le passé' })
    }
  }

  // Nombre de participants
  if (!data.nombre_participants || data.nombre_participants < 1 || data.nombre_participants > 100) {
    errors.push({ field: 'nombre_participants', message: 'Le nombre de participants doit être entre 1 et 100' })
  }

  // Statut
  if (!data.statut || !isValidStatutSejour(data.statut)) {
    errors.push({ field: 'statut', message: 'Statut invalide' })
  }

  // Type de séjour (optionnel)
  if (data.type_sejour && !isValidTypeSejour(data.type_sejour)) {
    errors.push({ field: 'type_sejour', message: 'Type de séjour invalide' })
  }

  // Budget (optionnel)
  if (data.budget_prevu !== undefined && (data.budget_prevu < 0 || data.budget_prevu > 100000)) {
    errors.push({ field: 'budget_prevu', message: 'Budget invalide (0-100000€)' })
  }

  // Valider les participants
  if (data.participants) {
    data.participants.forEach((participant, index) => {
      if (!participant.nom || participant.nom.trim().length === 0) {
        errors.push({ field: `participants.${index}.nom`, message: 'Le nom du participant est requis' })
      }
      if (participant.email && !isValidEmail(participant.email)) {
        errors.push({ field: `participants.${index}.email`, message: 'Email invalide' })
      }
      if (participant.regime_alimentaire) {
        const invalidRegimes = participant.regime_alimentaire.filter(regime => !isValidRegime(regime))
        if (invalidRegimes.length > 0) {
          errors.push({ field: `participants.${index}.regime_alimentaire`, message: 'Régimes alimentaires invalides' })
        }
      }
      if (participant.allergies) {
        const invalidAllergies = participant.allergies.filter(allergie => !isValidAllergene(allergie))
        if (invalidAllergies.length > 0) {
          errors.push({ field: `participants.${index}.allergies`, message: 'Allergies invalides' })
        }
      }
    })
  }

  return {
    success: errors.length === 0,
    errors
  }
}

// =====================================================
// FONCTIONS UTILITAIRES
// =====================================================

export function getValidationErrorMessage(errors: ValidationError[], field: string): string | undefined {
  const error = errors.find(e => e.field === field)
  return error?.message
}

export function hasValidationError(errors: ValidationError[], field: string): boolean {
  return errors.some(e => e.field === field)
}

export function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map(e => `${e.field}: ${e.message}`).join(', ')
}

// =====================================================
// MESSAGES D'ERREUR CONSTANTS
// =====================================================

export const VALIDATION_MESSAGES = {
  required: 'Ce champ est requis',
  email: 'Adresse email invalide',
  url: 'URL invalide',
  positive: 'La valeur doit être positive',
  min: (min: number) => `Minimum ${min} caractères`,
  max: (max: number) => `Maximum ${max} caractères`,
  date: 'Date invalide',
  uuid: 'Identifiant invalide',
  array_min: (min: number) => `Sélectionnez au moins ${min} élément(s)`,
  number_max: (max: number) => `La valeur ne peut pas dépasser ${max}`,
  date_future: 'La date ne peut pas être dans le passé',
  date_order: 'La date de fin doit être postérieure à la date de début'
} as const