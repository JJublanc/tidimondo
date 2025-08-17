'use client';

import { useState, useEffect } from 'react';
import { useRecettes } from '@/hooks/useRecettes';
import { RepasPrincipalComposition, RepasPlat, SejourParticipant } from '@/types/tidimondo';
import { Button } from '@/components/ui/button';

interface RepasPrincipalFormProps {
  composition?: RepasPrincipalComposition;
  participants: SejourParticipant[];
  onChange: (composition: RepasPrincipalComposition) => void;
}

export default function RepasPrincipalForm({
  composition,
  participants,
  onChange
}: RepasPrincipalFormProps) {
  const { recettes } = useRecettes();
  const [searchRecette, setSearchRecette] = useState('');
  const [activeSection, setActiveSection] = useState<'entree' | 'plat_principal' | 'dessert' | null>(null);
  
  const [formData, setFormData] = useState<RepasPrincipalComposition>({
    entree: composition?.entree || undefined,
    plat_principal: composition?.plat_principal || undefined,
    dessert: composition?.dessert || undefined,
  });

  useEffect(() => {
    onChange(formData);
  }, [formData]);

  const updatePlat = (section: 'entree' | 'plat_principal' | 'dessert', plat: RepasPlat | undefined) => {
    setFormData(prev => ({
      ...prev,
      [section]: plat,
    }));
  };

  const selectRecette = (recetteId: string, nom: string) => {
    if (activeSection) {
      updatePlat(activeSection, {
        recette_id: recetteId,
        nom_libre: nom,
        notes: '',
      });
      setActiveSection(null);
      setSearchRecette('');
    }
  };

  const filteredRecettes = recettes.filter(recette =>
    recette.nom.toLowerCase().includes(searchRecette.toLowerCase()) ||
    recette.description?.toLowerCase().includes(searchRecette.toLowerCase())
  );

  const renderPlatSection = (
    section: 'entree' | 'plat_principal' | 'dessert',
    title: string,
    plat?: RepasPlat
  ) => {
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium mb-3">{title}</h4>
        
        {plat ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div>
                <div className="font-medium">{plat.nom_libre}</div>
                {plat.notes && (
                  <div className="text-sm text-gray-600">{plat.notes}</div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => updatePlat(section, undefined)}
                className="text-red-600 hover:text-red-700"
              >
                Supprimer
              </Button>
            </div>
            
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={plat.notes || ''}
                onChange={(e) => updatePlat(section, { ...plat, notes: e.target.value })}
                placeholder="Notes optionnelles..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {activeSection === section ? (
              <div>
                {/* Recherche de recette */}
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Rechercher une recette..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchRecette}
                    onChange={(e) => setSearchRecette(e.target.value)}
                  />
                </div>
                
                {/* Liste des recettes */}
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md mb-3">
                  {filteredRecettes.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Aucune recette trouvée
                    </div>
                  ) : (
                    filteredRecettes.map((recette) => (
                      <button
                        key={recette.id}
                        type="button"
                        onClick={() => selectRecette(recette.id, recette.nom)}
                        className="w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 last:border-b-0"
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
                
                <div className="text-center text-gray-500 mb-3">ou</div>
                
                {/* Plat libre */}
                <div>
                  <input
                    type="text"
                    placeholder="Nom du plat (sans recette)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        updatePlat(section, {
                          nom_libre: e.currentTarget.value.trim(),
                          notes: '',
                        });
                        setActiveSection(null);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <div className="text-xs text-gray-500">
                    Appuyez sur Entrée pour valider
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setActiveSection(null);
                      setSearchRecette('');
                    }}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveSection(section)}
                className="w-full"
              >
                + Ajouter {title.toLowerCase()}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-600 mb-4">
        Composez votre repas en sélectionnant une entrée, un plat principal et un dessert.
        Vous pouvez choisir des recettes existantes ou saisir des plats libres.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderPlatSection('entree', 'Entrée', formData.entree)}
        {renderPlatSection('plat_principal', 'Plat principal', formData.plat_principal)}
        {renderPlatSection('dessert', 'Dessert', formData.dessert)}
      </div>
    </div>
  );
}