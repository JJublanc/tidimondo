# Phase 2 - Spécifications techniques détaillées

## 🎯 Vue d'ensemble

Ce document fournit les spécifications techniques précises pour l'implémentation de la Phase 2. Chaque composant, API route et hook est détaillé avec ses interfaces, props, et logique métier.

## 📋 Phase 2.1 - Spécifications des formulaires

### RecetteForm.tsx

```typescript
interface RecetteFormProps {
  recette?: RecetteComplete;
  mode: 'create' | 'edit';
  onSubmit: (data: RecetteFormData) => Promise<void>;
  onCancel: () => void;
  onSaveDraft?: (data: RecetteFormData) => Promise<void>;
}

interface RecetteFormState {
  currentStep: number;
  formData: RecetteFormData;
  ingredients: RecetteIngredientFormData[];
  ustensiles: RecetteUstensileFormData[];
  errors: Record<string, string>;
  isSubmitting: boolean;
  isDraft: boolean;
  lastSaved: Date | null;
}

// Étapes du formulaire
const FORM_STEPS = [
  {
    id: 'general',
    title: 'Informations générales',
    fields: ['nom', 'description', 'temps_preparation', 'temps_cuisson', 'portions', 'difficulte']
  },
  {
    id: 'ingredients',
    title: 'Ingrédients',
    component: 'IngredientSelector'
  },
  {
    id: 'ustensiles',
    title: 'Ustensiles',
    component: 'UstensileSelector'
  },
  {
    id: 'instructions',
    title: 'Instructions',
    fields: ['instructions', 'notes_personnelles']
  },
  {
    id: 'options',
    title: 'Options avancées',
    fields: ['regime_alimentaire', 'type_repas', 'saison', 'is_public']
  }
];

// Validation Zod
const recetteFormSchema = z.object({
  nom: z.string().min(3, 'Le nom doit contenir au moins 3 caractères').max(100),
  description: z.string().max(500).optional(),
  instructions: z.string().min(10, 'Les instructions doivent contenir au moins 10 caractères'),
  temps_preparation: z.number().min(1).max(480).optional(),
  temps_cuisson: z.number().min(0).max(480).optional(),
  portions: z.number().min(1).max(20),
  difficulte: z.enum(['facile', 'moyen', 'difficile']).optional(),
  regime_alimentaire: z.array(z.enum(['vegetarien', 'vegan', 'sans_gluten', 'sans_lactose', 'halal', 'casher'])),
  type_repas: z.array(z.enum(['petit_dejeuner', 'dejeuner', 'diner', 'collation', 'apero'])),
  saison: z.array(z.enum(['printemps', 'ete', 'automne', 'hiver'])).optional(),
  is_public: z.boolean().default(false)
});

// Logique de sauvegarde automatique
const AUTO_SAVE_INTERVAL = 30000; // 30 secondes
const useAutoSave = (formData: RecetteFormData, onSaveDraft: Function) => {
  useEffect(() => {
    const interval = setInterval(() => {
      if (formData.nom && formData.nom.length > 3) {
        onSaveDraft(formData);
      }
    }, AUTO_SAVE_INTERVAL);
    
    return () => clearInterval(interval);
  }, [formData, onSaveDraft]);
};
```

### IngredientSelector.tsx

```typescript
interface IngredientSelectorProps {
  selectedIngredients: RecetteIngredientFormData[];
  onIngredientsChange: (ingredients: RecetteIngredientFormData[]) => void;
  maxIngredients?: number; // Limitation freemium
  disabled?: boolean;
}

interface IngredientSelectorState {
  searchQuery: string;
  searchResults: Ingredient[];
  isSearching: boolean;
  showAddCustom: boolean;
  customIngredient: Partial<Ingredient>;
}

// Logique de recherche avec debounce
const useIngredientSearch = (query: string) => {
  const [results, setResults] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setResults([]);
        return;
      }
      
      setLoading(true);
      try {
        const response = await fetch(`/api/ingredients/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        setResults(data.ingredients);
      } catch (error) {
        console.error('Erreur recherche ingrédients:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );
  
  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);
  
  return { results, loading };
};

