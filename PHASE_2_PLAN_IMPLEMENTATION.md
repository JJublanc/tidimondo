# Phase 2 - Plan d'implémentation détaillé

## 🎯 Vue d'ensemble

Ce plan d'implémentation détaille l'ordre optimal pour développer la Phase 2, en tenant compte des dépendances entre composants et en maximisant la valeur livrée à chaque étape.

## 📅 Planning général

**Durée totale estimée : 2-3 semaines**

- **Semaine 1** : Fondations et API (Phase 2.1 partielle)
- **Semaine 2** : Interfaces utilisateur et recherche (Phase 2.1 + 2.2)
- **Semaine 3** : Finalisation et optimisations (Phase 2.3 + tests)

## 🏗️ Étape 1 : Fondations (Jours 1-3)

### Jour 1 : Vérification des prérequis et API de base

#### Matin : Vérification technique
```bash
# Vérifier que les migrations sont appliquées
supabase db push

# Vérifier la compilation TypeScript
npm run build

# Tester les types existants
npm run type-check
```

#### Après-midi : API Routes fondamentales
**Priorité : CRITIQUE**

1. **`/api/recettes/route.ts`** (GET + POST)
   - Implémentation basique du CRUD
   - Validation avec Zod
   - Gestion des erreurs
   - Tests unitaires

2. **`/api/ingredients/route.ts`** (GET)
   - Récupération des ingrédients existants
   - Recherche basique
   - Cache simple

**Livrables :**
- ✅ API recettes fonctionnelle
- ✅ API ingrédients fonctionnelle
- ✅ Tests API passants
- ✅ Documentation API

### Jour 2 : Hooks et utilitaires

#### Matin : Hooks de base
**Priorité : HAUTE**

1. **`useRecettes.ts`**
   ```typescript
   // Hook principal pour la gestion des recettes
   export const useRecettes = () => {
     const [recettes, setRecettes] = useState<RecetteComplete[]>([]);
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);
     
     const fetchRecettes = useCallback(async () => {
       // Implémentation
     }, []);
     
     const createRecette = useCallback(async (data: RecetteFormData) => {
       // Implémentation
     }, []);
     
     return { recettes, loading, error, fetchRecettes, createRecette };
   };
   ```

2. **`useIngredients.ts`**
   ```typescript
   // Hook pour la gestion des ingrédients
   export const useIngredients = () => {
     // Implémentation similaire
   };
   ```

#### Après-midi : Composants de base
**Priorité : HAUTE**

1. **`RecetteCard.tsx`**
   - Affichage basique d'une recette
   - Actions (voir, modifier, supprimer)
   - Responsive design

2. **`IngredientBadge.tsx`**
   - Badge pour afficher un ingrédient
   - Couleurs par catégorie
   - Tooltip avec détails

**Livrables :**
- ✅ Hooks de base fonctionnels
- ✅ Composants d'affichage basiques
- ✅ Tests unitaires des hooks

### Jour 3 : Page de liste des recettes

#### Journée complète : Interface de base
**Priorité : HAUTE**

1. **`/app/(protected)/recettes/page.tsx`**
   ```typescript
   export default function RecettesPage() {
     const { recettes, loading, fetchRecettes } = useRecettes();
     
     useEffect(() => {
       fetchRecettes();
     }, [fetchRecettes]);
     
     return (
       <div className="container mx-auto px-4 py-8">
         <div className="flex justify-between items-center mb-6">
           <h1 className="text-2xl font-bold">Mes Recettes</h1>
           <Link href="/recettes/nouvelle">
             <Button>
               <Plus className="h-4 w-4 mr-2" />
               Nouvelle recette
             </Button>
           </Link>
         </div>
         
         {loading ? (
           <RecettesSkeleton />
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {recettes.map(recette => (
               <RecetteCard key={recette.id} recette={recette} />
             ))}
           </div>
         )}
       </div>
     );
   }
   ```

2. **Navigation mise à jour**
   - Ajout du lien "Recettes" dans le menu principal
   - Breadcrumbs
   - États vides avec call-to-action

