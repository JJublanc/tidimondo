// Types TidiMondo - Entités métier pour l'outil d'organisation de séjours
// Synchronisé avec le schéma de base de données

// =====================================================
// TYPES DE BASE ET ÉNUMÉRATIONS
// =====================================================

export type UniteBase = 'g' | 'kg' | 'ml' | 'l' | 'piece' | 'cuillere_soupe' | 'cuillere_cafe';
export type UniteRecette = UniteBase | 'pincee' | 'verre';

export type CategorieIngredient = 
  | 'legume' 
  | 'fruit' 
  | 'viande' 
  | 'poisson' 
  | 'feculent' 
  | 'produit_laitier' 
  | 'epice' 
  | 'condiment' 
  | 'boisson' 
  | 'autre';

export type CategorieUstensile = 'cuisson' | 'preparation' | 'service' | 'mesure' | 'autre';

export type RegimeAlimentaire = 
  | 'vegetarien' 
  | 'vegan' 
  | 'sans_gluten' 
  | 'sans_lactose' 
  | 'halal' 
  | 'casher';

export type TypeRepas = 'petit_dejeuner' | 'dejeuner' | 'diner' | 'collation' | 'apero';

export type Saison = 'printemps' | 'ete' | 'automne' | 'hiver';

export type Allergene = 
  | 'gluten' 
  | 'lactose' 
  | 'oeuf' 
  | 'arachide' 
  | 'fruits_coque' 
  | 'soja' 
  | 'poisson' 
  | 'crustace';

export type TypeSejour = 'weekend' | 'semaine' | 'court' | 'long';

export type StatutSejour = 'brouillon' | 'planifie' | 'en_cours' | 'termine' | 'annule';

export type DifficulteRecette = 1 | 2 | 3 | 4 | 5;

// =====================================================
// INTERFACES PRINCIPALES
// =====================================================

export interface Ingredient {
  id: string;
  nom: string;
  nom_normalise: string;
  unite_base: UniteBase;
  categorie: CategorieIngredient | null;
  prix_moyen_euro: number | null;
  saison: Saison[] | null;
  allergenes: Allergene[];
  regime_alimentaire: RegimeAlimentaire[];
  created_at: string;
  updated_at: string;
}

export interface Ustensile {
  id: string;
  nom: string;
  nom_normalise: string;
  categorie: CategorieUstensile | null;
  description: string | null;
  obligatoire: boolean;
  created_at: string;
  updated_at: string;
}