// Composant d'ajout d'ingrédient
const IngredientRow = ({ 
  ingredient, 
  onQuantityChange, 
  onUnitChange, 
  onRemove, 
  onToggleOptional 
}: IngredientRowProps) => {
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      <div className="flex-1">
        <span className="font-medium">{ingredient.nom}</span>
        <span className="text-sm text-gray-500 ml-2">({ingredient.categorie})</span>
      </div>
      
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={ingredient.quantite}
          onChange={(e) => onQuantityChange(parseFloat(e.target.value))}
          className="w-20 px-2 py-1 border rounded"
          min="0"
          step="0.1"
        />
        
        <select
          value={ingredient.unite}
          onChange={(e) => onUnitChange(e.target.value as UniteRecette)}
          className="px-2 py-1 border rounded"
        >
          <option value="g">g</option>
          <option value="kg">kg</option>
          <option value="ml">ml</option>
          <option value="l">l</option>
          <option value="piece">pièce</option>
          <option value="cuillere_soupe">c. à soupe</option>
          <option value="cuillere_cafe">c. à café</option>
          <option value="pincee">pincée</option>
        </select>
        
        <button
          type="button"
          onClick={onToggleOptional}
          className={`px-2 py-1 text-xs rounded ${
            ingredient.optionnel 
              ? 'bg-gray-200 text-gray-600' 
              : 'bg-blue-100 text-blue-600'
          }`}
        >
          {ingredient.optionnel ? 'Optionnel' : 'Obligatoire'}
        </button>
        
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-red-600 hover:bg-red-50 rounded"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
```

### UstensileSelector.tsx

```typescript
interface UstensileSelectorProps {
  selectedUstensiles: RecetteUstensileFormData[];
  onUstensilesChange: (ustensiles: RecetteUstensileFormData[]) => void;
  disabled?: boolean;
}

// Ustensiles groupés par catégorie
const USTENSILES_BY_CATEGORY = {
  cuisson: [
    { id: '1', nom: 'Casserole', obligatoire: true },
    { id: '2', nom: 'Poêle', obligatoire: true },
    { id: '3', nom: 'Four', obligatoire: false },
    { id: '4', nom: 'Plaque de cuisson', obligatoire: true }
  ],
  preparation: [
    { id: '5', nom: 'Couteau', obligatoire: true },
    { id: '6', nom: 'Planche à découper', obligatoire: true },
    { id: '7', nom: 'Saladier', obligatoire: false },
    { id: '8', nom: 'Fouet', obligatoire: false }
  ],
  mesure: [
    { id: '9', nom: 'Balance', obligatoire: false },
    { id: '10', nom: 'Verre doseur', obligatoire: false },
    { id: '11', nom: 'Cuillères doseuses', obligatoire: false }
  ]
};

// Suggestions intelligentes basées sur les ingrédients
const useSuggestedUstensiles = (ingredients: RecetteIngredientFormData[]) => {
  return useMemo(() => {
    const suggestions: string[] = [];
    
    // Logique de suggestion basée sur les ingrédients
    const hasLiquids = ingredients.some(ing => 
      ['ml', 'l'].includes(ing.unite) || 
      ing.ingredient?.categorie === 'boisson'
    );
    
    const hasMeat = ingredients.some(ing => 
      ing.ingredient?.categorie === 'viande'
    );
    
    const hasVegetables = ingredients.some(ing => 
      ing.ingredient?.categorie === 'legume'
    );
    
    if (hasLiquids) suggestions.push('Verre doseur', 'Casserole');
    if (hasMeat) suggestions.push('Poêle', 'Planche à découper');
    if (hasVegetables) suggestions.push('Couteau', 'Planche à découper');
    
    return [...new Set(suggestions)]; // Supprime les doublons
  }, [ingredients]);
};
```

## 🔍 Phase 2.2 - Spécifications de recherche

### SearchBar.tsx

```typescript
interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  suggestions?: string[];
  showFilters?: boolean;
  onToggleFilters?: () => void;
}

interface SearchBarState {
  query: string;
  showSuggestions: boolean;
  recentSearches: string[];
  popularSearches: string[];
}