**Livrables :**
- ✅ Page de liste fonctionnelle
- ✅ Navigation intégrée
- ✅ États de chargement et d'erreur
- ✅ Design responsive

## 🚀 Étape 2 : Formulaire de création (Jours 4-6)

### Jour 4 : Structure du formulaire

#### Matin : Hook de formulaire
**Priorité : CRITIQUE**

1. **`useRecetteForm.ts`**
   ```typescript
   export const useRecetteForm = ({ recette, mode }: UseRecetteFormOptions) => {
     const [currentStep, setCurrentStep] = useState(0);
     const [formData, setFormData] = useState<RecetteFormData>(getDefaultFormData());
     const [ingredients, setIngredients] = useState<RecetteIngredientFormData[]>([]);
     const [ustensiles, setUstensiles] = useState<RecetteUstensileFormData[]>([]);
     
     // Validation par étape
     const validateCurrentStep = useCallback(() => {
       const stepValidation = STEP_VALIDATIONS[currentStep];
       return stepValidation(formData, ingredients, ustensiles);
     }, [currentStep, formData, ingredients, ustensiles]);
     
     // Navigation entre étapes
     const nextStep = useCallback(() => {
       if (validateCurrentStep() && currentStep < FORM_STEPS.length - 1) {
         setCurrentStep(prev => prev + 1);
       }
     }, [validateCurrentStep, currentStep]);
     
     return {
       currentStep,
       formData,
       ingredients,
       ustensiles,
       nextStep,
       prevStep: () => setCurrentStep(prev => Math.max(0, prev - 1)),
       updateFormData: setFormData,
       addIngredient: (ingredient) => setIngredients(prev => [...prev, ingredient]),
       removeIngredient: (index) => setIngredients(prev => prev.filter((_, i) => i !== index))
     };
   };
   ```

#### Après-midi : Composant principal
**Priorité : CRITIQUE**

1. **`RecetteForm.tsx`**
   - Structure multi-étapes
   - Navigation entre étapes
   - Validation en temps réel
   - Sauvegarde automatique

**Livrables :**
- ✅ Hook de formulaire complet
- ✅ Structure de base du formulaire
- ✅ Navigation entre étapes

### Jour 5 : Sélecteurs d'ingrédients et ustensiles

#### Matin : IngredientSelector
**Priorité : HAUTE**

1. **`IngredientSelector.tsx`**
   ```typescript
   export const IngredientSelector = ({ 
     selectedIngredients, 
     onIngredientsChange 
   }: IngredientSelectorProps) => {
     const [searchQuery, setSearchQuery] = useState('');
     const { results, loading } = useIngredientSearch(searchQuery);
     
     const addIngredient = (ingredient: Ingredient) => {
       const newIngredient: RecetteIngredientFormData = {
         ingredient_id: ingredient.id,
         ingredient,
         quantite: 1,
         unite: ingredient.unite_base,
         optionnel: false,
         notes: null
       };
       onIngredientsChange([...selectedIngredients, newIngredient]);
     };
     
     return (
       <div className="space-y-4">
         <SearchInput
           value={searchQuery}
           onChange={setSearchQuery}
           placeholder="Rechercher un ingrédient..."
         />
         
         {loading ? (
           <SearchSkeleton />
         ) : (
           <SearchResults
             results={results}
             onSelect={addIngredient}
           />
         )}
         
         <SelectedIngredients
           ingredients={selectedIngredients}
           onUpdate={onIngredientsChange}
         />
       </div>
     );
   };
   ```

#### Après-midi : UstensileSelector
**Priorité : MOYENNE**

1. **`UstensileSelector.tsx`**
   - Interface par catégories
   - Suggestions intelligentes
   - Marquage obligatoire/optionnel

**Livrables :**
- ✅ Sélecteur d'ingrédients fonctionnel
- ✅ Sélecteur d'ustensiles fonctionnel
- ✅ Recherche en temps réel

### Jour 6 : Page de création complète

#### Journée complète : Intégration
**Priorité : CRITIQUE**

