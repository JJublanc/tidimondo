'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Clock, Users, ChefHat, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRecettes } from '@/hooks/useRecettes';
import type { RecetteComplete } from '@/types/tidimondo';

export default function RecetteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { deleteRecette } = useRecettes();
  const [recette, setRecette] = useState<RecetteComplete | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recetteId = params.id as string;

  useEffect(() => {
    const fetchRecette = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/recettes/${recetteId}`);
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Erreur lors de la récupération de la recette');
        }
        
        setRecette(data.data.recette);
      } catch (error) {
        console.error('Erreur récupération recette:', error);
        setError(error instanceof Error ? error.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    if (recetteId) {
      fetchRecette();
    }
  }, [recetteId]);

  const handleDelete = async () => {
    if (!recette) return;
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la recette "${recette.nom}" ?`)) {
      try {
        await deleteRecette(recette.id);
        router.push('/recettes');
      } catch (error) {
        console.error('Erreur suppression recette:', error);
        alert('Erreur lors de la suppression de la recette');
      }
    }
  };

  const getDifficultyStars = (difficulte?: number) => {
    if (!difficulte) return 'Non spécifiée';
    return '⭐'.repeat(difficulte);
  };

  const formatTime = (minutes?: number) => {
    if (!minutes) return 'Non spécifié';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Chargement de la recette...</span>
      </div>
    );
  }

  if (error || !recette) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="h-12 w-12 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Recette non trouvée
          </h3>
          <p className="text-gray-600 mb-6">
            {error || 'Cette recette n\'existe pas ou a été supprimée.'}
          </p>
          <Link href="/recettes">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux recettes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
                <h1 className="text-2xl font-bold text-gray-900">{recette.nom}</h1>
                <p className="text-gray-600 mt-1">Détails de la recette</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              
              <Link href={`/recettes/${recette.id}/modifier`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </Link>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {recette.description && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-700">{recette.description}</p>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h2>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{recette.instructions}</p>
              </div>
            </div>

            {/* Ingrédients */}
            {recette.ingredients && recette.ingredients.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Ingrédients ({recette.ingredients.length})
                </h2>
                <ul className="space-y-2">
                  {recette.ingredients
                    .sort((a: any, b: any) => a.ordre_affichage - b.ordre_affichage)
                    .map((ingredient: any, index: number) => (
                    <li key={ingredient.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-900">
                          {ingredient.ingredient?.nom || 'Ingrédient inconnu'}
                        </span>
                        {ingredient.optionnel && (
                          <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            optionnel
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {ingredient.quantite} {ingredient.unite}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Ustensiles */}
            {recette.ustensiles && recette.ustensiles.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Ustensiles ({recette.ustensiles.length})
                </h2>
                <ul className="space-y-2">
                  {recette.ustensiles.map((ustensile: any, index: number) => (
                    <li key={ustensile.id} className="flex items-center py-2">
                      <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900">
                        {ustensile.ustensile?.nom || 'Ustensile inconnu'}
                      </span>
                      {!ustensile.obligatoire && (
                        <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          optionnel
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar avec informations */}
          <div className="space-y-6">
            {/* Informations rapides */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Portions</div>
                    <div className="text-sm text-gray-600">{recette.portions} personnes</div>
                  </div>
                </div>

                <div className="flex items-center">
                  <ChefHat className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Difficulté</div>
                    <div className="text-sm text-gray-600">{getDifficultyStars(recette.difficulte || undefined)}</div>
                  </div>
                </div>

                {(recette.temps_preparation || recette.temps_cuisson) && (
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Temps</div>
                      <div className="text-sm text-gray-600">
                        {recette.temps_preparation && (
                          <div>Préparation: {formatTime(recette.temps_preparation)}</div>
                        )}
                        {recette.temps_cuisson && (
                          <div>Cuisson: {formatTime(recette.temps_cuisson)}</div>
                        )}
                        {recette.temps_preparation && recette.temps_cuisson && (
                          <div className="font-medium">
                            Total: {formatTime(recette.temps_preparation + recette.temps_cuisson)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Régimes et types */}
            {(recette.regime_alimentaire?.length > 0 || recette.type_repas?.length > 0) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Catégories</h3>
                
                {recette.type_repas && recette.type_repas.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-900 mb-2">Type de repas</div>
                    <div className="flex flex-wrap gap-2">
                      {recette.type_repas.map((type) => (
                        <span key={type} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {type.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {recette.regime_alimentaire && recette.regime_alimentaire.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-900 mb-2">Régime alimentaire</div>
                    <div className="flex flex-wrap gap-2">
                      {recette.regime_alimentaire.map((regime) => (
                        <span key={regime} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {regime.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes personnelles */}
            {recette.notes_personnelles && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes personnelles</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{recette.notes_personnelles}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}