// Hook de recherche avec historique
const useSearchHistory = () => {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  useEffect(() => {
    const saved = localStorage.getItem('tidimondo_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);
  
  const addSearch = useCallback((query: string) => {
    if (query.length < 2) return;
    
    setRecentSearches(prev => {
      const updated = [query, ...prev.filter(s => s !== query)].slice(0, 10);
      localStorage.setItem('tidimondo_recent_searches', JSON.stringify(updated));
      return updated;
    });
  }, []);
  
  const clearHistory = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('tidimondo_recent_searches');
  }, []);
  
  return { recentSearches, addSearch, clearHistory };
};

// Composant de suggestions
const SearchSuggestions = ({ 
  query, 
  recentSearches, 
  popularSearches, 
  onSelect 
}: SearchSuggestionsProps) => {
  const filteredRecent = recentSearches.filter(search => 
    search.toLowerCase().includes(query.toLowerCase())
  );
  
  const filteredPopular = popularSearches.filter(search => 
    search.toLowerCase().includes(query.toLowerCase()) &&
    !filteredRecent.includes(search)
  );
  
  return (
    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
      {filteredRecent.length > 0 && (
        <div className="p-2">
          <div className="text-xs text-gray-500 mb-2">Recherches récentes</div>
          {filteredRecent.map(search => (
            <button
              key={search}
              onClick={() => onSelect(search)}
              className="block w-full text-left px-3 py-2 hover:bg-gray-50 rounded"
            >
              <Clock className="h-3 w-3 inline mr-2 text-gray-400" />
              {search}
            </button>
          ))}
        </div>
      )}
      
      {filteredPopular.length > 0 && (
        <div className="p-2 border-t">
          <div className="text-xs text-gray-500 mb-2">Recherches populaires</div>
          {filteredPopular.map(search => (
            <button
              key={search}
              onClick={() => onSelect(search)}
              className="block w-full text-left px-3 py-2 hover:bg-gray-50 rounded"
            >
              <TrendingUp className="h-3 w-3 inline mr-2 text-gray-400" />
              {search}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

### FilterPanel.tsx

```typescript
interface FilterPanelProps {
  filters: RecetteFilters;
  onFiltersChange: (filters: RecetteFilters) => void;
  availableFilters: AvailableFilters;
  isOpen: boolean;
  onToggle: () => void;
}

interface AvailableFilters {
  regimes: { value: RegimeAlimentaire; count: number; label: string }[];
  typesRepas: { value: TypeRepas; count: number; label: string }[];
  difficultes: { value: DifficulteRecette; count: number; label: string }[];
  saisons: { value: Saison; count: number; label: string }[];
  tempsPreparation: { min: number; max: number };
  portions: { min: number; max: number };
}

// Composant de filtre par plage
const RangeFilter = ({ 
  label, 
  min, 
  max, 
  value, 
  onChange, 
  unit 
}: RangeFilterProps) => {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="px-3">
        <input
          type="range"
          min={min}
          max={max}
          value={value[1]}
          onChange={(e) => onChange([value[0], parseInt(e.target.value)])}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{value[0]} {unit}</span>
          <span>{value[1]} {unit}</span>
        </div>
      </div>
    </div>
  );
};

// Composant de filtre multi-sélection
const MultiSelectFilter = ({ 
  label, 
  options, 
  selected, 
  onChange 
}: MultiSelectFilterProps) => {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="space-y-2">
        {options.map(option => (
          <label key={option.value} className="flex items-center">
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange([...selected, option.value]);
                } else {
                  onChange(selected.filter(v => v !== option.value));
                }
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600">
              {option.label}
              <span className="text-gray-400 ml-1">({option.count})</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};
```

## 🔧 Phase 2.3 - Spécifications des utilitaires

### UnitConverter.tsx

```typescript
interface UnitConverterProps {
  fromUnit: UniteRecette;
  toUnit: UniteRecette;
  quantity: number;
  ingredient?: Ingredient;
  onConvert?: (result: ConversionResult) => void;
}

interface ConversionResult {
  convertedQuantity: number;
  isApproximate: boolean;
  conversionFactor: number;
  notes?: string;
}

// Table de conversion des unités
const CONVERSION_TABLE: Record<string, Record<string, number>> = {
  // Poids
  'g': { 'kg': 0.001, 'g': 1 },
  'kg': { 'g': 1000, 'kg': 1 },
  
  // Volume
  'ml': { 'l': 0.001, 'ml': 1 },
  'l': { 'ml': 1000, 'l': 1 },
  
  // Cuillères (approximatif)
  'cuillere_cafe': { 'ml': 5, 'cuillere_soupe': 0.33 },
  'cuillere_soupe': { 'ml': 15, 'cuillere_cafe': 3 },
  
  // Conversions contextuelles (dépendent de l'ingrédient)
  'verre': { 'ml': 250 }, // Verre standard
  'pincee': { 'g': 0.5 }  // Pincée approximative
};

// Conversions spécifiques par ingrédient
const INGREDIENT_CONVERSIONS: Record<string, Record<string, number>> = {
  'farine': {
    'verre': 125, // 1 verre de farine = 125g
    'cuillere_soupe': 8 // 1 c. à soupe de farine = 8g
  },
  'sucre': {
    'verre': 200, // 1 verre de sucre = 200g
    'cuillere_soupe': 12 // 1 c. à soupe de sucre = 12g
  },
  'huile': {
    'verre': 225, // 1 verre d'huile = 225ml
    'cuillere_soupe': 15 // 1 c. à soupe d'huile = 15ml
  }
};

const convertUnits = (
  quantity: number,
  fromUnit: UniteRecette,
  toUnit: UniteRecette,
  ingredient?: Ingredient
): ConversionResult => {
  // Conversion directe
  if (CONVERSION_TABLE[fromUnit]?.[toUnit]) {
    return {
      convertedQuantity: quantity * CONVERSION_TABLE[fromUnit][toUnit],
      isApproximate: false,
      conversionFactor: CONVERSION_TABLE[fromUnit][toUnit]
    };
  }
  
  // Conversion contextuelle avec ingrédient
  if (ingredient && INGREDIENT_CONVERSIONS[ingredient.nom_normalise]) {
    const ingredientConversions = INGREDIENT_CONVERSIONS[ingredient.nom_normalise];
    if (ingredientConversions[toUnit]) {
      return {
        convertedQuantity: quantity * ingredientConversions[toUnit],
        isApproximate: true,
        conversionFactor: ingredientConversions[toUnit],
        notes: `Conversion approximative pour ${ingredient.nom}`
      };
    }
  }
  
  // Pas de conversion possible
  return {
    convertedQuantity: quantity,
    isApproximate: false,
    conversionFactor: 1,
    notes: 'Conversion non disponible'
  };
};
```

## 🔌 API Routes détaillées

### /api/recettes/route.ts

```typescript
// GET - Liste des recettes utilisateur
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';
    
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    const offset = (page - 1) * limit;
    
    const { data: recettes, error, count } = await supabase
      .from('recettes_with_details') // Vue enrichie
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    return NextResponse.json({
      recettes,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
    
  } catch (error) {
    console.error('Erreur GET /api/recettes:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Création nouvelle recette
export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    const body = await request.json();
    const { recette, ingredients, ustensiles } = body;
    
    // Validation avec Zod
    const validatedRecette = recetteFormSchema.parse(recette);
    
    // Vérification des limitations freemium
    const { hasProAccess } = await checkUserSubscription(userId);
    
    if (!hasProAccess) {
      const { count: existingRecettes } = await supabase
        .from('recettes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if ((existingRecettes || 0) >= 5) {
        return NextResponse.json(
          { error: 'Limite de 5 recettes atteinte. Passez au plan Pro pour plus.' },
          { status: 403 }
        );
      }
      
      if (ingredients.length > 15) {
        return NextResponse.json(
          { error: 'Limite de 15 ingrédients par recette. Passez au plan Pro pour plus.' },
          { status: 403 }
        );
      }
    }
    
    // Transaction pour créer recette + relations
    const { data: newRecette, error: recetteError } = await supabase
      .from('recettes')
      .insert({
        ...validatedRecette,
        user_id: userId,
        nom_normalise: normalizeString(validatedRecette.nom)
      })
      .select()
      .single();
    
    if (recetteError) throw recetteError;
    
    // Insertion des ingrédients
    if (ingredients.length > 0) {
      const { error: ingredientsError } = await supabase
        .from('recette_ingredients')
        .insert(
          ingredients.map((ing: RecetteIngredientFormData, index: number) => ({
            recette_id: newRecette.id,
            ingredient_id: ing.ingredient_id,
            quantite: ing.quantite,
            unite: ing.unite,
            optionnel: ing.optionnel || false,
            notes: ing.notes,
            ordre_affichage: index + 1
          }))
        );
      
      if (ingredientsError) throw ingredientsError;
    }
    
    // Insertion des ustensiles
    if (ustensiles.length > 0) {
      const { error: ustensilesError } = await supabase
        .from('recette_ustensiles')
        .insert(
          ustensiles.map((ust: RecetteUstensileFormData) => ({
            recette_id: newRecette.id,
            ustensile_id: ust.ustensile_id,
            obligatoire: ust.obligatoire || false,
            notes: ust.notes
          }))
        );
      
      if (ustensilesError) throw ustensilesError;
    }
    
    // Récupération de la recette complète
    const { data: recetteComplete } = await supabase
      .from('recettes_with_details')
      .select('*')
      .eq('id', newRecette.id)
      .single();
    
    return NextResponse.json({ recette: recetteComplete }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Erreur POST /api/recettes:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
```

### /api/recettes/search/route.ts

```typescript
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Filtres
    const regimes = searchParams.get('regimes')?.split(',') || [];
    const typesRepas = searchParams.get('types_repas')?.split(',') || [];
    const difficulte = searchParams.get('difficulte');
    const tempsMax = searchParams.get('temps_max');
    const portionsMin = searchParams.get('portions_min');
    const portionsMax = searchParams.get('portions_max');
    
    const { userId } = auth();
    
    let queryBuilder = supabase
      .from('recettes_with_details')
      .select('*', { count: 'exact' });
    
    // Recherche full-text si query fourni
    if (query) {
      queryBuilder = queryBuilder.textSearch('search_vector', query, {
        type: 'websearch',
        config: 'french'
      });
    }
    
    // Filtres
    if (regimes.length > 0) {
      queryBuilder = queryBuilder.overlaps('regime_alimentaire', regimes);
    }
    
    if (typesRepas.length > 0) {
      queryBuilder = queryBuilder.overlaps('type_repas', typesRepas);
    }
    
    if (difficulte) {
      queryBuilder = queryBuilder.eq('difficulte', difficulte);
    }
    
    if (tempsMax) {
      queryBuilder = queryBuilder.lte('temps_total', parseInt(tempsMax));
    }
    
    if (portionsMin) {
      queryBuilder = queryBuilder.gte('portions', parseInt(portionsMin));
    }
    
    if (portionsMax) {
      queryBuilder = queryBuilder.lte('portions', parseInt(portionsMax));
    }
    
    // Visibilité : recettes publiques + recettes de l'utilisateur
    if (userId) {
      queryBuilder = queryBuilder.or(`is_public.eq.true,user_id.eq.${userId}`);
    } else {
      queryBuilder = queryBuilder.eq('is_public', true);
    }
    
    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder = queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    const { data: recettes, error, count } = await queryBuilder;
    
    if (error) throw error;
    
    // Agrégations pour les filtres (facettes)
    const { data: aggregations } = await supabase
      .rpc('get_recettes_aggregations', {
        search_query: query || null,
        user_id_param: userId
      });
    
    return NextResponse.json({
      recettes,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      aggregations: aggregations || {}
    });
    
  } catch (error) {
    console.error('Erreur GET /api/recettes/search:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
```

## 🎣 Hooks personnalisés

### useRecetteForm.ts

```typescript
interface UseRecetteFormOptions {
  recette?: RecetteComplete;
  mode: 'create' | 'edit';
  autoSave?: boolean;
}

export const useRecetteForm = ({ recette, mode, autoSave = true }: UseRecetteFormOptions) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<RecetteFormData>(() => 
    recette ? mapRecetteToFormData(recette) : getDefaultFormData()
  );
  const [ingredients, setIngredients] = useState<RecetteIngredientFormData[]>(() =>
    recette?.ingredients?.map(mapIngredientToFormData) || []
  );
  const [ustensiles, setUstensiles] = useState<RecetteUstensileFormData[]>(() =>
    recette?.ustensiles?.map(mapUstensileToFormData) || []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Validation en temps réel
  const validateStep = useCallback((step: number) => {