1. **`/app/(protected)/recettes/nouvelle/page.tsx`**
   ```typescript
   export default function NouvelleRecettePage() {
     const router = useRouter();
     const { createRecette } = useRecettes();
     const formHook = useRecetteForm({ mode: 'create' });
     
     const handleSubmit = async () => {
       try {
         const recette = await createRecette({
           recette: formHook.formData,
           ingredients: formHook.ingredients,
           ustensiles: formHook.ustensiles
         });
         
         router.push(`/recettes/${recette.id}`);
       } catch (error) {
         // Gestion d'erreur
       }
     };
     
     return (
       <div className="container mx-auto px-4 py-8">
         <RecetteForm
           {...formHook}
           onSubmit={handleSubmit}
           onCancel={() => router.back()}
         />
       </div>
     );
   }
   ```

2. **Tests d'intégration**
   - Flux complet de création
   - Validation des données
   - Gestion des erreurs

**Livrables :**
- ✅ Page de création complète
- ✅ Flux de création fonctionnel
- ✅ Tests d'intégration passants

## 🔍 Étape 3 : Recherche et catalogue (Jours 7-10)

### Jour 7 : API de recherche

#### Matin : Endpoint de recherche
**Priorité : HAUTE**

1. **`/api/recettes/search/route.ts`**
   - Recherche full-text
   - Filtres combinés
   - Agrégations pour facettes
   - Pagination optimisée

#### Après-midi : Hook de recherche
**Priorité : HAUTE**

1. **`useRecetteSearch.ts`**
   ```typescript
   export const useRecetteSearch = () => {
     const [query, setQuery] = useState('');
     const [filters, setFilters] = useState<RecetteFilters>({});
     const [results, setResults] = useState<RecetteComplete[]>([]);
     const [loading, setLoading] = useState(false);
     const [aggregations, setAggregations] = useState({});
     
     const debouncedSearch = useCallback(
       debounce(async (searchQuery: string, searchFilters: RecetteFilters) => {
         setLoading(true);
         try {
           const response = await fetch(buildSearchUrl(searchQuery, searchFilters));
           const data = await response.json();
           setResults(data.recettes);
           setAggregations(data.aggregations);
         } finally {
           setLoading(false);
         }
       }, 300),
       []
     );
     
     useEffect(() => {
       debouncedSearch(query, filters);
     }, [query, filters, debouncedSearch]);
     
     return {
       query,
       setQuery,
       filters,
       setFilters,
       results,
       loading,
       aggregations
     };
   };
   ```

**Livrables :**
- ✅ API de recherche performante
- ✅ Hook de recherche avec debounce
- ✅ Gestion du cache

### Jour 8 : Composants de recherche

#### Matin : SearchBar
**Priorité : HAUTE**

1. **`SearchBar.tsx`**
   - Barre de recherche avec suggestions
   - Historique des recherches
   - Recherches populaires

#### Après-midi : FilterPanel
**Priorité : HAUTE**

1. **`FilterPanel.tsx`**
   - Filtres par catégorie
   - Compteurs dynamiques
   - Interface responsive

**Livrables :**
- ✅ Barre de recherche interactive
- ✅ Panneau de filtres complet
- ✅ Interface responsive

### Jour 9 : Grille de résultats

#### Journée complète : RecetteGrid
**Priorité : HAUTE**

1. **`RecetteGrid.tsx`**
   ```typescript
   export const RecetteGrid = ({ 
     recettes, 
     loading, 
     layout = 'grid' 
   }: RecetteGridProps) => {
     const [page, setPage] = useState(1);
     const { ref, inView } = useInView();
     
     // Pagination infinie
     useEffect(() => {
       if (inView && !loading) {
         setPage(prev => prev + 1);
       }
     }, [inView, loading]);
     
     return (
       <div className={`grid ${
         layout === 'grid' 
           ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
           : 'grid-cols-1 gap-4'
       }`}>
         {recettes.map(recette => (
           <RecetteCard 
             key={recette.id} 
             recette={recette} 
             layout={layout}
           />
         ))}
         
         {loading && <RecettesSkeleton />}
         <div ref={ref} />
       </div>
     );
   };
   ```

