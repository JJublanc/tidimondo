# Phase 2 - Architecture détaillée : Gestion des recettes

## Vue d'ensemble

Cette architecture détaille l'implémentation complète de la Phase 2 pour TidiMondo, en s'appuyant sur les fondations solides de la Phase 1. L'objectif est de créer un système complet de gestion des recettes avec une expérience utilisateur fluide et performante.

## 🏗️ Architecture globale

### Structure des dossiers
```
src/
├── app/(protected)/
│   ├── recettes/
│   │   ├── page.tsx                    # Liste des recettes utilisateur
│   │   ├── nouvelle/
│   │   │   └── page.tsx               # Création de recette
│   │   ├── catalogue/
│   │   │   └── page.tsx               # Catalogue public/communauté
│   │   └── [id]/
│   │       ├── page.tsx               # Détail recette
│   │       └── modifier/
│   │           └── page.tsx           # Édition recette
│   └── ingredients/
│       ├── page.tsx                    # Gestion ingrédients
│       └── nouveau/
│           └── page.tsx               # Ajout ingrédient
├── app/api/
│   ├── recettes/
│   │   ├── route.ts                   # CRUD recettes
│   │   ├── [id]/
│   │   │   └── route.ts              # Opérations spécifiques
│   │   ├── search/
│   │   │   └── route.ts              # Recherche avancée
│   │   └── stats/
│   │       └── route.ts              # Statistiques
│   ├── ingredients/
│   │   ├── route.ts                   # CRUD ingrédients
│   │   └── search/
│   │       └── route.ts              # Recherche ingrédients
│   └── ustensiles/
│       └── route.ts                   # CRUD ustensiles
├── components/
│   ├── recettes/
│   │   ├── forms/
│   │   │   ├── RecetteForm.tsx        # Formulaire principal
│   │   │   ├── IngredientSelector.tsx # Sélection ingrédients
│   │   │   ├── UstensileSelector.tsx  # Sélection ustensiles
│   │   │   └── RecetteSteps.tsx       # Étapes de création
│   │   ├── display/
│   │   │   ├── RecetteCard.tsx        # Carte recette
│   │   │   ├── RecetteDetail.tsx      # Vue détaillée
│   │   │   ├── RecetteList.tsx        # Liste avec pagination
│   │   │   └── RecetteGrid.tsx        # Grille responsive
│   │   ├── search/
│   │   │   ├── SearchBar.tsx          # Barre de recherche
│   │   │   ├── FilterPanel.tsx        # Panneau de filtres
│   │   │   └── SortOptions.tsx        # Options de tri
│   │   └── shared/
│   │       ├── IngredientBadge.tsx    # Badge ingrédient
│   │       ├── DifficultyIndicator.tsx # Indicateur difficulté
│   │       └── TimeIndicator.tsx      # Indicateur temps
│   └── ingredients/
│       ├── IngredientManager.tsx      # Gestionnaire principal
│       ├── IngredientForm.tsx         # Formulaire ingrédient
│       ├── IngredientList.tsx         # Liste ingrédients
│       └── UnitConverter.tsx          # Convertisseur unités
└── hooks/
    ├── recettes/
    │   ├── useRecettes.ts             # Hook principal recettes
    │   ├── useRecetteForm.ts          # Hook formulaire
    │   ├── useRecetteSearch.ts        # Hook recherche
    │   └── useRecetteFilters.ts       # Hook filtres
    ├── ingredients/
    │   ├── useIngredients.ts          # Hook ingrédients
    │   └── useIngredientSearch.ts     # Hook recherche ingrédients
    └── shared/
        ├── usePagination.ts           # Hook pagination
        └── useDebounce.ts             # Hook debounce
```

## 🎯 Phase 2.1 - Interface de création/édition de recettes

### Composants principaux

#### RecetteForm.tsx
```typescript
interface RecetteFormProps {
  recette?: RecetteComplete;
  mode: 'create' | 'edit';
  onSubmit: (data: RecetteFormData) => Promise<void>;
  onCancel: () => void;
}

// Fonctionnalités :
// - Formulaire multi-étapes (info générale → ingrédients → ustensiles → instructions)
// - Validation en temps réel avec Zod
// - Sauvegarde automatique en brouillon
// - Prévisualisation en temps réel
// - Gestion des images (upload optionnel)
```

