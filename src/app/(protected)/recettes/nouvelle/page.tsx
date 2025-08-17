'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Plus, Trash2, Clock, Users, ChefHat, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRecettes } from '@/hooks/useRecettes';
import { useIngredientSearch } from '@/hooks/useIngredients';
import { useDebounce } from '@/hooks/useDebounce';
import type {
  RecetteFormData,
  RecetteIngredientFormData,
  RecetteUstensileFormData,
  DifficulteRecette,
  Ingredient,
  Ustensile
} from '@/types/tidimondo';

// Type étendu pour l'affichage des ingrédients avec leurs données
type RecetteIngredientWithData = RecetteIngredientFormData & {
  ingredient?: Ingredient;
};

// Type étendu pour le formulaire avec ingrédients enrichis
type ExtendedRecetteFormData = Omit<RecetteFormData, 'ingredients'> & {
  ingredients: RecetteIngredientWithData[];
};

export default function NouvelleRecettePage() {
  const router = useRouter();
  const { createRecette, loading } = useRecettes();
  const { results: searchResults, search: searchIngredients } = useIngredientSearch();
  
  const [formData, setFormData] = useState<ExtendedRecetteFormData>({
    nom: '',
    description: '',
    instructions: '',
    temps_preparation: 30,
    temps_cuisson: 0,
    portions: 4,
    difficulte: 1,
    regime_alimentaire: [],
    type_repas: [],
    is_public: false,
    ingredients: [],
    ustensiles: []
  });

  const [ingredientSearch, setIngredientSearch] = useState('');
  const [ustensileSearch, setUstensileSearch] = useState('');
  const [filteredUstensiles, setFilteredUstensiles] = useState<Ustensile[]>([]);
  const [showCreateIngredientModal, setShowCreateIngredientModal] = useState(false);
  const [showCreateUstensileModal, setShowCreateUstensileModal] = useState(false);
  const [newIngredientData, setNewIngredientData] = useState({
    nom: '',
    categorie: 'autre',
    unite_base: 'piece' as const,
    saison: [] as string[],
    allergenes: [] as string[],
    regime_alimentaire: [] as string[]
  });
  const [newUstensileData, setNewUstensileData] = useState({
    nom: '',
    categorie: 'autre' as const,
    description: ''
  });
  const [ustensiles, setUstensiles] = useState<Ustensile[]>([]);
  const debouncedSearch = useDebounce(ingredientSearch, 300);

  // Recherche d'ingrédients avec debounce
  useEffect(() => {
    if (debouncedSearch && debouncedSearch.length > 2) {
      searchIngredients(debouncedSearch);
    }
  }, [debouncedSearch, searchIngredients]);

  // Charger les ustensiles existants
  useEffect(() => {
    const fetchUstensiles = async () => {
      try {
        const response = await fetch('/api/ustensiles');
        if (response.ok) {
          const result = await response.json();
          // L'API retourne { success: true, data: { ustensiles: [...], ustensilesGroupes: {...}, pagination: {...} } }
          const ustensilesList = Array.isArray(result) ? result : (result.data?.ustensiles || []);
          setUstensiles(ustensilesList);
          setFilteredUstensiles(ustensilesList);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des ustensiles:', error);
      }
    };
    fetchUstensiles();
  }, []);

  // Filtrer les ustensiles selon la recherche
  useEffect(() => {
    if (!Array.isArray(ustensiles)) {
      setFilteredUstensiles([]);
      return;
    }
    
    if (ustensileSearch.trim() === '') {
      setFilteredUstensiles(ustensiles);
    } else {
      const filtered = ustensiles.filter(ustensile =>
        ustensile.nom.toLowerCase().includes(ustensileSearch.toLowerCase())
      );
      setFilteredUstensiles(filtered);
    }
  }, [ustensileSearch, ustensiles]);

  // Créer un nouvel ingrédient
  const createNewIngredient = async () => {
    if (!newIngredientData.nom.trim()) {
      alert('Le nom de l\'ingrédient est obligatoire');
      return;
    }

    try {
      const response = await fetch('/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIngredientData)
      });

      if (response.ok) {
        const result = await response.json();
        // Ajouter l'ingrédient créé à la recette
        addIngredient(result.data.ingredient);
        // Réinitialiser le modal
        setNewIngredientData({
          nom: '',
          categorie: 'autre',
          unite_base: 'piece' as const,
          saison: [],
          allergenes: [],
          regime_alimentaire: []
        });
        setShowCreateIngredientModal(false);
      } else if (response.status === 409) {
        // Ingrédient existe déjà
        const error = await response.json();
        const confirmUse = confirm(
          `L'ingrédient "${newIngredientData.nom}" existe déjà. Voulez-vous l'utiliser dans votre recette ?`
        );
        
        if (confirmUse && error.existing) {
          // Ajouter l'ingrédient existant à la recette
          addIngredient(error.existing);
          // Réinitialiser le modal
          setNewIngredientData({
            nom: '',
            categorie: 'autre',
            unite_base: 'piece' as const,
            saison: [],
            allergenes: [],
            regime_alimentaire: []
          });
          setShowCreateIngredientModal(false);
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Erreur lors de la création de l\'ingrédient');
      }
    } catch (error) {
      console.error('Erreur création ingrédient:', error);
      alert('Erreur lors de la création de l\'ingrédient');
    }
  };

  // Créer un nouvel ustensile
  const createNewUstensile = async () => {
    if (!newUstensileData.nom.trim()) {
      alert('Le nom de l\'ustensile est obligatoire');
      return;
    }

    try {
      const response = await fetch('/api/ustensiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUstensileData)
      });

      if (response.ok) {
        const ustensile = await response.json();
        // Ajouter l'ustensile créé à la recette
        addUstensileFromList(ustensile);
        // Mettre à jour la liste des ustensiles
        setUstensiles(prev => [...prev, ustensile]);
        // Réinitialiser le modal
        setNewUstensileData({
          nom: '',
          categorie: 'autre' as const,
          description: ''
        });
        setShowCreateUstensileModal(false);
      } else if (response.status === 409) {
        // Ustensile existe déjà
        const error = await response.json();
        const confirmUse = confirm(
          `L'ustensile "${newUstensileData.nom}" existe déjà. Voulez-vous l'utiliser dans votre recette ?`
        );
        
        if (confirmUse && error.existing) {
          // Ajouter l'ustensile existant à la recette
          addUstensileFromList(error.existing);
          // Réinitialiser le modal
          setNewUstensileData({
            nom: '',
            categorie: 'autre' as const,
            description: ''
          });
          setShowCreateUstensileModal(false);
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Erreur lors de la création de l\'ustensile');
      }
    } catch (error) {
      console.error('Erreur création ustensile:', error);
      alert('Erreur lors de la création de l\'ustensile');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation côté client
    if (!formData.nom.trim()) {
      alert('Le nom de la recette est obligatoire');
      return;
    }
    
    if (!formData.instructions.trim() || formData.instructions.trim().length < 10) {
      alert('Les instructions doivent contenir au moins 10 caractères');
      return;
    }

    try {
      // Nettoyer les données des ingrédients pour l'API (enlever les données d'affichage)
      const cleanIngredients: RecetteIngredientFormData[] = formData.ingredients.map(ing => ({
        ingredient_id: ing.ingredient_id,
        quantite: ing.quantite,
        unite: ing.unite,
        optionnel: ing.optionnel || false,
        ordre_affichage: ing.ordre_affichage
      }));
      
      await createRecette({
        recette: formData,
        ingredients: cleanIngredients,
        ustensiles: formData.ustensiles
      });
      router.push('/recettes');
    } catch (error) {
      console.error('Erreur création recette:', error);
      alert('Erreur lors de la création de la recette');
    }
  };

  const addIngredient = (ingredient: Ingredient) => {
    // Vérifier si l'ingrédient n'est pas déjà ajouté
    const isAlreadyAdded = formData.ingredients.some(ing => ing.ingredient_id === ingredient.id);
    if (isAlreadyAdded) {
      alert('Cet ingrédient est déjà dans la liste');
      return;
    }

    const newIngredient: RecetteIngredientWithData = {
      ingredient_id: ingredient.id,
      quantite: 1,
      unite: 'piece',
      optionnel: false,
      ordre_affichage: formData.ingredients.length + 1,
      ingredient: ingredient // Stocker les données de l'ingrédient pour l'affichage
    };
    
    setFormData((prev: ExtendedRecetteFormData) => ({
      ...prev,
      ingredients: [...prev.ingredients, newIngredient]
    }));
    setIngredientSearch('');
  };

  const removeIngredient = (index: number) => {
    setFormData((prev: ExtendedRecetteFormData) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_: RecetteIngredientWithData, i: number) => i !== index)
    }));
  };

  const updateIngredient = (index: number, field: keyof RecetteIngredientFormData, value: any) => {
    setFormData((prev: ExtendedRecetteFormData) => ({
      ...prev,
      ingredients: prev.ingredients.map((ing: RecetteIngredientWithData, i: number) =>
        i === index ? { ...ing, [field]: value } : ing
      )
    }));
  };

  const addUstensileFromList = (ustensile: Ustensile) => {
    // Vérifier si l'ustensile n'est pas déjà ajouté
    const isAlreadyAdded = formData.ustensiles.some(ust => ust.ustensile_id === ustensile.id);
    if (isAlreadyAdded) {
      alert('Cet ustensile est déjà dans la liste');
      return;
    }

    const newUstensile: RecetteUstensileFormData = {
      ustensile_id: ustensile.id,
      obligatoire: true
    };
    
    setFormData((prev: ExtendedRecetteFormData) => ({
      ...prev,
      ustensiles: [...prev.ustensiles, newUstensile]
    }));
    setUstensileSearch('');
  };

  // Obtenir le nom d'un ustensile par son ID
  const getUstensileNom = (ustensileId: string) => {
    const ustensile = ustensiles.find(u => u.id === ustensileId);
    return ustensile?.nom || 'Ustensile inconnu';
  };

  const removeUstensile = (index: number) => {
    setFormData((prev: ExtendedRecetteFormData) => ({
      ...prev,
      ustensiles: prev.ustensiles.filter((_: RecetteUstensileFormData, i: number) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <Link href="/recettes">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour aux recettes
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Nouvelle recette</h1>
                <p className="text-gray-600 mt-1">Créez votre recette personnalisée</p>
              </div>
            </div>
            
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informations de base */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la recette *
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData((prev: ExtendedRecetteFormData) => ({ ...prev, nom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Tarte aux pommes de grand-mère"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData((prev: ExtendedRecetteFormData) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Décrivez votre recette..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Temps de préparation (min)
                </label>
                <input
                  type="number"
                  value={formData.temps_preparation}
                  onChange={(e) => setFormData((prev: ExtendedRecetteFormData) => ({ ...prev, temps_preparation: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Temps de cuisson (min)
                </label>
                <input
                  type="number"
                  value={formData.temps_cuisson}
                  onChange={(e) => setFormData((prev: ExtendedRecetteFormData) => ({ ...prev, temps_cuisson: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="h-4 w-4 inline mr-1" />
                  Nombre de personnes
                </label>
                <input
                  type="number"
                  value={formData.portions}
                  onChange={(e) => setFormData((prev: ExtendedRecetteFormData) => ({ ...prev, portions: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ChefHat className="h-4 w-4 inline mr-1" />
                  Difficulté
                </label>
                <select
                  value={formData.difficulte}
                  onChange={(e) => setFormData((prev: ExtendedRecetteFormData) => ({ ...prev, difficulte: parseInt(e.target.value) as DifficulteRecette }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="1">Très facile</option>
                  <option value="2">Facile</option>
                  <option value="3">Moyen</option>
                  <option value="4">Difficile</option>
                  <option value="5">Très difficile</option>
                </select>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h2>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData((prev: ExtendedRecetteFormData) => ({ ...prev, instructions: e.target.value }))}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Décrivez étape par étape comment réaliser cette recette... (minimum 10 caractères)"
              required
            />
          </div>

          {/* Ingrédients */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ingrédients</h2>
            
            {/* Ajouter un ingrédient */}
            <div className="mb-4">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={ingredientSearch}
                  onChange={(e) => setIngredientSearch(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Rechercher un ingrédient..."
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateIngredientModal(true)}
                  className="whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer
                </Button>
              </div>
              
              {/* Résultats de recherche */}
              {ingredientSearch.length > 2 && (
                <div className="mt-2 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    searchResults.map((ingredient: Ingredient) => (
                      <button
                        key={ingredient.id}
                        type="button"
                        onClick={() => addIngredient(ingredient)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="font-medium">{ingredient.nom}</div>
                        {ingredient.categorie && (
                          <div className="text-sm text-gray-500 capitalize">{ingredient.categorie}</div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500 text-sm">
                      Aucun ingrédient trouvé pour "{ingredientSearch}"
                      <button
                        type="button"
                        onClick={() => {
                          setNewIngredientData(prev => ({ ...prev, nom: ingredientSearch }));
                          setShowCreateIngredientModal(true);
                        }}
                        className="block mt-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Créer "{ingredientSearch}" comme nouvel ingrédient
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Liste des ingrédients */}
            <div className="space-y-3">
              {formData.ingredients.map((ingredient: RecetteIngredientWithData, index: number) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <span className="font-medium">
                      {ingredient.ingredient?.nom || `Ingrédient ${index + 1}`}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={ingredient.quantite}
                    onChange={(e) => updateIngredient(index, 'quantite', parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    min="0"
                    step="0.1"
                  />
                  <select
                    value={ingredient.unite}
                    onChange={(e) => updateIngredient(index, 'unite', e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="piece">pièce</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="cuillere_soupe">c. à s.</option>
                    <option value="cuillere_cafe">c. à c.</option>
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeIngredient(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Ustensiles */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ustensiles</h2>
            
            {/* Ajouter un ustensile */}
            <div className="mb-4">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={ustensileSearch}
                  onChange={(e) => setUstensileSearch(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Rechercher un ustensile..."
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateUstensileModal(true)}
                  className="whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer
                </Button>
              </div>
              
              {/* Résultats de recherche d'ustensiles */}
              {ustensileSearch.length > 0 && (
                <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto mb-2">
                  {filteredUstensiles.length > 0 ? (
                    filteredUstensiles.map((ustensile: Ustensile) => (
                      <button
                        key={ustensile.id}
                        type="button"
                        onClick={() => addUstensileFromList(ustensile)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="font-medium">{ustensile.nom}</div>
                        {ustensile.description && (
                          <div className="text-sm text-gray-500">{ustensile.description}</div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500 text-sm">
                      Aucun ustensile trouvé pour "{ustensileSearch}"
                      <button
                        type="button"
                        onClick={() => {
                          setNewUstensileData(prev => ({ ...prev, nom: ustensileSearch }));
                          setShowCreateUstensileModal(true);
                        }}
                        className="block mt-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Créer "{ustensileSearch}" comme nouvel ustensile
                      </button>
                    </div>
                  )}
                </div>
              )}
              
            </div>
            
            {/* Liste des ustensiles */}
            <div className="space-y-2">
              {formData.ustensiles.map((ustensile: RecetteUstensileFormData, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{getUstensileNom(ustensile.ustensile_id)}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeUstensile(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/recettes">
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Création...' : 'Créer la recette'}
            </Button>
          </div>
        </form>
      </div>

      {/* Modal de création d'ingrédient */}
      {showCreateIngredientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Créer un nouvel ingrédient</h3>
              <button
                type="button"
                onClick={() => setShowCreateIngredientModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'ingrédient *
                </label>
                <input
                  type="text"
                  value={newIngredientData.nom}
                  onChange={(e) => setNewIngredientData(prev => ({ ...prev, nom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Tomate"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  value={newIngredientData.categorie}
                  onChange={(e) => setNewIngredientData(prev => ({ ...prev, categorie: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="legume">Légume</option>
                  <option value="fruit">Fruit</option>
                  <option value="viande">Viande</option>
                  <option value="poisson">Poisson</option>
                  <option value="feculent">Féculent</option>
                  <option value="produit_laitier">Produit laitier</option>
                  <option value="epice">Épice</option>
                  <option value="condiment">Condiment</option>
                  <option value="boisson">Boisson</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unité de base *
                </label>
                <select
                  value={newIngredientData.unite_base}
                  onChange={(e) => setNewIngredientData(prev => ({ ...prev, unite_base: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="piece">Pièce</option>
                  <option value="g">Gramme</option>
                  <option value="kg">Kilogramme</option>
                  <option value="ml">Millilitre</option>
                  <option value="l">Litre</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Saisons (optionnel)
                </label>
                <div className="space-y-2">
                  {['printemps', 'ete', 'automne', 'hiver'].map((saison) => (
                    <label key={saison} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newIngredientData.saison.includes(saison)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewIngredientData(prev => ({
                              ...prev,
                              saison: [...prev.saison, saison]
                            }));
                          } else {
                            setNewIngredientData(prev => ({
                              ...prev,
                              saison: prev.saison.filter(s => s !== saison)
                            }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="capitalize">{saison === 'ete' ? 'Été' : saison}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Allergènes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allergènes
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'gluten', label: 'Gluten' },
                    { value: 'lactose', label: 'Lactose' },
                    { value: 'oeuf', label: 'Œuf' },
                    { value: 'arachide', label: 'Arachide' },
                    { value: 'fruits_coque', label: 'Fruits à coque' },
                    { value: 'soja', label: 'Soja' },
                    { value: 'poisson', label: 'Poisson' },
                    { value: 'crustace', label: 'Crustacé' }
                  ].map((allergene) => (
                    <label key={allergene.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newIngredientData.allergenes.includes(allergene.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewIngredientData(prev => ({
                              ...prev,
                              allergenes: [...prev.allergenes, allergene.value]
                            }));
                          } else {
                            setNewIngredientData(prev => ({
                              ...prev,
                              allergenes: prev.allergenes.filter(a => a !== allergene.value)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm text-gray-700">{allergene.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Régimes alimentaires compatibles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Régimes alimentaires compatibles
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'vegetarien', label: 'Végétarien' },
                    { value: 'vegan', label: 'Vegan' },
                    { value: 'sans_gluten', label: 'Sans gluten' },
                    { value: 'sans_lactose', label: 'Sans lactose' },
                    { value: 'halal', label: 'Halal' },
                    { value: 'casher', label: 'Casher' }
                  ].map((regime) => (
                    <label key={regime.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newIngredientData.regime_alimentaire.includes(regime.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewIngredientData(prev => ({
                              ...prev,
                              regime_alimentaire: [...prev.regime_alimentaire, regime.value]
                            }));
                          } else {
                            setNewIngredientData(prev => ({
                              ...prev,
                              regime_alimentaire: prev.regime_alimentaire.filter(r => r !== regime.value)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm text-gray-700">{regime.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateIngredientModal(false)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={createNewIngredient}
              >
                Créer l'ingrédient
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de création d'ustensile */}
      {showCreateUstensileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Créer un nouvel ustensile</h3>
              <button
                type="button"
                onClick={() => setShowCreateUstensileModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'ustensile *
                </label>
                <input
                  type="text"
                  value={newUstensileData.nom}
                  onChange={(e) => setNewUstensileData(prev => ({ ...prev, nom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Fouet électrique"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  value={newUstensileData.categorie}
                  onChange={(e) => setNewUstensileData(prev => ({ ...prev, categorie: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cuisson">Cuisson</option>
                  <option value="preparation">Préparation</option>
                  <option value="service">Service</option>
                  <option value="mesure">Mesure</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optionnel)
                </label>
                <textarea
                  value={newUstensileData.description}
                  onChange={(e) => setNewUstensileData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Description de l'ustensile..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateUstensileModal(false)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={createNewUstensile}
              >
                Créer l'ustensile
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}