2. **Options de tri et affichage**
   - Tri par pertinence, date, popularité
   - Vue grille/liste
   - Pagination infinie

**Livrables :**
- ✅ Grille de recettes responsive
- ✅ Pagination infinie
- ✅ Options de tri et affichage

### Jour 10 : Page catalogue

#### Journée complète : Interface complète
**Priorité : HAUTE**

1. **`/app/(protected)/recettes/catalogue/page.tsx`**
   ```typescript
   export default function CatalogueRecettesPage() {
     const searchHook = useRecetteSearch();
     const [layout, setLayout] = useState<'grid' | 'list'>('grid');
     
     return (
       <div className="container mx-auto px-4 py-8">
         <div className="flex flex-col lg:flex-row gap-8">
           {/* Sidebar filtres */}
           <aside className="lg:w-64">
             <FilterPanel
               filters={searchHook.filters}
               onFiltersChange={searchHook.setFilters}
               aggregations={searchHook.aggregations}
             />
           </aside>
           
           {/* Contenu principal */}
           <main className="flex-1">
             <div className="flex justify-between items-center mb-6">
               <SearchBar
                 query={searchHook.query}
                 onQueryChange={searchHook.setQuery}
               />
               
               <div className="flex items-center gap-2">
                 <SortSelect />
                 <LayoutToggle layout={layout} onLayoutChange={setLayout} />
               </div>
             </div>
             
             <RecetteGrid
               recettes={searchHook.results}
               loading={searchHook.loading}
               layout={layout}
             />
           </main>
         </div>
       </div>
     );
   }
   ```

**Livrables :**
- ✅ Page catalogue complète
- ✅ Recherche et filtres intégrés
- ✅ Interface responsive

## 🧩 Étape 4 : Finalisation (Jours 11-14)

### Jour 11 : Gestion des ingrédients personnalisés

#### Journée complète : Phase 2.3
**Priorité : MOYENNE**

1. **`/app/(protected)/ingredients/page.tsx`**
   - Liste des ingrédients personnalisés
   - Ajout/modification/suppression
   - Catégorisation automatique

2. **`IngredientManager.tsx`**
   - Interface de gestion complète
   - Import/export de listes
   - Suggestions intelligentes

**Livrables :**
- ✅ Gestion des ingrédients personnalisés
- ✅ Interface d'administration
- ✅ Fonctionnalités avancées

### Jour 12 : Page de détail et édition

#### Matin : Page de détail
**Priorité : HAUTE**

1. **`/app/(protected)/recettes/[id]/page.tsx`**
   - Affichage complet de la recette
   - Actions (modifier, supprimer, dupliquer)
   - Partage et export

#### Après-midi : Page d'édition
**Priorité : HAUTE**

1. **`/app/(protected)/recettes/[id]/modifier/page.tsx`**
   - Réutilisation du RecetteForm
   - Pré-remplissage des données
   - Gestion des modifications

**Livrables :**
- ✅ Page de détail complète
- ✅ Page d'édition fonctionnelle
- ✅ Actions avancées

### Jour 13 : Limitations freemium et optimisations

#### Matin : Limitations freemium
**Priorité : CRITIQUE**

1. **Composants de restriction**
   ```typescript
   export const RecetteCreationGate = ({ children }: { children: React.ReactNode }) => {
     const { hasProAccess } = useSubscription();
     const { recettes } = useRecettes();
     
     if (!hasProAccess && recettes.length >= 5) {
       return (
         <UpgradePrompt
           title="Limite de recettes atteinte"
           description="Vous avez créé 5 recettes. Passez au plan Pro pour en créer plus."
           feature="Recettes illimitées"
         />
       );
     }
     
     return <>{children}</>;
   };
   ```

2. **Vérifications côté serveur**
   - Validation des limites dans les API
   - Messages d'erreur appropriés
   - Redirections vers pricing

#### Après-midi : Optimisations
**Priorité : HAUTE**

