'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { useSejours } from '@/hooks/useSejours';
import { SejourFilters, StatutSejour, TypeSejour } from '@/types/tidimondo';
import { Button } from '@/components/ui/button';

export default function SejoursPage() {
  const [filters, setFilters] = useState<SejourFilters>({});
  const { sejours, loading, error, pagination, changePage, applyFilters, deleteSejour } = useSejours(filters);

  const handleFilterChange = (newFilters: Partial<SejourFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    applyFilters(updatedFilters);
  };

  const handleDeleteSejour = async (id: string, nom: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le séjour "${nom}" ? Cette action est irréversible.`)) {
      try {
        await deleteSejour(id);
      } catch (err) {
        alert('Erreur lors de la suppression du séjour');
      }
    }
  };

  const getStatutBadgeClass = (statut: StatutSejour) => {
    switch (statut) {
      case 'brouillon':
        return 'bg-gray-100 text-gray-800';
      case 'planifie':
        return 'bg-blue-100 text-blue-800';
      case 'en_cours':
        return 'bg-green-100 text-green-800';
      case 'termine':
        return 'bg-purple-100 text-purple-800';
      case 'annule':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatutLabel = (statut: StatutSejour) => {
    switch (statut) {
      case 'brouillon':
        return 'Brouillon';
      case 'planifie':
        return 'Planifié';
      case 'en_cours':
        return 'En cours';
      case 'termine':
        return 'Terminé';
      case 'annule':
        return 'Annulé';
      default:
        return statut;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const calculateDuration = (dateDebut: string, dateFin: string) => {
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    const diffTime = Math.abs(fin.getTime() - debut.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Chargement des séjours...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes Séjours</h1>
          <p className="text-gray-600 mt-2">
            Organisez et planifiez vos séjours avec leurs repas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <Link href="/sejours/nouveau">
            <Button className="bg-blue-600 hover:bg-blue-700">
              + Nouveau séjour
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Recherche */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recherche
            </label>
            <input
              type="text"
              placeholder="Nom du séjour..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange({ search: e.target.value || undefined })}
            />
          </div>

          {/* Statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.statut?.[0] || ''}
              onChange={(e) => handleFilterChange({ 
                statut: e.target.value ? [e.target.value as StatutSejour] : undefined 
              })}
            >
              <option value="">Tous les statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="planifie">Planifié</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
              <option value="annule">Annulé</option>
            </select>
          </div>

          {/* Type de séjour */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.type_sejour || ''}
              onChange={(e) => handleFilterChange({ 
                type_sejour: e.target.value as TypeSejour || undefined 
              })}
            >
              <option value="">Tous les types</option>
              <option value="weekend">Weekend</option>
              <option value="semaine">Semaine</option>
              <option value="court">Court</option>
              <option value="long">Long</option>
            </select>
          </div>

          {/* Bouton reset */}
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setFilters({});
                applyFilters({});
              }}
              className="w-full"
            >
              Réinitialiser
            </Button>
          </div>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Liste des séjours */}
      {sejours.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            Aucun séjour trouvé
          </div>
          <Link href="/sejours/nouveau">
            <Button>Créer votre premier séjour</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sejours.map((sejour) => (
            <div key={sejour.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* En-tête de la carte */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {sejour.nom}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatutBadgeClass(sejour.statut)}`}>
                      {getStatutLabel(sejour.statut)}
                    </span>
                  </div>
                </div>

                {/* Informations du séjour */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium">📅</span>
                    <span className="ml-2">
                      {formatDate(sejour.date_debut)} - {formatDate(sejour.date_fin)}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium">⏱️</span>
                    <span className="ml-2">
                      {calculateDuration(sejour.date_debut, sejour.date_fin)} jour(s)
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium">👥</span>
                    <span className="ml-2">
                      {sejour.nombre_participants} participant(s)
                    </span>
                  </div>
                  {sejour.lieu && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">📍</span>
                      <span className="ml-2">{sejour.lieu}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {sejour.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {sejour.description}
                  </p>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <Link href={`/sejours/${sejour.id}`}>
                    <Button variant="outline" size="sm">
                      Voir détails
                    </Button>
                  </Link>
                  <div className="flex space-x-2">
                    <Link href={`/sejours/${sejour.id}/modifier`}>
                      <Button variant="outline" size="sm">
                        Modifier
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSejour(sejour.id, sejour.nom)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 mt-8">
          <Button
            variant="outline"
            onClick={() => changePage(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Précédent
          </Button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} sur {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => changePage(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}