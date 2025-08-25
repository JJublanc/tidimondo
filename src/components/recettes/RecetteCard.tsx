'use client';

import Link from 'next/link';
import { Clock, Users, ChefHat, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RecetteComplete } from '@/types/tidimondo';

interface RecetteCardProps {
  recette: RecetteComplete;
  onDelete?: (id: string) => void;
}

export function RecetteCard({ recette, onDelete }: RecetteCardProps) {
  const getDifficultyText = (difficulte: number) => {
    switch (difficulte) {
      case 1: return 'Très facile';
      case 2: return 'Facile';
      case 3: return 'Moyen';
      case 4: return 'Difficile';
      case 5: return 'Très difficile';
      default: return 'Non défini';
    }
  };

  const getDifficultyColor = (difficulte: number) => {
    switch (difficulte) {
      case 1: return 'text-green-600 bg-green-100';
      case 2: return 'text-green-600 bg-green-100';
      case 3: return 'text-yellow-600 bg-yellow-100';
      case 4: return 'text-orange-600 bg-orange-100';
      case 5: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              <Link 
                href={`/recettes/${recette.id}`}
                className="hover:text-blue-600 transition-colors"
              >
                {recette.nom}
              </Link>
            </h3>
            {recette.description && (
              <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                {recette.description}
              </p>
            )}
          </div>
          
          <div className="flex gap-2 ml-4">
            <Link href={`/recettes/${recette.id}/modifier`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            {onDelete && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onDelete(recette.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{(recette.temps_preparation || 0) + (recette.temps_cuisson || 0)} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{recette.portions} pers.</span>
          </div>
          <div className="flex items-center gap-1">
            <ChefHat className="h-4 w-4" />
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recette.difficulte || 1)}`}>
              {getDifficultyText(recette.difficulte || 1)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {recette.ingredients?.length || 0} ingrédient{(recette.ingredients?.length || 0) > 1 ? 's' : ''}
            {recette.ustensiles?.length ? ` • ${recette.ustensiles.length} ustensile${recette.ustensiles.length > 1 ? 's' : ''}` : ''}
          </div>
          
          <Link href={`/recettes/${recette.id}`}>
            <Button variant="outline" size="sm">
              Voir la recette
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}