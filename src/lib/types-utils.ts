// Utilitaires TypeScript pour TidiMondo
// Fonctions d'aide, validateurs et transformateurs de types

import {
  UniteBase,
  UniteRecette,
  CategorieIngredient,
  RegimeAlimentaire,
  TypeRepas,
  Allergene,
  DifficulteRecette,
  StatutSejour,
  TypeSejour,
  Saison,
  Ingredient,
  Recette,
  RecetteComplete,
  Sejour,
  SejourComplet,
  RecetteFormData,
  SejourFormData,
  ListeCoursesContenu
} from '@/types/tidimondo'

// =====================================================
// CONSTANTES ET ÉNUMÉRATIONS
// =====================================================

export const UNITES_BASE: UniteBase[] = ['g', 'kg', 'ml', 'l', 'piece', 'cuillere_soupe', 'cuillere_cafe']

export const UNITES_RECETTE: UniteRecette[] = [...UNITES_BASE, 'pincee', 'verre']

export const CATEGORIES_INGREDIENT: CategorieIngredient[] = [
  'legume', 'fruit', 'viande', 'poisson', 'feculent', 
  'produit_laitier', 'epice', 'condiment', 'boisson', 'autre'
]

export const REGIMES_ALIMENTAIRES: RegimeAlimentaire[] = [
  'vegetarien', 'vegan', 'sans_gluten', 'sans_lactose', 'halal', 'casher'
]

export const TYPES_REPAS: TypeRepas[] = [
  'petit_dejeuner', 'dejeuner', 'diner', 'collation', 'apero'
]

export const ALLERGENES: Allergene[] = [
  'gluten', 'lactose', 'oeuf', 'arachide', 'fruits_coque', 
  'soja', 'poisson', 'crustace'
]

export const SAISONS: Saison[] = ['printemps', 'ete', 'automne', 'hiver']

export const DIFFICULTES: DifficulteRecette[] = [1, 2, 3, 4, 5]

export const STATUTS_SEJOUR: StatutSejour[] = [
  'brouillon', 'planifie', 'en_cours', 'termine', 'annule'
]

export const TYPES_SEJOUR: TypeSejour[] = ['weekend', 'semaine', 'court', 'long']

// =====================================================
// LABELS ET TRADUCTIONS
// =====================================================

export const UNITE_LABELS: Record<UniteRecette, string> = {
  g: 'grammes',
  kg: 'kilogrammes',
  ml: 'millilitres',
  l: 'litres',
  piece: 'pièce(s)',
  cuillere_soupe: 'cuillère(s) à soupe',
  cuillere_cafe: 'cuillère(s) à café',
  pincee: 'pincée(s)',
  verre: 'verre(s)'
}

export const UNITE_SYMBOLS: Record<UniteRecette, string> = {
  g: 'g',
  kg: 'kg',
  ml: 'ml',
  l: 'l',
  piece: 'pc',
  cuillere_soupe: 'c.s.',
  cuillere_cafe: 'c.c.',
  pincee: 'pincée',
  verre: 'verre'
}

export const CATEGORIE_LABELS: Record<CategorieIngredient, string> = {
  legume: 'Légumes',
  fruit: 'Fruits',
  viande: 'Viandes',
  poisson: 'Poissons',
  feculent: 'Féculents',
  produit_laitier: 'Produits laitiers',
  epice: 'Épices',
  condiment: 'Condiments',
  boisson: 'Boissons',
  autre: 'Autres'
}

export const REGIME_LABELS: Record<RegimeAlimentaire, string> = {
  vegetarien: 'Végétarien',
  vegan: 'Végan',
  sans_gluten: 'Sans gluten',
  sans_lactose: 'Sans lactose',
  halal: 'Halal',
  casher: 'Casher'
}

export const TYPE_REPAS_LABELS: Record<TypeRepas, string> = {
  petit_dejeuner: 'Petit-déjeuner',
  dejeuner: 'Déjeuner',
  diner: 'Dîner',
  collation: 'Collation',
  apero: 'Apéritif'
}

export const ALLERGENE_LABELS: Record<Allergene, string> = {
  gluten: 'Gluten',
  lactose: 'Lactose',
  oeuf: 'Œufs',
  arachide: 'Arachides',
  fruits_coque: 'Fruits à coque',
  soja: 'Soja',
  poisson: 'Poissons',
  crustace: 'Crustacés'
}

export const SAISON_LABELS: Record<Saison, string> = {
  printemps: 'Printemps',
  ete: 'Été',
  automne: 'Automne',
  hiver: 'Hiver'
}