#### IngredientSelector.tsx
```typescript
interface IngredientSelectorProps {
  selectedIngredients: RecetteIngredientFormData[];
  onIngredientsChange: (ingredients: RecetteIngredientFormData[]) => void;
  maxIngredients?: number; // Limitation freemium
}

// Fonctionnalités :
// - Autocomplete avec recherche fuzzy
// - Ajout d'ingrédients personnalisés à la volée
// - Gestion des quantités avec conversion d'unités
// - Drag & drop pour réorganiser
// - Marquage optionnel/obligatoire
```

#### UstensileSelector.tsx
```typescript
interface UstensileSelectorProps {
  selectedUstensiles: RecetteUstensileFormData[];
  onUstensilesChange: (ustensiles: RecetteUstensileFormData[]) => void;
}

// Fonctionnalités :
// - Sélection par catégorie
// - Marquage obligatoire/optionnel
// - Suggestions basées sur les ingrédients
// - Ajout d'ustensiles personnalisés
```

### API Routes

#### /api/recettes/route.ts
```typescript
// GET - Liste des recettes utilisateur avec pagination
// POST - Création nouvelle recette avec validation

interface RecetteCreateRequest {
  recette: RecetteFormData;
  ingredients: RecetteIngredientFormData[];
  ustensiles: RecetteUstensileFormData[];
}

// Validation :
// - Vérification des limitations freemium
// - Validation des données avec Zod
// - Normalisation automatique des noms
// - Calcul automatique des coûts estimés
```

#### /api/recettes/[id]/route.ts
```typescript
// GET - Détail d'une recette avec relations
// PUT - Mise à jour recette
// DELETE - Suppression recette

// Sécurité :
// - Vérification propriétaire via RLS
// - Validation des permissions
// - Gestion des erreurs appropriée
```

### Hooks personnalisés

#### useRecetteForm.ts
```typescript
interface UseRecetteFormReturn {
  formData: RecetteFormData;
  ingredients: RecetteIngredientFormData[];
  ustensiles: RecetteUstensileFormData[];
  currentStep: number;
  isValid: boolean;
  errors: Record<string, string>;
  
  // Actions
  updateFormData: (data: Partial<RecetteFormData>) => void;
  addIngredient: (ingredient: RecetteIngredientFormData) => void;
  removeIngredient: (index: number) => void;
  addUstensile: (ustensile: RecetteUstensileFormData) => void;
  removeUstensile: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  submitRecette: () => Promise<void>;
  saveDraft: () => Promise<void>;
}

// Fonctionnalités :
// - Gestion d'état complexe du formulaire
// - Validation en temps réel
// - Sauvegarde automatique
// - Gestion des étapes
```

## 🔍 Phase 2.2 - Catalogue de recettes

### Composants de recherche et filtrage

#### SearchBar.tsx
```typescript
interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  suggestions?: string[];
}

// Fonctionnalités :
// - Recherche en temps réel avec debounce
// - Suggestions basées sur l'historique
// - Recherche dans nom, description, ingrédients
// - Sauvegarde des recherches récentes
```

#### FilterPanel.tsx
```typescript
interface FilterPanelProps {
  filters: RecetteFilters;
  onFiltersChange: (filters: RecetteFilters) => void;
  availableFilters: {
    regimes: RegimeAlimentaire[];
    typesRepas: TypeRepas[];
    difficultes: DifficulteRecette[];
    saisons: Saison[];
  };
}

// Filtres disponibles :
// - Régime alimentaire (multi-sélection)
// - Type de repas (multi-sélection)
// - Temps de préparation (plage)
// - Difficulté (sélection)
// - Saison (multi-sélection)
// - Nombre de portions (plage)
// - Coût estimé (plage)
```

#### RecetteGrid.tsx
```typescript
interface RecetteGridProps {
  recettes: RecetteComplete[];
  loading: boolean;
  onRecetteClick: (recette: RecetteComplete) => void;
  onFavoriteToggle?: (recetteId: string) => void;
  layout: 'grid' | 'list';
}

// Fonctionnalités :
// - Affichage responsive (grille/liste)
// - Lazy loading des images
// - Actions rapides (favoris, partage)
// - Indicateurs visuels (difficulté, temps, régime)
```

### API de recherche

