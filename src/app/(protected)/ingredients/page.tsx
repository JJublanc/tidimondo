'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Edit, Trash2, Home, Package, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIngredients } from '@/hooks/useIngredients';
import { useDebounce } from '@/hooks/useDebounce';
import type { Ingredient, CategorieIngredient } from '@/types/tidimondo';

export default function IngredientsPage() {
  const { ingredients, loading, error, fetchIngredients, createIngredient } = useIngredients();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // États des filtres
  const [filters, setFilters] = useState({
    categorie: '' as string,
    saison: '' as string,
    allergenes: '' as string
  });

  const debouncedSearch = useDebounce(searchQuery, 500);

  // Appliquer les filtres quand ils changent
  useEffect(() => {
    const activeFilters: any = {};
    
    if (debouncedSearch) activeFilters.search = debouncedSearch;
    if (filters.categorie) activeFilters.categorie = filters.categorie;
    if (filters.saison) activeFilters.saison = filters.saison;
    if (filters.allergenes) activeFilters.allergenes = filters.allergenes;

    fetchIngredients(activeFilters);
  }, [debouncedSearch, filters, fetchIngredients]);

  // Réinitialiser les filtres
  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      categorie: '',
      saison: '',
      allergenes: ''
    });
  };

  // Compter les filtres actifs
  const activeFiltersCount = Object.values(filters).filter(value => value).length + (searchQuery ? 1 : 0);

  // Formulaire de création d'ingrédient
  const [newIngredient, setNewIngredient] = useState({
    nom: '',
    categorie: 'autre' as CategorieIngredient,
    unite_base: 'piece' as 'g' | 'kg' | 'ml' | 'l' | 'piece',
    prix_moyen: '',
    allergenes: [] as string[],
    regime_alimentaire: [] as string[],
    saison: [] as string[],
    description: ''
  });

  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newIngredient.nom.trim()) {
      alert('Le nom de l\'ingrédient est obligatoire');
      return;
    }

    try {
      const ingredientData = {
        ...newIngredient,
        prix_moyen: newIngredient.prix_moyen ? parseFloat(newIngredient.prix_moyen) : undefined
      };
      
      await createIngredient(ingredientData);
      
      // Réinitialiser le formulaire
      setNewIngredient({
        nom: '',
        categorie: 'autre',
        unite_base: 'piece',
        prix_moyen: '',
        allergenes: [],
        regime_alimentaire: [],
        saison: [],
        description: ''
      });
      
      setShowCreateForm(false);
      
      // Recharger la liste
      fetchIngredients();
    } catch (error) {
      console.error('Erreur création ingrédient:', error);
      alert('Erreur lors de la création de l\'ingrédient');
    }
  };

  const getCategorieColor = (categorie: string) => {
    const colors: Record<string, string> = {
      'legume': 'bg-green-100 text-green-800',
      'fruit': 'bg-orange-100 text-orange-800',
      'viande': 'bg-red-100 text-red-800',
      'poisson': 'bg-blue-100 text-blue-800',
      'feculent': 'bg-yellow-100 text-yellow-800',
      'produit_laitier': 'bg-purple-100 text-purple-800',
      'epice': 'bg-pink-100 text-pink-800',
      'condiment': 'bg-indigo-100 text-indigo-800',
      'boisson': 'bg-cyan-100 text-cyan-800',
      'autre': 'bg-gray-100 text-gray-800'
    };
    return colors[categorie] || colors['autre'];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mes Ingrédients</h1>
              <p className="text-gray-600 mt-1">
                Gérez votre base d'ingrédients personnalisés
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvel ingrédient
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Barre de recherche et filtres */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un ingrédient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={activeFiltersCount > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtres
                {activeFiltersCount > 0 && (
                  <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
          
          {/* Filtres avancés */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900">Filtres avancés</h3>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs"
                  >
                    Effacer ({activeFiltersCount})
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Catégorie */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={filters.categorie}
                    onChange={(e) => setFilters(prev => ({ ...prev, categorie: e.target.value }))}
                    className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Toutes</option>
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

                {/* Saison */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Saison
                  </label>
                  <select
                    value={filters.saison}
                    onChange={(e) => setFilters(prev => ({ ...prev, saison: e.target.value }))}
                    className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Toutes</option>
                    <option value="printemps">Printemps</option>
                    <option value="ete">Été</option>
                    <option value="automne">Automne</option>
                    <option value="hiver">Hiver</option>
                  </select>
                </div>

                {/* Allergènes */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Exclure allergènes
                  </label>
                  <select
                    value={filters.allergenes}
                    onChange={(e) => setFilters(prev => ({ ...prev, allergenes: e.target.value }))}
                    className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Aucun</option>
                    <option value="gluten">Gluten</option>
                    <option value="lactose">Lactose</option>
                    <option value="oeuf">Œuf</option>
                    <option value="arachide">Arachide</option>
                    <option value="fruits_coque">Fruits à coque</option>
                    <option value="soja">Soja</option>
                    <option value="poisson">Poisson</option>
                    <option value="crustace">Crustacé</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* États de chargement et d'erreur */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Chargement des ingrédients...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Liste des ingrédients */}
        {!loading && !error && (
          <>
            {ingredients.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun ingrédient trouvé
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || Object.values(filters).some(f => f) 
                    ? 'Aucun ingrédient ne correspond à vos critères de recherche.'
                    : 'Commencez par ajouter vos premiers ingrédients personnalisés.'
                  }
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un ingrédient
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {ingredients.map((ingredient: Ingredient) => (
                  <div key={ingredient.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 line-clamp-1">
                          {ingredient.nom}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Unité : {ingredient.unite_base}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button variant="outline" size="sm" className="p-1">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" className="p-1 text-red-600 hover:text-red-700">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Catégorie */}
                    {ingredient.categorie && (
                      <div className="mb-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategorieColor(ingredient.categorie)}`}>
                          {ingredient.categorie.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                    
                    {/* Prix */}
                    {ingredient.prix_moyen_euro && (
                      <p className="text-sm text-gray-600 mb-2">
                        Prix moyen : {ingredient.prix_moyen_euro}€
                      </p>
                    )}
                    
                    {/* Allergènes */}
                    {ingredient.allergenes && ingredient.allergenes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {ingredient.allergenes.slice(0, 2).map((allergene) => (
                          <span key={allergene} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-700">
                            {allergene}
                          </span>
                        ))}
                        {ingredient.allergenes.length > 2 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                            +{ingredient.allergenes.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Régimes alimentaires */}
                    {ingredient.regime_alimentaire && ingredient.regime_alimentaire.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {ingredient.regime_alimentaire.slice(0, 2).map((regime) => (
                          <span key={regime} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">
                            {regime.replace('_', ' ')}
                          </span>
                        ))}
                        {ingredient.regime_alimentaire.length > 2 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                            +{ingredient.regime_alimentaire.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Saisons */}
                    {ingredient.saison && ingredient.saison.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {ingredient.saison.slice(0, 2).map((saison) => (
                          <span key={saison} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                            {saison}
                          </span>
                        ))}
                        {ingredient.saison.length > 2 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                            +{ingredient.saison.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de création d'ingrédient */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Nouvel ingrédient
              </h2>
              
              <form onSubmit={handleCreateIngredient} className="space-y-4">
                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={newIngredient.nom}
                    onChange={(e) => setNewIngredient(prev => ({ ...prev, nom: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Tomate cerise"
                    required
                  />
                </div>

                {/* Catégorie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie *
                  </label>
                  <select
                    value={newIngredient.categorie}
                    onChange={(e) => setNewIngredient(prev => ({ ...prev, categorie: e.target.value as CategorieIngredient }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
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

                {/* Unité de base */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unité de base *
                  </label>
                  <select
                    value={newIngredient.unite_base}
                    onChange={(e) => setNewIngredient(prev => ({ ...prev, unite_base: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="piece">Pièce</option>
                    <option value="g">Gramme</option>
                    <option value="kg">Kilogramme</option>
                    <option value="ml">Millilitre</option>
                    <option value="l">Litre</option>
                  </select>
                </div>

                {/* Prix moyen */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix moyen (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newIngredient.prix_moyen}
                    onChange={(e) => setNewIngredient(prev => ({ ...prev, prix_moyen: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: 2.50"
                  />
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
                          checked={newIngredient.allergenes.includes(allergene.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewIngredient(prev => ({
                                ...prev,
                                allergenes: [...prev.allergenes, allergene.value]
                              }));
                            } else {
                              setNewIngredient(prev => ({
                                ...prev,
                                allergenes: prev.allergenes.filter(a => a !== allergene.value)
                              }));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{allergene.label}</span>
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
                          checked={newIngredient.regime_alimentaire.includes(regime.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewIngredient(prev => ({
                                ...prev,
                                regime_alimentaire: [...prev.regime_alimentaire, regime.value]
                              }));
                            } else {
                              setNewIngredient(prev => ({
                                ...prev,
                                regime_alimentaire: prev.regime_alimentaire.filter(r => r !== regime.value)
                              }));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{regime.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Saisons */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Saisons
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'printemps', label: 'Printemps' },
                      { value: 'ete', label: 'Été' },
                      { value: 'automne', label: 'Automne' },
                      { value: 'hiver', label: 'Hiver' }
                    ].map((saison) => (
                      <label key={saison.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newIngredient.saison.includes(saison.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewIngredient(prev => ({
                                ...prev,
                                saison: [...prev.saison, saison.value]
                              }));
                            } else {
                              setNewIngredient(prev => ({
                                ...prev,
                                saison: prev.saison.filter(s => s !== saison.value)
                              }));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{saison.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newIngredient.description}
                    onChange={(e) => setNewIngredient(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Description optionnelle..."
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit">
                    Créer l'ingrédient
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}