export const DIFFICULTE_LABELS: Record<DifficulteRecette, string> = {
  1: 'Très facile',
  2: 'Facile',
  3: 'Moyen',
  4: 'Difficile',
  5: 'Très difficile'
}

export const STATUT_SEJOUR_LABELS: Record<StatutSejour, string> = {
  brouillon: 'Brouillon',
  planifie: 'Planifié',
  en_cours: 'En cours',
  termine: 'Terminé',
  annule: 'Annulé'
}

export const TYPE_SEJOUR_LABELS: Record<TypeSejour, string> = {
  weekend: 'Week-end',
  semaine: 'Semaine',
  court: 'Court séjour',
  long: 'Long séjour'
}

// =====================================================
// FONCTIONS DE VALIDATION
// =====================================================

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

// =====================================================
// FONCTIONS DE TRANSFORMATION
// =====================================================

export function formatQuantite(quantite: number, unite: UniteRecette): string {
  const symbol = UNITE_SYMBOLS[unite]
  
  // Formatage spécial pour les pièces
  if (unite === 'piece') {
    return quantite === 1 ? '1 pièce' : `${quantite} pièces`
  }
  
  // Formatage avec décimales si nécessaire
  const formatted = quantite % 1 === 0 ? quantite.toString() : quantite.toFixed(1)
  return `${formatted} ${symbol}`
}

export function formatTemps(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  
  const heures = Math.floor(minutes / 60)
  const minutesRestantes = minutes % 60
  
  if (minutesRestantes === 0) {
    return `${heures}h`
  }
  
  return `${heures}h${minutesRestantes.toString().padStart(2, '0')}`
}

export function formatPrix(prix: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(prix)
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(dateString))
}

export function formatDateCourte(dateString: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(dateString))
}

// =====================================================
// FONCTIONS DE CALCUL
// =====================================================

export function calculerTempsTotal(recette: Recette): number {
  const preparation = recette.temps_preparation || 0
  const cuisson = recette.temps_cuisson || 0
  return preparation + cuisson
}

export function calculerCoutTotal(recette: RecetteComplete): number {
  return recette.ingredients.reduce((total, ingredient) => {
    if (!ingredient.ingredient?.prix_moyen_euro) return total
    
    const prixUnitaire = ingredient.ingredient.prix_moyen_euro
    let quantiteEnUniteBase = ingredient.quantite
    
    // Conversion vers l'unité de base si nécessaire
    if (ingredient.unite === 'kg' && ingredient.ingredient.unite_base === 'g') {
      quantiteEnUniteBase *= 1000
    } else if (ingredient.unite === 'l' && ingredient.ingredient.unite_base === 'ml') {
      quantiteEnUniteBase *= 1000
    }
    
    return total + (quantiteEnUniteBase * prixUnitaire)
  }, 0)
}