#### /api/recettes/search/route.ts
```typescript
interface SearchRequest {
  query?: string;
  filters?: RecetteFilters;
  sort?: 'recent' | 'popular' | 'time_asc' | 'time_desc' | 'difficulty';
  page?: number;
  limit?: number;
}

interface SearchResponse {
  recettes: RecetteComplete[];
  total: number;
  page: number;
  totalPages: number;
  filters: {
    regimes: { value: RegimeAlimentaire; count: number }[];
    typesRepas: { value: TypeRepas; count: number }[];
    // ... autres agrégations
  };
}

// Fonctionnalités :
// - Recherche full-text avec PostgreSQL
// - Filtrage combiné efficace
// - Agrégations pour les facettes
// - Pagination optimisée
// - Cache intelligent
```

### Hooks de recherche

#### useRecetteSearch.ts
```typescript
interface UseRecetteSearchReturn {
  recettes: RecetteComplete[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  
  // État de recherche
  query: string;
  filters: RecetteFilters;
  sort: string;
  
  // Actions
  search: (query: string) => void;
  updateFilters: (filters: Partial<RecetteFilters>) => void;
  updateSort: (sort: string) => void;
  loadMore: () => void;
  reset: () => void;
}

// Fonctionnalités :
// - Debounce automatique
// - Gestion du cache
// - Pagination infinie
// - Gestion des erreurs
// - Optimisations de performance
```

## 🧩 Phase 2.3 - Système d'ingrédients et ustensiles

### Gestion des ingrédients

#### IngredientManager.tsx
```typescript
interface IngredientManagerProps {
  mode: 'selection' | 'management';
  onIngredientSelect?: (ingredient: Ingredient) => void;
  selectedIngredients?: string[];
}

// Fonctionnalités :
// - Vue catalogue avec catégories
// - Recherche et filtrage
// - Ajout d'ingrédients personnalisés
// - Gestion des prix et allergènes
// - Import/export de listes
```

#### UnitConverter.tsx
```typescript
interface UnitConverterProps {
  fromUnit: UniteRecette;
  toUnit: UniteRecette;
  quantity: number;
  ingredient?: Ingredient;
}

// Conversions supportées :
// - Poids : g ↔ kg
// - Volume : ml ↔ l
// - Cuillères : café ↔ soupe
// - Conversions contextuelles (ingrédient-spécifiques)
```

### API ingrédients

#### /api/ingredients/route.ts
```typescript
// GET - Liste des ingrédients avec filtres
// POST - Création ingrédient personnalisé

interface IngredientCreateRequest {
  nom: string;
  categorie: CategorieIngredient;
  unite_base: UniteBase;
  prix_moyen?: number;
  allergenes?: Allergene[];
  saison?: Saison[];
}

// Fonctionnalités :
// - Validation et normalisation
// - Détection de doublons
// - Enrichissement automatique (prix, saison)
// - Gestion des permissions utilisateur
```

## 🔒 Gestion des permissions et limitations

### Limitations freemium

```typescript
interface FreemiumLimitations {
  maxRecettes: number;           // 5 pour gratuit, ∞ pour Pro
  maxIngredientsParRecette: number; // 15 pour gratuit, ∞ pour Pro
  maxImagesParRecette: number;   // 1 pour gratuit, 5 pour Pro
  accessCataloguePublic: boolean; // false pour gratuit, true pour Pro
  exportPDF: boolean;            // false pour gratuit, true pour Pro
  statistiquesAvancees: boolean; // false pour gratuit, true pour Pro
}
```

### Composants de restriction

#### SubscriptionGate pour recettes
```typescript
// Utilisation dans les formulaires
<SubscriptionGate
  feature="unlimited_recipes"
  fallback={<UpgradePrompt feature="Plus de 5 recettes" />}
>
  <RecetteForm />
</SubscriptionGate>

// Utilisation dans les listes
{recettes.length >= 5 && !hasProAccess && (
  <UpgradePrompt 
    message="Vous avez atteint la limite de 5 recettes"
    feature="Recettes illimitées"
  />
)}
```

## 📊 Métriques et analytics

### Tracking des actions utilisateur

