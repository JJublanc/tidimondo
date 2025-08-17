'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { useSejours } from '@/hooks/useSejours';
import { SejourFormData, TypeSejour, StatutSejour, RegimeAlimentaire, Allergene } from '@/types/tidimondo';
import { Button } from '@/components/ui/button';

interface ModifierSejourPageProps {
  params: Promise<{ id: string }>;
}

export default function ModifierSejourPage({ params }: ModifierSejourPageProps) {
  const router = useRouter();
  const { updateSejour, getSejour } = useSejours();
  const [sejourId, setSejourId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingSejour, setLoadingSejour] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<SejourFormData>({
    nom: '',
    description: '',
    lieu: '',
    date_debut: '',
    date_fin: '',
    nombre_participants: 1,
    type_sejour: undefined,
    budget_prevu: undefined,
    notes: '',
    statut: 'brouillon',
    participants: [],
  });

  const [showParticipants, setShowParticipants] = useState(false);

  // Charger les paramètres et le séjour
  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setSejourId(resolvedParams.id);
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    if (sejourId) {
      loadSejour();
    }
  }, [sejourId]);

  const loadSejour = async () => {
    try {
      setLoadingSejour(true);
      const sejour = await getSejour(sejourId);
      if (sejour) {
        setFormData({
          nom: sejour.nom,
          description: sejour.description || '',
          lieu: sejour.lieu || '',
          date_debut: sejour.date_debut,
          date_fin: sejour.date_fin,
          nombre_participants: sejour.nombre_participants,
          type_sejour: sejour.type_sejour || undefined,
          budget_prevu: sejour.budget_prevu || undefined,
          notes: sejour.notes || '',
          statut: sejour.statut,
          participants: (sejour.participants || []).map(p => ({
            nom: p.nom,
            email: p.email || '',
            regime_alimentaire: p.regime_alimentaire,
            allergies: p.allergies,
            preferences: p.preferences || '',
            notes: p.notes || '',
          })),
        });
        setShowParticipants((sejour.participants || []).length > 0);
      }
    } catch (err) {
      setError('Erreur lors du chargement du séjour');
    } finally {
      setLoadingSejour(false);
    }
  };

  const handleInputChange = (field: keyof SejourFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addParticipant = () => {
    setFormData(prev => ({
      ...prev,
      participants: [
        ...prev.participants,
        {
          nom: '',
          email: '',
          regime_alimentaire: [],
          allergies: [],
          preferences: '',
          notes: '',
        },
      ],
    }));
  };

  const removeParticipant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index),
    }));
  };

  const updateParticipant = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.map((participant, i) =>
        i === index ? { ...participant, [field]: value } : participant
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateSejour(sejourId, formData);
      router.push(`/sejours/${sejourId}`);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du séjour');
    } finally {
      setLoading(false);
    }
  };

  if (loadingSejour) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Chargement du séjour...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Modifier le séjour</h1>
          <p className="text-gray-600 mt-2">
            Modifiez les informations de votre séjour
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informations générales */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-6">Informations générales</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du séjour *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.nom}
                  onChange={(e) => handleInputChange('nom', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lieu *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.lieu}
                  onChange={(e) => handleInputChange('lieu', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de début *
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.date_debut}
                  onChange={(e) => handleInputChange('date_debut', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de fin *
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.date_fin}
                  onChange={(e) => handleInputChange('date_fin', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de participants *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.nombre_participants}
                  onChange={(e) => handleInputChange('nombre_participants', parseInt(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de séjour
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.type_sejour || ''}
                  onChange={(e) => handleInputChange('type_sejour', e.target.value as TypeSejour || undefined)}
                >
                  <option value="">Sélectionner un type</option>
                  <option value="vacances">Vacances</option>
                  <option value="professionnel">Professionnel</option>
                  <option value="famille">Famille</option>
                  <option value="amis">Amis</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget prévu (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.budget_prevu || ''}
                  onChange={(e) => handleInputChange('budget_prevu', parseFloat(e.target.value) || undefined)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.statut}
                  onChange={(e) => handleInputChange('statut', e.target.value as StatutSejour)}
                >
                  <option value="brouillon">Brouillon</option>
                  <option value="planifie">Planifié</option>
                  <option value="en_cours">En cours</option>
                  <option value="termine">Terminé</option>
                  <option value="annule">Annulé</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Description du séjour..."
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Notes additionnelles..."
              />
            </div>
          </div>

          {/* Participants */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Participants</h2>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowParticipants(!showParticipants)}
              >
                {showParticipants ? 'Masquer' : 'Gérer les participants'}
              </Button>
            </div>

            {showParticipants && (
              <div className="space-y-4">
                {formData.participants.map((participant, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">Participant {index + 1}</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeParticipant(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Supprimer
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nom
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={participant.nom}
                          onChange={(e) => updateParticipant(index, 'nom', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={participant.email}
                          onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Régime alimentaire
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
                                className="mr-2"
                                checked={participant.regime_alimentaire.includes(regime.value as RegimeAlimentaire)}
                                onChange={(e) => {
                                  const currentRegimes = participant.regime_alimentaire;
                                  const newRegimes = e.target.checked
                                    ? [...currentRegimes, regime.value as RegimeAlimentaire]
                                    : currentRegimes.filter(r => r !== regime.value);
                                  updateParticipant(index, 'regime_alimentaire', newRegimes);
                                }}
                              />
                              <span className="text-sm">{regime.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Allergies
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'arachides', label: 'Arachides' },
                            { value: 'fruits_coque', label: 'Fruits à coque' },
                            { value: 'lait', label: 'Lait' },
                            { value: 'oeufs', label: 'Œufs' },
                            { value: 'poisson', label: 'Poisson' },
                            { value: 'crustaces', label: 'Crustacés' },
                            { value: 'soja', label: 'Soja' },
                            { value: 'gluten', label: 'Gluten' },
                            { value: 'sesame', label: 'Sésame' },
                            { value: 'sulfites', label: 'Sulfites' }
                          ].map((allergie) => (
                            <label key={allergie.value} className="flex items-center">
                              <input
                                type="checkbox"
                                className="mr-2"
                                checked={participant.allergies.includes(allergie.value as Allergene)}
                                onChange={(e) => {
                                  const currentAllergies = participant.allergies;
                                  const newAllergies = e.target.checked
                                    ? [...currentAllergies, allergie.value as Allergene]
                                    : currentAllergies.filter(a => a !== allergie.value);
                                  updateParticipant(index, 'allergies', newAllergies);
                                }}
                              />
                              <span className="text-sm">{allergie.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Préférences
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={participant.preferences}
                          onChange={(e) => updateParticipant(index, 'preferences', e.target.value)}
                          placeholder="Préférences alimentaires..."
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes
                        </label>
                        <textarea
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={participant.notes}
                          onChange={(e) => updateParticipant(index, 'notes', e.target.value)}
                          placeholder="Notes sur le participant..."
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addParticipant}
                  className="w-full"
                >
                  + Ajouter un participant
                </Button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Mise à jour...' : 'Mettre à jour le séjour'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}