export function calculerDureeSejour(sejour: Sejour): number {
  const debut = new Date(sejour.date_debut)
  const fin = new Date(sejour.date_fin)
  const diffTime = Math.abs(fin.getTime() - debut.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 pour inclure le jour de départ
}

export function calculerNombreRepasTheorique(sejour: Sejour): number {
  const duree = calculerDureeSejour(sejour)
  return duree * 3 // 3 repas par jour
}

// =====================================================
// FONCTIONS DE CONVERSION
// =====================================================

export function convertirUnite(
  quantite: number,
  uniteSource: UniteRecette,
  uniteCible: UniteRecette
): number | null {
  // Conversions de poids
  if (uniteSource === 'g' && uniteCible === 'kg') return quantite / 1000
  if (uniteSource === 'kg' && uniteCible === 'g') return quantite * 1000
  
  // Conversions de volume
  if (uniteSource === 'ml' && uniteCible === 'l') return quantite / 1000
  if (uniteSource === 'l' && uniteCible === 'ml') return quantite * 1000
  
  // Conversions approximatives
  if (uniteSource === 'cuillere_soupe' && uniteCible === 'ml') return quantite * 15
  if (uniteSource === 'cuillere_cafe' && uniteCible === 'ml') return quantite * 5
  if (uniteSource === 'verre' && uniteCible === 'ml') return quantite * 200
  
  // Même unité
  if (uniteSource === uniteCible) return quantite
  
  // Conversion impossible
  return null
}

export function ajusterQuantitePourPortions(
  quantiteOriginale: number,
  portionsOriginales: number,
  nouvellesPortions: number
): number {
  return (quantiteOriginale * nouvellesPortions) / portionsOriginales
}

// =====================================================
// FONCTIONS DE FILTRAGE
// =====================================================

export function recetteRespectRegimes(
  recette: Recette,
  regimesRequis: RegimeAlimentaire[]
): boolean {
  if (regimesRequis.length === 0) return true
  
  return regimesRequis.every(regime => 
    recette.regime_alimentaire.includes(regime)
  )
}

export function recetteSansAllergenes(
  recette: RecetteComplete,
  allergenesInterdits: Allergene[]
): boolean {
  if (allergenesInterdits.length === 0) return true
  
  return !recette.ingredients.some(ingredient => 
    ingredient.ingredient?.allergenes.some(allergene =>
      allergenesInterdits.includes(allergene)
    )
  )
}

export function recetteAdapteeAuSejour(
  recette: RecetteComplete,
  sejour: SejourComplet
): boolean {
  // Vérifier les régimes alimentaires des participants
  const regimesParticipants = sejour.participants.flatMap(p => p.regime_alimentaire)
  const regimesUniques = [...new Set(regimesParticipants)]
  
  if (!recetteRespectRegimes(recette, regimesUniques)) {
    return false
  }
  
  // Vérifier les allergies des participants
  const allergiesParticipants = sejour.participants.flatMap(p => p.allergies)
  const allergiesUniques = [...new Set(allergiesParticipants)]
  
  return recetteSansAllergenes(recette, allergiesUniques)
}

// =====================================================
// FONCTIONS DE GÉNÉRATION
// =====================================================

export function genererNomSejourAuto(
  lieu?: string,
  dateDebut?: string,
  typeSejour?: TypeSejour
): string {
  const parties: string[] = []
  
  if (typeSejour) {
    parties.push(TYPE_SEJOUR_LABELS[typeSejour])
  } else {
    parties.push('Séjour')
  }
  
  if (lieu) {
    parties.push(`à ${lieu}`)
  }
  
  if (dateDebut) {
    const mois = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date(dateDebut))
    parties.push(`- ${mois}`)
  }
  
  return parties.join(' ')
}

export function genererSlugRecette(nom: string): string {
  return nom
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9\s-]/g, '') // Garder seulement lettres, chiffres, espaces et tirets
    .replace(/\s+/g, '-') // Remplacer espaces par tirets
    .replace(/-+/g, '-') // Éviter les tirets multiples
    .trim()
}

// =====================================================
// FONCTIONS D'EXPORT DE TYPES
// =====================================================

export function recetteToFormData(recette: RecetteComplete): RecetteFormData {
  return {
    nom: recette.nom,
    description: recette.description || undefined,
    instructions: recette.instructions,
    temps_preparation: recette.temps_preparation || undefined,
    temps_cuisson: recette.temps_cuisson || undefined,
    difficulte: recette.difficulte || undefined,
    portions: recette.portions,
    regime_alimentaire: recette.regime_alimentaire,
    type_repas: recette.type_repas,
    saison: recette.saison || undefined,
    cout_estime: recette.cout_estime || undefined,
    calories_par_portion: recette.calories_par_portion || undefined,
    image_url: recette.image_url || undefined,
    source: recette.source || undefined,
    notes_personnelles: recette.notes_personnelles || undefined,
    is_public: recette.is_public,
    ingredients: recette.ingredients.map(ing => ({
      ingredient_id: ing.ingredient_id,
      quantite: ing.quantite,
      unite: ing.unite,
      optionnel: ing.optionnel,
      notes: ing.notes || undefined,
      ordre_affichage: ing.ordre_affichage
    })),
    ustensiles: recette.ustensiles.map(ust => ({
      ustensile_id: ust.ustensile_id,
      obligatoire: ust.obligatoire,
      notes: ust.notes || undefined
    }))
  }
}

export function sejourToFormData(sejour: SejourComplet): SejourFormData {
  return {
    nom: sejour.nom,
    description: sejour.description || undefined,
    lieu: sejour.lieu || undefined,
    date_debut: sejour.date_debut,
    date_fin: sejour.date_fin,
    nombre_participants: sejour.nombre_participants,
    type_sejour: sejour.type_sejour || undefined,
    budget_prevu: sejour.budget_prevu || undefined,
    notes: sejour.notes || undefined,
    statut: sejour.statut,
    participants: sejour.participants.map(part => ({
      nom: part.nom,
      email: part.email || undefined,
      regime_alimentaire: part.regime_alimentaire,
      allergies: part.allergies,
      preferences: part.preferences || undefined,
      notes: part.notes || undefined
    }))
  }
}