```typescript
interface RecetteAnalytics {
  // Création
  recette_created: { user_id: string; recette_id: string };
  recette_edited: { user_id: string; recette_id: string };
  recette_deleted: { user_id: string; recette_id: string };
  
  // Consultation
  recette_viewed: { user_id: string; recette_id: string };
  recette_searched: { user_id: string; query: string; results_count: number };
  recette_filtered: { user_id: string; filters: RecetteFilters };
  
  // Interaction
  ingredient_added: { user_id: string; ingredient_id: string };
  ustensile_added: { user_id: string; ustensile_id: string };
}
```

## 🚀 Optimisations de performance

### Stratégies de cache

```typescript
// Cache des recherches fréquentes
const searchCache = new Map<string, SearchResponse>();

// Cache des ingrédients populaires
const ingredientsCache = {
  popular: Ingredient[],
  byCategory: Record<CategorieIngredient, Ingredient[]>,
  lastUpdated: Date
};

// Préchargement des données critiques
const preloadData = {
  ingredients: () => fetch('/api/ingredients?limit=100'),
  ustensiles: () => fetch('/api/ustensiles'),
  userRecettes: () => fetch('/api/recettes?limit=10')
};
```

### Optimisations base de données

```sql
-- Index pour la recherche full-text
CREATE INDEX idx_recettes_search ON recettes USING gin(to_tsvector('french', nom || ' ' || description));

-- Index pour les filtres fréquents
CREATE INDEX idx_recettes_regime ON recettes USING gin(regime_alimentaire);
CREATE INDEX idx_recettes_temps ON recettes (temps_preparation, temps_cuisson);

-- Index pour les relations
CREATE INDEX idx_recette_ingredients_recette ON recette_ingredients (recette_id);
CREATE INDEX idx_recette_ustensiles_recette ON recette_ustensiles (recette_id);
```

## 🧪 Stratégie de tests

### Tests unitaires
- Validation des formulaires
- Logique de conversion d'unités
- Fonctions de recherche et filtrage
- Calculs de coûts et calories

### Tests d'intégration
- Flux complet de création de recette
- Recherche avec filtres multiples
- Gestion des permissions freemium
- API endpoints avec authentification

### Tests E2E
- Parcours utilisateur complet
- Responsive design
- Performance de chargement
- Gestion des erreurs

## 📋 Plan d'implémentation

### Ordre recommandé

1. **Semaine 1 - Fondations**
   - API routes de base (/api/recettes, /api/ingredients)
   - Hooks principaux (useRecettes, useIngredients)
   - Composants de base (RecetteCard, IngredientBadge)

2. **Semaine 2 - Formulaires**
   - RecetteForm avec validation
   - IngredientSelector et UstensileSelector
   - Gestion des étapes et sauvegarde

3. **Semaine 3 - Recherche et catalogue**
   - SearchBar et FilterPanel
   - API de recherche avancée
   - RecetteGrid avec pagination

4. **Semaine 4 - Finalisation**
   - Gestion des ingrédients personnalisés
   - Optimisations de performance
   - Tests et corrections

### Critères de validation

#### Phase 2.1 ✅
- [ ] Création de recette complète fonctionnelle
- [ ] Édition de recette existante
- [ ] Validation et gestion d'erreurs
- [ ] Sauvegarde automatique en brouillon
- [ ] Respect des limitations freemium

#### Phase 2.2 ✅
- [ ] Catalogue de recettes avec pagination
- [ ] Recherche en temps réel
- [ ] Filtres multiples combinables
- [ ] Tri par différents critères
- [ ] Interface responsive

#### Phase 2.3 ✅
- [ ] Gestion des ingrédients personnalisés
- [ ] Système de conversion d'unités
- [ ] Autocomplete intelligent
- [ ] Catégorisation automatique
- [ ] Performance optimisée

## 🔄 Intégration avec l'existant

### Dashboard principal
- Ajout de liens vers les nouvelles sections
- Statistiques des recettes créées
- Actions rapides (nouvelle recette, recherche)

### Navigation
- Menu principal avec section "Recettes"
- Breadcrumbs pour la navigation
- Retour au dashboard depuis toutes les pages

### Cohérence UI/UX
- Utilisation des composants existants (Button, etc.)
- Respect de la charte graphique
- Animations et transitions cohérentes

---

Cette architecture détaillée fournit une base solide pour l'implémentation de la Phase 2. Chaque composant est pensé pour être modulaire, testable et évolutif, tout en respectant les contraintes de performance et les limitations freemium de votre application.