1. **Performance**
   - Lazy loading des composants
   - Optimisation des requêtes
   - Cache intelligent

2. **SEO et accessibilité**
   - Meta tags dynamiques
   - Alt texts pour images
   - Navigation au clavier

**Livrables :**
- ✅ Limitations freemium appliquées
- ✅ Optimisations de performance
- ✅ Accessibilité améliorée

### Jour 14 : Tests et documentation

#### Matin : Tests complets
**Priorité : CRITIQUE**

1. **Tests E2E**
   ```typescript
   // tests/e2e/recettes.spec.ts
   test('Création complète d\'une recette', async ({ page }) => {
     await page.goto('/recettes/nouvelle');
     
     // Étape 1 : Informations générales
     await page.fill('[data-testid="nom"]', 'Pâtes à la carbonara');
     await page.fill('[data-testid="description"]', 'Recette traditionnelle italienne');
     await page.click('[data-testid="next-step"]');
     
     // Étape 2 : Ingrédients
     await page.fill('[data-testid="ingredient-search"]', 'pâtes');
     await page.click('[data-testid="ingredient-pates"]');
     await page.fill('[data-testid="quantite-0"]', '400');
     await page.click('[data-testid="next-step"]');
     
     // ... autres étapes
     
     await page.click('[data-testid="submit"]');
     await expect(page).toHaveURL(/\/recettes\/[a-z0-9-]+$/);
   });
   ```

2. **Tests de performance**
   - Lighthouse CI
   - Tests de charge
   - Métriques Core Web Vitals

#### Après-midi : Documentation
**Priorité : MOYENNE**

1. **Documentation utilisateur**
   - Guide de création de recettes
   - FAQ
   - Tutoriels vidéo

2. **Documentation technique**
   - API documentation
   - Guide de contribution
   - Architecture overview

**Livrables :**
- ✅ Suite de tests complète
- ✅ Performance validée
- ✅ Documentation à jour

## 📊 Métriques de succès

### Critères d'acceptation Phase 2

#### Phase 2.1 ✅
- [ ] Création de recette complète en moins de 5 minutes
- [ ] Validation en temps réel sans erreurs
- [ ] Sauvegarde automatique fonctionnelle
- [ ] Limitations freemium respectées
- [ ] Interface responsive sur tous devices

#### Phase 2.2 ✅
- [ ] Recherche retourne des résultats en moins de 500ms
- [ ] Filtres combinables sans conflit
- [ ] Pagination infinie fluide
- [ ] 0 erreur JavaScript en production
- [ ] Score Lighthouse > 90

#### Phase 2.3 ✅
- [ ] Ajout d'ingrédient personnalisé en moins de 30 secondes
- [ ] Conversion d'unités précise
- [ ] Suggestions pertinentes (>80% d'adoption)
- [ ] Import/export sans perte de données
- [ ] Performance maintenue avec 1000+ ingrédients

### Métriques techniques

```typescript
// Métriques à surveiller
const PERFORMANCE_TARGETS = {
  // Temps de réponse API
  apiResponseTime: 500, // ms
  
  // Temps de chargement pages
  pageLoadTime: 2000, // ms
  
  // Taille des bundles
  bundleSize: 500, // KB
  
  // Métriques Core Web Vitals
  LCP: 2.5, // secondes
  FID: 100, // ms
  CLS: 0.1, // score
  
  // Couverture de tests
  testCoverage: 80 // %
};
```

## 🚀 Déploiement et rollout

### Stratégie de déploiement

1. **Feature flags**
   - Activation progressive par utilisateur
   - A/B testing sur les nouvelles fonctionnalités
   - Rollback rapide en cas de problème

2. **Monitoring**
   - Alertes sur les erreurs
   - Métriques de performance en temps réel
   - Feedback utilisateur intégré

3. **Communication**
   - Annonce des nouvelles fonctionnalités
   - Tutoriels et guides
   - Support utilisateur renforcé

---

Ce plan d'implémentation garantit une livraison progressive de valeur tout en maintenant la qualité et la performance de l'application. Chaque étape est testable et peut être déployée indépendamment.