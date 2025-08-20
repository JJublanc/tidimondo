'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Home } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useSejour } from '@/hooks/useSejours';
import { useSejourRepas } from '@/hooks/useSejourRepas';
import { StatutSejour, TypeRepas, ListeCoursesContenu, ListeCoursesIngredient, CategorieIngredient } from '@/types/tidimondo';
import { Button } from '@/components/ui/button';

interface ListeCoursesData {
  contenu: ListeCoursesContenu;
  cout_total_estime: number;
  sejour: {
    id: string;
    nom: string;
    date_debut: string;
    date_fin: string;
    nombre_participants: number;
  };
}

const categorieLabels: Record<CategorieIngredient, string> = {
  'legume': '🥬 Légumes',
  'fruit': '🍎 Fruits',
  'viande': '🥩 Viandes',
  'poisson': '🐟 Poissons',
  'feculent': '🍞 Féculents',
  'produit_laitier': '🧀 Produits laitiers',
  'epice': '🌶️ Épices',
  'condiment': '🧂 Condiments',
  'boisson': '🥤 Boissons',
  'autre': '📦 Autres'
};

export default function SejourDetailPage() {
  const params = useParams();
  const sejourId = params.id as string;
  
  const { sejour, loading: sejourLoading, error: sejourError } = useSejour(sejourId);
  const { repas, getRepasGroupedByDate, getStatistiques } = useSejourRepas(sejourId);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'planning' | 'participants' | 'courses'>('overview');
  
  // État pour la liste de courses
  const [listeCoursesData, setListeCoursesData] = useState<ListeCoursesData | null>(null);
  const [loadingListeCourses, setLoadingListeCourses] = useState(false);
  const [errorListeCourses, setErrorListeCourses] = useState<string | null>(null);
  const [ingredientsModifies, setIngredientsModifies] = useState<Record<string, { quantite: number; unite: string }>>({});

  // Fonctions pour la liste de courses
  const fetchListeCourses = async () => {
    try {
      setLoadingListeCourses(true);
      setErrorListeCourses(null);
      const response = await fetch(`/api/sejours/${sejourId}/liste-courses`);
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de la liste de courses');
      }
      
      const result = await response.json();
      setListeCoursesData(result.data);
    } catch (err) {
      setErrorListeCourses(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoadingListeCourses(false);
    }
  };

  const updateQuantite = (ingredientId: string, nouvelleQuantite: number, unite: string) => {
    setIngredientsModifies(prev => ({
      ...prev,
      [ingredientId]: { quantite: nouvelleQuantite, unite }
    }));
  };

  const getQuantiteAffichee = (ingredient: ListeCoursesIngredient) => {
    const modif = ingredientsModifies[ingredient.ingredient_id];
    return modif ? modif.quantite : ingredient.quantite_totale;
  };

  const getUniteAffichee = (ingredient: ListeCoursesIngredient) => {
    const modif = ingredientsModifies[ingredient.ingredient_id];
    return modif ? modif.unite : ingredient.unite;
  };

  const exporterPDF = async () => {
    try {
      const response = await fetch(`/api/sejours/${sejourId}/liste-courses/export-pdf`);
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'export PDF');
      }
      
      const htmlContent = await response.text();
      
      // Ouvrir une nouvelle fenêtre avec le contenu HTML pour impression
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Attendre que le contenu soit chargé puis lancer l'impression
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (err) {
      console.error('Erreur lors de l\'export PDF:', err);
      alert('Erreur lors de l\'export PDF');
    }
  };

  // Charger la liste de courses quand l'onglet est activé
  useEffect(() => {
    if (activeTab === 'courses' && !listeCoursesData && !loadingListeCourses) {
      fetchListeCourses();
    }
  }, [activeTab, sejourId]);

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

  const getTypeRepasLabel = (type: TypeRepas) => {
    switch (type) {
      case 'petit_dejeuner':
        return 'Petit-déjeuner';
      case 'dejeuner':
        return 'Déjeuner';
      case 'diner':
        return 'Dîner';
      case 'collation':
        return 'Collation';
      case 'apero':
        return 'Apéro';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const calculateDuration = () => {
    if (!sejour) return 0;
    const debut = new Date(sejour.date_debut);
    const fin = new Date(sejour.date_fin);
    const diffTime = Math.abs(fin.getTime() - debut.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const generateDateRange = () => {
    if (!sejour) return [];
    const dates = [];
    const start = new Date(sejour.date_debut);
    const end = new Date(sejour.date_fin);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split('T')[0]);
    }
    return dates;
  };

  if (sejourLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Chargement du séjour...</div>
        </div>
      </div>
    );
  }

  if (sejourError || !sejour) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">
            {sejourError || 'Séjour non trouvé'}
          </div>
          <Link href="/sejours">
            <Button>Retour aux séjours</Button>
          </Link>
        </div>
      </div>
    );
  }

  const repasGroupes = getRepasGroupedByDate();
  const statistiques = getStatistiques();
  const dates = generateDateRange();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title={sejour.nom}
        backLink="/sejours"
        backText="Retour aux séjours"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <div className="flex items-center space-x-4 mb-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatutBadgeClass(sejour.statut)}`}>
                {getStatutLabel(sejour.statut)}
              </span>
            </div>
            <p className="text-gray-600">
              {formatDate(sejour.date_debut)} - {formatDate(sejour.date_fin)}
            </p>
            {sejour.lieu && (
              <p className="text-gray-600">📍 {sejour.lieu}</p>
            )}
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <Link href={`/sejours/${sejourId}/modifier`}>
              <Button variant="outline" className="bg-green-600 hover:bg-green-700 text-white border-green-600">
                Modifier
              </Button>
            </Link>
            <Link href={`/sejours/${sejourId}/planification`}>
              <Button className="bg-green-600 hover:bg-green-700">
                Planifier les repas
              </Button>
            </Link>
          </div>
        </div>

      {/* Navigation par onglets */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Vue d\'ensemble' },
            { id: 'planning', label: 'Planning des repas' },
            { id: 'participants', label: 'Participants' },
            { id: 'courses', label: 'Liste de courses' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            {/* Détails du séjour */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Détails du séjour</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Durée</div>
                  <div className="text-lg">{calculateDuration()} jour(s)</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Participants</div>
                  <div className="text-lg">{sejour.nombre_participants}</div>
                </div>
                {sejour.type_sejour && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">Type</div>
                    <div className="text-lg capitalize">{sejour.type_sejour}</div>
                  </div>
                )}
                {sejour.budget_prevu && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">Budget prévu</div>
                    <div className="text-lg">{sejour.budget_prevu}€</div>
                  </div>
                )}
              </div>
              {sejour.description && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-500 mb-2">Description</div>
                  <p className="text-gray-700">{sejour.description}</p>
                </div>
              )}
              {sejour.notes && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-500 mb-2">Notes</div>
                  <p className="text-gray-700">{sejour.notes}</p>
                </div>
              )}
            </div>

            {/* Aperçu des repas */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Aperçu des repas</h2>
                <Link href={`/sejours/${sejourId}/planification`}>
                  <Button variant="outline" size="sm">
                    Voir tout
                  </Button>
                </Link>
              </div>
              
              {repas.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">Aucun repas planifié</div>
                  <Link href={`/sejours/${sejourId}/planification`}>
                    <Button>Commencer la planification</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {dates.slice(0, 3).map((date) => {
                    const repasJour = repasGroupes[date] || [];
                    return (
                      <div key={date} className="border border-gray-200 rounded-lg p-3">
                        <div className="font-medium text-gray-900 mb-2">
                          {formatDate(date)}
                        </div>
                        {repasJour.length === 0 ? (
                          <div className="text-sm text-gray-500">Aucun repas planifié</div>
                        ) : (
                          <div className="space-y-1">
                            {repasJour.map((repas) => (
                              <div key={repas.id} className="flex justify-between items-center text-sm">
                                <span className="font-medium">{getTypeRepasLabel(repas.type_repas)}</span>
                                <span className="text-gray-600">
                                  {repas.recette?.nom || repas.repas_libre || 'Non défini'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {dates.length > 3 && (
                    <div className="text-center text-sm text-gray-500">
                      Et {dates.length - 3} jour(s) de plus...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Statistiques */}
          <div className="space-y-6">
            {/* Stats générales */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Statistiques</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Repas planifiés</span>
                  <span className="font-medium">{statistiques.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avec recette</span>
                  <span className="font-medium">{statistiques.avec_recette}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Repas libres</span>
                  <span className="font-medium">{statistiques.sans_recette}</span>
                </div>
                {statistiques.cout_total > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Coût estimé</span>
                    <span className="font-medium">{statistiques.cout_total.toFixed(2)}€</span>
                  </div>
                )}
              </div>
            </div>

            {/* Participants */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Participants</h2>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('participants')}>
                  Gérer
                </Button>
              </div>
              {sejour.participants.length === 0 ? (
                <div className="text-gray-500 text-sm">
                  Aucun participant ajouté
                </div>
              ) : (
                <div className="space-y-2">
                  {sejour.participants.slice(0, 3).map((participant) => (
                    <div key={participant.id} className="text-sm">
                      <div className="font-medium">{participant.nom}</div>
                      {participant.regime_alimentaire.length > 0 && (
                        <div className="text-gray-500 text-xs">
                          {participant.regime_alimentaire.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                  {sejour.participants.length > 3 && (
                    <div className="text-xs text-gray-500">
                      Et {sejour.participants.length - 3} autre(s)...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions rapides */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Actions rapides</h2>
              <div className="space-y-3">
                <Link href={`/sejours/${sejourId}/planification`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    📅 Planifier les repas
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setActiveTab('courses')}
                >
                  🛒 Voir liste de courses
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'planning' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Planning des repas</h2>
            <Link href={`/sejours/${sejourId}/planification`}>
              <Button>Modifier la planification</Button>
            </Link>
          </div>
          
          {repas.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">
                Aucun repas planifié pour ce séjour
              </div>
              <Link href={`/sejours/${sejourId}/planification`}>
                <Button>Commencer la planification</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {dates.map((date) => {
                const repasJour = repasGroupes[date] || [];
                return (
                  <div key={date} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-4">{formatDate(date)}</h3>
                    {repasJour.length === 0 ? (
                      <div className="text-gray-500 text-sm">Aucun repas planifié</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {repasJour.map((repas) => (
                          <div key={repas.id} className="border border-gray-100 rounded-lg p-3">
                            <div className="font-medium text-sm text-gray-900 mb-2">
                              {getTypeRepasLabel(repas.type_repas)}
                            </div>
                            <div className="text-sm text-gray-700">
                              {repas.recette?.nom || repas.repas_libre || 'Non défini'}
                            </div>
                            {repas.nombre_portions && (
                              <div className="text-xs text-gray-500 mt-1">
                                {repas.nombre_portions} portion(s)
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'participants' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Participants</h2>
            <Button disabled>Ajouter un participant</Button>
          </div>
          
          {sejour.participants.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">
                Aucun participant ajouté
              </div>
              <Button disabled>Ajouter le premier participant</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sejour.participants.map((participant) => (
                <div key={participant.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{participant.nom}</h3>
                      {participant.email && (
                        <p className="text-gray-600 text-sm">{participant.email}</p>
                      )}
                    </div>
                  </div>
                  
                  {(participant.regime_alimentaire.length > 0 || participant.allergies.length > 0) && (
                    <div className="mt-3 space-y-2">
                      {participant.regime_alimentaire.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Régimes : </span>
                          <span className="text-sm text-gray-600">
                            {participant.regime_alimentaire.join(', ')}
                          </span>
                        </div>
                      )}
                      {participant.allergies.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Allergies : </span>
                          <span className="text-sm text-red-600">
                            {participant.allergies.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {participant.preferences && (
                    <div className="mt-3">
                      <span className="text-sm font-medium text-gray-700">Préférences : </span>
                      <span className="text-sm text-gray-600">{participant.preferences}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="space-y-6">
          {loadingListeCourses ? (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Génération de la liste de courses...</p>
              </div>
            </div>
          ) : errorListeCourses ? (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-center py-12">
                <div className="text-red-600 text-xl mb-4">❌ Erreur</div>
                <p className="text-gray-600 mb-4">{errorListeCourses}</p>
                <Button onClick={fetchListeCourses}>
                  Réessayer
                </Button>
              </div>
            </div>
          ) : !listeCoursesData ? (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Liste de courses</h2>
                <Button onClick={fetchListeCourses}>
                  Générer la liste
                </Button>
              </div>
              
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-4">
                  Générez automatiquement votre liste de courses
                </div>
                <p className="text-gray-400 text-sm">
                  Basée sur votre planification de repas
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* En-tête avec résumé */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">📝 Liste de courses</h2>
                  <div className="flex space-x-3">
                    <Button onClick={fetchListeCourses} variant="outline">
                      🔄 Actualiser
                    </Button>
                    <Button
                      onClick={exporterPDF}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      📄 Export PDF
                    </Button>
                  </div>
                </div>

                {/* Résumé */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{listeCoursesData.contenu.resume.nombre_participants}</div>
                    <div className="text-sm text-gray-600">Participants</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{listeCoursesData.contenu.resume.nombre_repas}</div>
                    <div className="text-sm text-gray-600">Repas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{listeCoursesData.contenu.resume.nombre_recettes}</div>
                    <div className="text-sm text-gray-600">Recettes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{listeCoursesData.contenu.ingredients.length}</div>
                    <div className="text-sm text-gray-600">Ingrédients</div>
                  </div>
                </div>
              </div>

              {/* Liste des ingrédients par catégorie */}
              {Object.entries(listeCoursesData.contenu.categories).map(([categorie, ingredients]) => {
                if (!ingredients || ingredients.length === 0) return null;
                
                return (
                  <div key={categorie} className="bg-white rounded-lg shadow-sm border">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {categorieLabels[categorie as CategorieIngredient] || categorie}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {ingredients.length} ingrédient{ingredients.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    
                    <div className="p-4">
                      <div className="space-y-3">
                        {ingredients.map((ingredient) => (
                          <div
                            key={ingredient.ingredient_id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {ingredient.nom}
                              </div>
                              {ingredient.recettes_utilisees.length > 0 && (
                                <div className="text-sm text-gray-600 mt-1">
                                  Utilisé dans : {ingredient.recettes_utilisees.join(', ')}
                                </div>
                              )}
                              {ingredient.notes.length > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Notes : {ingredient.notes.join(', ')}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={getQuantiteAffichee(ingredient)}
                                onChange={(e) => updateQuantite(
                                  ingredient.ingredient_id,
                                  parseFloat(e.target.value) || 0,
                                  getUniteAffichee(ingredient)
                                )}
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-600 min-w-[3rem]">
                                {getUniteAffichee(ingredient)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
      </div>
    </div>
  );
}