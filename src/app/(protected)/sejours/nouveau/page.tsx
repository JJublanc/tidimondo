'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { useSejours } from '@/hooks/useSejours';
import { SejourFormData, TypeSejour, StatutSejour, RegimeAlimentaire, Allergene } from '@/types/tidimondo';
import { Button } from '@/components/ui/button';

export default function NouveauSejourPage() {
  const router = useRouter();
  const { createSejour } = useSejours();
  const [loading, setLoading] = useState(false);
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

  const updateParticipant = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      ),
    }));
  };

  const removeParticipant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.nom.trim()) {
        throw new Error('Le nom du séjour est requis');
      }
      if (!formData.date_debut) {
        throw new Error('La date de début est requise');
      }
      if (!formData.date_fin) {
        throw new Error('La date de fin est requise');
      }
      if (new Date(formData.date_fin) < new Date(formData.date_debut)) {
        throw new Error('La date de fin doit être postérieure à la date de début');
      }

      const sejour = await createSejour(formData);
      router.push(`/sejours/${sejour.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du séjour');
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = () => {
    if (formData.date_debut && formData.date_fin) {
      const debut = new Date(formData.date_debut);
      const fin = new Date(formData.date_fin);
      const diffTime = Math.abs(fin.getTime() - debut.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Nouveau Séjour</h1>
        <p className="text-gray-600 mt-2">
          Créez un nouveau séjour et commencez à planifier vos repas
        </p>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informations générales */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-6">Informations générales</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nom du séjour */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du séjour *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.nom}
                onChange={(e) => handleInputChange('nom', e.target.value)}
                placeholder="Ex: Weekend à la montagne"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Décrivez votre séjour..."
              />
            </div>

            {/* Lieu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lieu
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.lieu}
                onChange={(e) => handleInputChange('lieu', e.target.value)}
                placeholder="Ex: Chamonix"
              />
            </div>

            {/* Type de séjour */}
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
                <option value="weekend">Weekend</option>
                <option value="semaine">Semaine</option>
                <option value="court">Court séjour</option>
                <option value="long">Long séjour</option>
              </select>
            </div>

            {/* Date de début */}
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

            {/* Date de fin */}
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
                min={formData.date_debut}
              />
            </div>

            {/* Durée calculée */}
            {calculateDuration() > 0 && (
              <div className="md:col-span-2">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="text-blue-800 text-sm">
                    Durée du séjour : {calculateDuration()} jour(s)
                  </div>
                </div>
              </div>
            )}

            {/* Nombre de participants */}
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

            {/* Budget prévisionnel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget prévisionnel (€)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.budget_prevu || ''}
                onChange={(e) => handleInputChange('budget_prevu', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0.00"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Notes personnelles sur le séjour..."
              />
            </div>
          </div>
        </div>

        {/* Gestion des participants */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-6">
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
              <div className="text-sm text-gray-600 mb-4">
                Ajoutez les détails des participants pour une meilleure planification des repas selon leurs régimes alimentaires et allergies.
              </div>

              {formData.participants.map((participant, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
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
                    {/* Nom */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={participant.nom}
                        onChange={(e) => updateParticipant(index, 'nom', e.target.value)}
                        placeholder="Nom du participant"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={participant.email}
                        onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                        placeholder="email@exemple.com"
                      />
                    </div>

                    {/* Régimes alimentaires */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Régimes alimentaires
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

                    {/* Allergies */}
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

                    {/* Préférences */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Préférences alimentaires
                      </label>
                      <textarea
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={participant.preferences}
                        onChange={(e) => updateParticipant(index, 'preferences', e.target.value)}
                        placeholder="Préférences particulières..."
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
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Création...' : 'Créer le séjour'}
          </Button>
        </div>
      </form>
    </div>
  );
}