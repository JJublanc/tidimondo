'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { useSejour } from '@/hooks/useSejours';
import { useSejourRepas } from '@/hooks/useSejourRepas';
import { useRecettes } from '@/hooks/useRecettes';
import { TypeRepas, Recette, RepasComposition } from '@/types/tidimondo';
import { Button } from '@/components/ui/button';
import PetitDejeunerForm from '@/components/sejours/PetitDejeunerForm';
import RepasPrincipalForm from '@/components/sejours/RepasPrincipalForm';
import AccompagnementsForm from '@/components/sejours/AccompagnementsForm';

interface RepasFormData {
  recette_id?: string;
  date_repas: string;
  type_repas: TypeRepas;
  nombre_portions: number;
  notes?: string;
  repas_libre?: string;
  cout_estime?: number;
  ordre_dans_journee: number;
  composition?: RepasComposition;
}

export default function PlanificationPage() {
  const params = useParams();
  const sejourId = params.id as string;
  
  const { sejour, loading: sejourLoading } = useSejour(sejourId);
  const { repas, createRepas, updateRepas, deleteRepas, getRepasByDateAndType } = useSejourRepas(sejourId);
  const { recettes } = useRecettes();
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedType, setSelectedType] = useState<TypeRepas>('dejeuner');
  const [showRepasModal, setShowRepasModal] = useState(false);
  const [editingRepas, setEditingRepas] = useState<any>(null);
  const [searchRecette, setSearchRecette] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [repasForm, setRepasForm] = useState<RepasFormData>({
    date_repas: '',
    type_repas: 'dejeuner',
    nombre_portions: sejour?.nombre_participants || 1,
    ordre_dans_journee: 0,
    composition: undefined,
  });

  const typesRepas: { type: TypeRepas; label: string; ordre: number }[] = [
    { type: 'petit_dejeuner', label: 'Petit-déjeuner', ordre: 1 },
    { type: 'dejeuner', label: 'Déjeuner', ordre: 2 },
    { type: 'diner', label: 'Dîner', ordre: 3 },
    { type: 'collation', label: 'Collation', ordre: 4 },
    { type: 'apero', label: 'Apéro', ordre: 5 },
  ];

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const openRepasModal = (date: string, type: TypeRepas) => {
    const existingRepas = getRepasByDateAndType(date, type);
    const typeInfo = typesRepas.find(t => t.type === type);
    
    if (existingRepas) {
      setEditingRepas(existingRepas);
      setRepasForm({
        recette_id: existingRepas.recette_id || undefined,
        date_repas: existingRepas.date_repas,
        type_repas: existingRepas.type_repas,
        nombre_portions: existingRepas.nombre_portions,
        notes: existingRepas.notes || '',
        repas_libre: existingRepas.repas_libre || '',
        cout_estime: existingRepas.cout_estime || undefined,
        ordre_dans_journee: existingRepas.ordre_dans_journee,
        composition: existingRepas.composition || undefined,
      });
    } else {
      setEditingRepas(null);
      setRepasForm({
        date_repas: date,
        type_repas: type,
        nombre_portions: sejour?.nombre_participants || 1,
        ordre_dans_journee: typeInfo?.ordre || 0,
        notes: '',
        repas_libre: '',
        composition: undefined,
      });
    }
    
    setSelectedDate(date);
    setSelectedType(type);
    setShowRepasModal(true);
    setSearchRecette('');
    setError(null);
  };

  const closeRepasModal = () => {
    setShowRepasModal(false);
    setEditingRepas(null);
    setSearchRecette('');
    setError(null);
  };

  const handleSaveRepas = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validation selon le type de repas
      if (selectedType === 'petit_dejeuner') {
        if (!repasForm.composition?.petit_dejeuner?.ingredients?.length &&
            !repasForm.composition?.petit_dejeuner?.boissons?.length &&
            !repasForm.repas_libre?.trim()) {
          throw new Error('Veuillez ajouter des ingrédients/boissons ou saisir un repas libre');
        }
      } else if (['dejeuner', 'diner'].includes(selectedType)) {
        if (!repasForm.composition?.repas_principal?.entree &&
            !repasForm.composition?.repas_principal?.plat_principal &&
            !repasForm.composition?.repas_principal?.dessert &&
            !repasForm.recette_id &&
            !repasForm.repas_libre?.trim()) {
          throw new Error('Veuillez composer votre repas ou sélectionner une recette');
        }
      } else {
        // Pour collation et apéro, garder l'ancien système
        if (!repasForm.recette_id && !repasForm.repas_libre?.trim()) {
          throw new Error('Veuillez sélectionner une recette ou saisir un repas libre');
        }
      }

      if (editingRepas) {
        await updateRepas(editingRepas.id, repasForm);
      } else {
        await createRepas(repasForm);
      }
      
      closeRepasModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRepas = async () => {
    if (!editingRepas) return;
    
    if (confirm('Êtes-vous sûr de vouloir supprimer ce repas ?')) {
      try {
        await deleteRepas(editingRepas.id);
        closeRepasModal();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
      }
    }
  };

  const filteredRecettes = recettes.filter(recette => {
    // Filtrage par recherche textuelle
    const matchesSearch = recette.nom.toLowerCase().includes(searchRecette.toLowerCase()) ||
      recette.description?.toLowerCase().includes(searchRecette.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Filtrage par régimes alimentaires et allergènes des participants
    if (sejour?.participants && sejour.participants.length > 0) {
      // Récupérer tous les régimes alimentaires des participants
      const participantRegimes = sejour.participants.flatMap(p => p.regime_alimentaire || []);
      
      // Récupérer tous les allergènes des participants
      const participantAllergenes = sejour.participants.flatMap(p => p.allergies || []);
      
      // Vérification des régimes alimentaires
      if (participantRegimes.length > 0) {
        const recetteRegimes = recette.regime_alimentaire || [];
        
        // Si la recette n'a pas de régime spécifié, on considère qu'elle est "standard"
        if (recetteRegimes.length === 0) {
          // Une recette sans régime spécifié n'est compatible qu'avec les participants sans régime spécial
          if (participantRegimes.length > 0) return false;
        } else {
          // Vérifier que la recette couvre tous les régimes des participants
          if (!participantRegimes.every(regime => recetteRegimes.includes(regime))) {
            return false;
          }
        }
      }
      
      // Vérification des allergènes
      if (participantAllergenes.length > 0) {
        // Vérifier que la recette ne contient aucun ingrédient allergène
        const recetteIngredients = recette.ingredients || [];
        
        for (const recetteIngredient of recetteIngredients) {
          if (recetteIngredient.ingredient?.allergenes) {
            const ingredientAllergenes = recetteIngredient.ingredient.allergenes;
            
            // Si l'ingrédient contient un allergène d'un participant, exclure la recette
            if (ingredientAllergenes.some(allergene => participantAllergenes.includes(allergene))) {
              return false;
            }
          }
        }
      }
    }
    
    return true;
  });

  const getRepasForSlot = (date: string, type: TypeRepas) => {
    return getRepasByDateAndType(date, type);
  };

  if (sejourLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!sejour) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">Séjour non trouvé</div>
          <Link href="/sejours">
            <Button>Retour aux séjours</Button>
          </Link>
        </div>
      </div>
    );
  }

  const dates = generateDateRange();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planification des repas</h1>
          <p className="text-gray-600 mt-2">{sejour.nom}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <Link href={`/sejours/${sejourId}`}>
            <Button variant="outline">Retour au séjour</Button>
          </Link>
        </div>
      </div>

      {/* Informations sur le filtrage */}
      {sejour?.participants && sejour.participants.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            Filtrage automatique activé
          </h3>
          <div className="text-sm text-blue-700">
            {(() => {
              const participantRegimes = sejour.participants.flatMap(p => p.regime_alimentaire || []);
              const participantAllergenes = sejour.participants.flatMap(p => p.allergies || []);
              
              const messages = [];
              
              if (participantRegimes.length > 0) {
                messages.push(`Régimes alimentaires : ${participantRegimes.join(', ')}`);
              }
              
              if (participantAllergenes.length > 0) {
                messages.push(`Allergènes exclus : ${participantAllergenes.join(', ')}`);
              }
              
              if (messages.length === 0) {
                return "Aucune restriction alimentaire détectée.";
              }
              
              return (
                <div>
                  <p className="mb-1">Les recettes et ingrédients sont automatiquement filtrés selon :</p>
                  <ul className="list-disc list-inside space-y-1">
                    {messages.map((message, index) => (
                      <li key={index}>{message}</li>
                    ))}
                  </ul>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Calendrier de planification */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                {typesRepas.map((type) => (
                  <th key={type.type} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {type.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dates.map((date) => (
                <tr key={date} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(date)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </div>
                  </td>
                  {typesRepas.map((type) => {
                    const repas = getRepasForSlot(date, type.type);
                    return (
                      <td key={type.type} className="px-6 py-4">
                        <button
                          onClick={() => openRepasModal(date, type.type)}
                          className="w-full text-left p-3 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors min-h-[80px] flex flex-col justify-center"
                        >
                          {repas ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900 mb-1">
                                {repas.recette?.nom || repas.repas_libre}
                              </div>
                              <div className="text-xs text-gray-500">
                                {repas.nombre_portions} portion(s)
                              </div>
                              {repas.notes && (
                                <div className="text-xs text-gray-400 mt-1 truncate">
                                  {repas.notes}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400 text-center">
                              + Ajouter un repas
                            </div>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de gestion des repas */}
      {showRepasModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* En-tête du modal */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">
                    {editingRepas ? 'Modifier le repas' : 'Ajouter un repas'}
                  </h2>
                  <p className="text-gray-600">
                    {formatDate(selectedDate)} - {typesRepas.find(t => t.type === selectedType)?.label}
                  </p>
                </div>
                <button
                  onClick={closeRepasModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Message d'erreur */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                  <div className="text-red-800">{error}</div>
                </div>
              )}

              {/* Contenu selon le type de repas */}
              {selectedType === 'petit_dejeuner' ? (
                <div className="space-y-6">
                  {/* Composition du petit-déjeuner */}
                  <PetitDejeunerForm
                    composition={repasForm.composition?.petit_dejeuner}
                    nombreParticipants={sejour?.nombre_participants || 1}
                    participants={sejour?.participants || []}
                    onChange={(composition) => setRepasForm(prev => ({
                      ...prev,
                      composition: {
                        ...prev.composition,
                        petit_dejeuner: composition,
                      },
                    }))}
                  />
                  
                  {/* Option repas libre */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Ou repas libre</h3>
                    <input
                      type="text"
                      placeholder="Ex: Petit-déjeuner à l'hôtel, Boulangerie..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={repasForm.repas_libre || ''}
                      onChange={(e) => setRepasForm(prev => ({
                        ...prev,
                        repas_libre: e.target.value,
                        composition: e.target.value ? undefined : prev.composition
                      }))}
                    />
                  </div>
                </div>
              ) : ['dejeuner', 'diner'].includes(selectedType) ? (
                <div className="space-y-6">
                  {/* Composition du repas principal */}
                  <RepasPrincipalForm
                    composition={repasForm.composition?.repas_principal}
                    participants={sejour?.participants || []}
                    onChange={(composition) => setRepasForm(prev => ({
                      ...prev,
                      composition: {
                        ...prev.composition,
                        repas_principal: composition,
                      },
                    }))}
                  />
                  
                  {/* Accompagnements */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Accompagnements</h3>
                    <AccompagnementsForm
                      composition={repasForm.composition?.accompagnements}
                      nombreParticipants={sejour?.nombre_participants || 1}
                      participants={sejour?.participants || []}
                      onChange={(composition) => setRepasForm(prev => ({
                        ...prev,
                        composition: {
                          ...prev.composition,
                          accompagnements: composition,
                        },
                      }))}
                    />
                  </div>
                  
                  {/* Option repas libre */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Ou repas libre</h3>
                    <input
                      type="text"
                      placeholder="Ex: Restaurant, Pique-nique, Repas à l'extérieur..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={repasForm.repas_libre || ''}
                      onChange={(e) => setRepasForm(prev => ({
                        ...prev,
                        repas_libre: e.target.value,
                        composition: e.target.value ? undefined : prev.composition
                      }))}
                    />
                  </div>
                </div>
              ) : (
                // Pour collation et apéro, garder l'ancien système
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Sélection de recette */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Choisir une recette</h3>
                    
                    {/* Recherche */}
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Rechercher une recette..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchRecette}
                        onChange={(e) => setSearchRecette(e.target.value)}
                      />
                    </div>

                    {/* Liste des recettes */}
                    <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                      {filteredRecettes.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          Aucune recette trouvée
                        </div>
                      ) : (
                        filteredRecettes.map((recette) => (
                          <button
                            key={recette.id}
                            onClick={() => setRepasForm(prev => ({ ...prev, recette_id: recette.id, repas_libre: '' }))}
                            className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 ${
                              repasForm.recette_id === recette.id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                          >
                            <div className="font-medium">{recette.nom}</div>
                            {recette.description && (
                              <div className="text-sm text-gray-600 truncate">{recette.description}</div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              {recette.portions} portions • {recette.temps_preparation || 0}min
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    <div className="mt-4 text-center text-gray-500">
                      ou
                    </div>

                    {/* Repas libre */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Repas libre (sans recette)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Apéritif maison, Collation..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={repasForm.repas_libre || ''}
                        onChange={(e) => setRepasForm(prev => ({ ...prev, repas_libre: e.target.value, recette_id: undefined }))}
                      />
                    </div>
                  </div>

                  {/* Détails du repas */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Détails du repas</h3>
                    
                    <div className="space-y-4">
                      {/* Nombre de portions */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre de portions
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={repasForm.nombre_portions}
                          onChange={(e) => setRepasForm(prev => ({ ...prev, nombre_portions: parseInt(e.target.value) }))}
                        />
                      </div>

                      {/* Coût estimé */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Coût estimé (€)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={repasForm.cout_estime || ''}
                          onChange={(e) => setRepasForm(prev => ({ ...prev, cout_estime: e.target.value ? parseFloat(e.target.value) : undefined }))}
                          placeholder="0.00"
                        />
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes
                        </label>
                        <textarea
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={repasForm.notes || ''}
                          onChange={(e) => setRepasForm(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Notes sur ce repas..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Détails communs */}
              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-medium mb-4">Détails du repas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Nombre de portions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de portions
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={repasForm.nombre_portions}
                      onChange={(e) => setRepasForm(prev => ({ ...prev, nombre_portions: parseInt(e.target.value) }))}
                    />
                  </div>

                  {/* Coût estimé */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coût estimé (€)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={repasForm.cout_estime || ''}
                      onChange={(e) => setRepasForm(prev => ({ ...prev, cout_estime: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      placeholder="0.00"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={repasForm.notes || ''}
                      onChange={(e) => setRepasForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Notes sur ce repas..."
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <div>
                  {editingRepas && (
                    <Button
                      variant="outline"
                      onClick={handleDeleteRepas}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      Supprimer
                    </Button>
                  )}
                </div>
                <div className="flex space-x-3">
                  <Button variant="outline" onClick={closeRepasModal}>
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSaveRepas}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}