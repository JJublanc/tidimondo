'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Grid, List, AlertCircle, Home, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RecetteCard } from '@/components/recettes/RecetteCard';
import { useRecettes } from '@/hooks/useRecettes';
import { useSubscription } from '@/hooks/useSubscription';
import { useDebounce } from '@/hooks/useDebounce';
import type { RecetteComplete, DifficulteRecette, TypeRepas, RegimeAlimentaire } from '@/types/tidimondo';

export default function RecettesPage() {
  const { recettes, loading, error, deleteRecette, fetchRecettes } = useRecettes();
  const { hasProAccess } = useSubscription();
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // États des filtres
  const [filters, setFilters] = useState({
    difficulte: '' as string,
    temps_max: '' as string,
    type_repas: '' as string,
    regime_alimentaire: '' as string,
    sort: 'created_at',
    order: 'desc' as 'asc' | 'desc'
  });

  const debouncedSearch = useDebounce(searchQuery, 500);

  // Appliquer les filtres quand ils changent
  useEffect(() => {
    const activeFilters: any = {};
    
    if (debouncedSearch) activeFilters.search = debouncedSearch;
    if (filters.difficulte) activeFilters.difficulte = parseInt(filters.difficulte);
    if (filters.temps_max) activeFilters.temps_max = parseInt(filters.temps_max);
    if (filters.type_repas) activeFilters.type_repas = filters.type_repas;
    if (filters.regime_alimentaire) activeFilters.regime_alimentaire = filters.regime_alimentaire;
    if (filters.sort) activeFilters.sort = filters.sort;
    if (filters.order) activeFilters.order = filters.order;

    fetchRecettes(activeFilters);
  }, [debouncedSearch, filters, fetchRecettes]);

  // Réinitialiser les filtres
  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      difficulte: '',
      temps_max: '',
      type_repas: '',
      regime_alimentaire: '',
      sort: 'created_at',
      order: 'desc'
    });
  };

  // Compter les filtres actifs
  const activeFiltersCount = Object.values(filters).filter(value => value && value !== 'created_at' && value !== 'desc').length + (searchQuery ? 1 : 0);

  const handleDeleteRecette = async (recetteId: string) => {
    const recette = recettes.find(r => r.id === recetteId);
    if (!recette) return;
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la recette "${recette.nom}" ?`)) {
      try {
        await deleteRecette(recetteId);
        // Recharger les recettes après suppression
        fetchRecettes();
      } catch (error) {
        console.error('Erreur suppression recette:', error);
      }
    }
  };

  // Vérifier les limitations freemium
  const canCreateRecette = hasProAccess || recettes.length < 5;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mes Recettes</h1>
              <p className="text-gray-600 mt-1">
                Gérez vos recettes personnalisées
                {!hasProAccess && (
                  <span className="text-sm text-orange-600 ml-2">
                    ({recettes.length}/5 recettes utilisées)
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              
              {canCreateRecette ? (
                <Link href="/recettes/nouvelle">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle recette
                  </Button>
                </Link>
              ) : (
                <div className="relative">
                  <Button disabled className="opacity-50">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle recette
                  </Button>
                  <div className="absolute -top-2 -right-2">
                    <Link href="/pricing">
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-xs px-2 py-1">
                        Pro
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Limitation freemium banner */}
      {!hasProAccess && recettes.length >= 5 && (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mx-4 mt-4 rounded-r-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-orange-400 mr-3" />
            <div className="flex-1">
              <p className="text-sm text-orange-700">
                <strong>Limite atteinte :</strong> Vous avez créé 5 recettes (limite du plan gratuit).
              </p>
              <p className="text-sm text-orange-600 mt-1">
                Passez au plan Pro pour créer des recettes illimitées et débloquer toutes les fonctionnalités.
              </p>
            </div>
            <Link href="/pricing">
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 ml-4">
                Passer au Pro
              </Button>
            </Link>
          </div>
        </div>
      )}

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
                placeholder="Rechercher une recette..."
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
              
              <div className="flex items-center border border-gray-300 rounded-lg">
                <Button
                  variant={layout === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setLayout('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={layout === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setLayout('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Filtres avancés */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900">Filtres avancés</h3>
                <div className="flex items-center gap-2">
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Effacer ({activeFiltersCount})
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Difficulté */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Difficulté
                  </label>
                  <select
                    value={filters.difficulte}
                    onChange={(e) => setFilters(prev => ({ ...prev, difficulte: e.target.value }))}
                    className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Toutes</option>
                    <option value="1">⭐ Très facile</option>
                    <option value="2">⭐⭐ Facile</option>
                    <option value="3">⭐⭐⭐ Moyen</option>
                    <option value="4">⭐⭐⭐⭐ Difficile</option>
                    <option value="5">⭐⭐⭐⭐⭐ Très difficile</option>
                  </select>
                </div>

                {/* Temps maximum */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Temps max (min)
                  </label>
                  <select
                    value={filters.temps_max}
                    onChange={(e) => setFilters(prev => ({ ...prev, temps_max: e.target.value }))}
                    className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tous</option>
                    <option value="15">≤ 15 min</option>
                    <option value="30">≤ 30 min</option>
                    <option value="60">≤ 1h</option>
                    <option value="120">≤ 2h</option>
                  </select>
                </div>

                {/* Type de repas */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Type de repas
                  </label>
                  <select
                    value={filters.type_repas}
                    onChange={(e) => setFilters(prev => ({ ...prev, type_repas: e.target.value }))}
                    className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tous</option>
                    <option value="petit_dejeuner">Petit déjeuner</option>
                    <option value="dejeuner">Déjeuner</option>
                    <option value="diner">Dîner</option>
                    <option value="collation">Collation</option>
                    <option value="apero">Apéro</option>
                  </select>
                </div>

                {/* Régime alimentaire */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Régime
                  </label>
                  <select
                    value={filters.regime_alimentaire}
                    onChange={(e) => setFilters(prev => ({ ...prev, regime_alimentaire: e.target.value }))}
                    className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tous</option>
                    <option value="vegetarien">Végétarien</option>
                    <option value="vegan">Vegan</option>
                    <option value="sans_gluten">Sans gluten</option>
                    <option value="sans_lactose">Sans lactose</option>
                    <option value="halal">Halal</option>
                    <option value="casher">Casher</option>
                  </select>
                </div>
              </div>

              {/* Tri */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Trier par
                </label>
                <div className="flex gap-2">
                  <select
                    value={filters.sort}
                    onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="created_at">Date de création</option>
                    <option value="nom">Nom</option>
                    <option value="difficulte">Difficulté</option>
                    <option value="temps_preparation">Temps de préparation</option>
                    <option value="portions">Nombre de portions</option>
                  </select>
                  <select
                    value={filters.order}
                    onChange={(e) => setFilters(prev => ({ ...prev, order: e.target.value as 'asc' | 'desc' }))}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="desc">Décroissant</option>
                    <option value="asc">Croissant</option>
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
            <span className="ml-3 text-gray-600">Chargement des recettes...</span>
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

        {/* Liste des recettes */}
        {!loading && !error && (
          <>
            {recettes.length === 0 ? (
              <div className="text-center py-12">
                {recettes.length === 0 ? (
                  // Aucune recette créée
                  <div>
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucune recette pour le moment
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Commencez par créer votre première recette personnalisée.
                    </p>
                    {canCreateRecette && (
                      <Link href="/recettes/nouvelle">
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Créer ma première recette
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  // Aucun résultat de recherche
                  <div>
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucune recette trouvée
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Essayez de modifier votre recherche ou créez une nouvelle recette.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setSearchQuery('')}
                    >
                      Effacer la recherche
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className={
                layout === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }>
              {recettes.map((recette) => (
                  <RecetteCard
                    key={recette.id}
                    recette={recette}
                    onDelete={handleDeleteRecette}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}