export interface Recette {
  id: string;
  user_id: string;
  nom: string;
  nom_normalise: string;
  description: string | null;
  instructions: string;
  temps_preparation: number | null; // en minutes
  temps_cuisson: number | null; // en minutes
  difficulte: DifficulteRecette | null;
  portions: number;
  regime_alimentaire: RegimeAlimentaire[];
  type_repas: TypeRepas[];
  saison: Saison[] | null;
  cout_estime: number | null; // en euros par portion
  calories_par_portion: number | null;
  image_url: string | null;
  source: string | null;
  notes_personnelles: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecetteIngredient {
  id: string;
  recette_id: string;
  ingredient_id: string;
  quantite: number;
  unite: UniteRecette;
  optionnel: boolean;
  notes: string | null;
  ordre_affichage: number;
  created_at: string;
  // Relations
  ingredient?: Ingredient;
}

export interface RecetteUstensile {
  id: string;
  recette_id: string;
  ustensile_id: string;
  obligatoire: boolean;
  notes: string | null;
  created_at: string;
  // Relations
  ustensile?: Ustensile;
}

export interface Sejour {
  id: string;
  user_id: string;
  nom: string;
  description: string | null;
  lieu: string | null;
  date_debut: string; // Format ISO date
  date_fin: string; // Format ISO date
  nombre_participants: number;
  type_sejour: TypeSejour | null;
  budget_prevu: number | null;
  notes: string | null;
  statut: StatutSejour;
  created_at: string;
  updated_at: string;
}

export interface SejourParticipant {
  id: string;
  sejour_id: string;
  nom: string;
  email: string | null;
  regime_alimentaire: RegimeAlimentaire[];
  allergies: Allergene[];
  preferences: string | null;
  notes: string | null;
  created_at: string;
}

export interface SejourRepas {
  id: string;
  sejour_id: string;
  recette_id: string | null;
  date_repas: string; // Format ISO date
  type_repas: TypeRepas;
  nombre_portions: number;
  notes: string | null;
  repas_libre: string | null; // Pour les repas sans recette
  cout_estime: number | null;
  ordre_dans_journee: number;
  created_at: string;
  updated_at: string;
  // Nouvelles propriétés pour la gestion détaillée des repas
  composition?: RepasComposition;
  // Relations
  recette?: Recette;
}

// Types pour la composition détaillée des repas
export interface RepasComposition {
  // Pour les petits-déjeuners
  petit_dejeuner?: PetitDejeunerComposition;
  // Pour les repas principaux (déjeuner/dîner)
  repas_principal?: RepasPrincipalComposition;
  // Accompagnements communs
  accompagnements?: AccompagnementsComposition;
}

export interface PetitDejeunerComposition {
  ingredients: RepasIngredient[];
  boissons: RepasBoisson[];
}

export interface RepasPrincipalComposition {
  entree?: RepasPlat;
  plat_principal?: RepasPlat;
  dessert?: RepasPlat;
}

export interface AccompagnementsComposition {
  pain?: RepasIngredient;
  fromage?: RepasIngredient;
  boissons?: RepasBoisson[];
  autres_ingredients?: RepasIngredient[];
}

export interface RepasPlat {
  recette_id?: string;
  nom_libre?: string; // Pour les plats sans recette
  notes?: string;
}

export interface RepasIngredient {
  ingredient_id: string;
  nom: string;
  quantite: number;
  unite: UniteRecette;
  quantite_par_personne: boolean; // true si la quantité est par personne
  notes?: string;
}

export interface RepasBoisson {
  nom: string;
  type: 'chaude' | 'froide';
  quantite?: number;
  unite?: 'ml' | 'l' | 'tasse' | 'verre';
  quantite_par_personne: boolean;
  notes?: string;
}

export type TypeBoisson = 'chaude' | 'froide';

export interface ListeCourses {
  id: string;
  sejour_id: string;
  nom: string;
  contenu: ListeCoursesContenu;
  cout_total_estime: number | null;
  date_generation: string;
  notes: string | null;
  created_at: string;
}

// =====================================================
// TYPES COMPOSÉS ET UTILITAIRES
// =====================================================

// Structure du contenu JSON de la liste de courses
export interface ListeCoursesContenu {
  ingredients: ListeCoursesIngredient[];
  resume: {
    nombre_recettes: number;
    nombre_repas: number;
    nombre_participants: number;
    periode: {
      debut: string;
      fin: string;
    };
  };
  categories: {
    [key in CategorieIngredient]: ListeCoursesIngredient[];
  };
}

export interface ListeCoursesIngredient {
  ingredient_id: string;
  nom: string;
  quantite_totale: number;
  unite: UniteRecette;
  prix_estime: number | null;
  recettes_utilisees: string[]; // Noms des recettes qui utilisent cet ingrédient
  notes: string[];
}

// Recette avec ses ingrédients et ustensiles (pour affichage complet)
export interface RecetteComplete extends Recette {
  ingredients: RecetteIngredient[];
  ustensiles: RecetteUstensile[];
  temps_total?: number; // temps_preparation + temps_cuisson
  auteur?: {
    first_name: string | null;
    last_name: string | null;
  };
}

// Séjour avec toutes ses données (pour affichage complet)
export interface SejourComplet extends Sejour {
  participants: SejourParticipant[];
  repas: SejourRepas[];
  listes_courses: ListeCourses[];
  statistiques?: {
    nombre_participants_saisis: number;
    nombre_repas_planifies: number;
    nombre_jours_avec_repas: number;
    cout_total_repas: number | null;
  };
}

// =====================================================
// TYPES POUR LES FORMULAIRES
// =====================================================

export interface RecetteFormData {
  nom: string;
  description?: string;
  instructions: string;
  temps_preparation?: number;
  temps_cuisson?: number;
  difficulte?: DifficulteRecette;
  portions: number;
  regime_alimentaire: RegimeAlimentaire[];
  type_repas: TypeRepas[];
  saison?: Saison[];
  cout_estime?: number;
  calories_par_portion?: number;
  image_url?: string;
  source?: string;
  notes_personnelles?: string;
  is_public: boolean;
  ingredients: RecetteIngredientFormData[];
  ustensiles: RecetteUstensileFormData[];
}

export interface RecetteIngredientFormData {
  ingredient_id: string;
  quantite: number;
  unite: UniteRecette;
  optionnel: boolean;
  notes?: string;
  ordre_affichage: number;
}

export interface RecetteUstensileFormData {
  ustensile_id: string;
  obligatoire: boolean;
  notes?: string;
}

export interface SejourFormData {
  nom: string;
  description?: string;
  lieu?: string;
  date_debut: string;
  date_fin: string;
  nombre_participants: number;
  type_sejour?: TypeSejour;
  budget_prevu?: number;
  notes?: string;
  statut: StatutSejour;
  participants: SejourParticipantFormData[];
}

export interface SejourParticipantFormData {
  nom: string;
  email?: string;
  regime_alimentaire: RegimeAlimentaire[];
  allergies: Allergene[];
  preferences?: string;
  notes?: string;
}

// =====================================================
// TYPES POUR LES FILTRES ET RECHERCHE
// =====================================================

export interface RecetteFilters {
  search?: string;
  regime_alimentaire?: RegimeAlimentaire[];
  type_repas?: TypeRepas[];
  difficulte_max?: DifficulteRecette;
  temps_max?: number; // temps total maximum en minutes
  saison?: Saison;
  is_public?: boolean;
  user_id?: string;
}

export interface IngredientFilters {
  search?: string;
  categorie?: CategorieIngredient;
  allergenes_exclus?: Allergene[];
  saison?: Saison;
}

export interface SejourFilters {
  search?: string;
  statut?: StatutSejour[];
  type_sejour?: TypeSejour;
  date_debut_apres?: string;
  date_fin_avant?: string;
}

// =====================================================
// TYPES POUR LES RÉPONSES API
// =====================================================

export interface ApiResponse<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

// Types pour les réponses paginées
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =====================================================
// TYPES POUR LES STATISTIQUES ET ANALYTICS
// =====================================================

export interface RecetteStats {
  nombre_ingredients: number;
  nombre_ustensiles: number;
  temps_total: number;
  cout_par_portion: number | null;
  popularite?: number; // Nombre d'utilisations dans des séjours
}

export interface SejourStats {
  nombre_participants_saisis: number;
  nombre_repas_planifies: number;
  nombre_jours_avec_repas: number;
  cout_total_repas: number | null;
  repartition_repas: {
    [key in TypeRepas]: number;
  };
  ingredients_les_plus_utilises: {
    nom: string;
    quantite_totale: number;
    unite: string;
  }[];
}

export interface UserStats {
  nombre_recettes: number;
  nombre_sejours: number;
  sejours_par_statut: {
    [key in StatutSejour]: number;
  };
  recettes_par_difficulte: {
    [key in DifficulteRecette]: number;
  };
}

// =====================================================
// TYPES POUR LA PLANIFICATION
// =====================================================

export interface PlanificationJour {
  date: string;
  repas: {
    [key in TypeRepas]?: SejourRepas;
  };
}

export interface PlanificationSemaine {
  jours: PlanificationJour[];
  statistiques: {
    repas_planifies: number;
    repas_total_possible: number;
    pourcentage_completion: number;
  };
}

// =====================================================
// TYPES POUR L'EXPORT
// =====================================================

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'json';
  inclure_recettes_detaillees: boolean;
  inclure_participants: boolean;
  inclure_planning: boolean;
  inclure_liste_courses: boolean;
}

export interface ExportResult {
  url: string;
  filename: string;
  size: number;
  expires_at: string;
}