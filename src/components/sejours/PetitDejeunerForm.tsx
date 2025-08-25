'use client';

import { useState, useEffect } from 'react';
import { useIngredients } from '@/hooks/useIngredients';
import { PetitDejeunerComposition, RepasIngredient, RepasBoisson, UniteRecette, SejourParticipant } from '@/types/tidimondo';
import { Button } from '@/components/ui/button';

interface PetitDejeunerFormProps {
  composition?: PetitDejeunerComposition;
  nombreParticipants: number;
  participants: SejourParticipant[];
  onChange: (composition: PetitDejeunerComposition) => void;
}

export default function PetitDejeunerForm({
  composition,
  nombreParticipants,
  participants,
  onChange
}: PetitDejeunerFormProps) {
  const { ingredients } = useIngredients();
  const [searchIngredient, setSearchIngredient] = useState('');
  
  const [formData, setFormData] = useState<PetitDejeunerComposition>({
    ingredients: composition?.ingredients || [],
    boissons: composition?.boissons || [],
  });

  useEffect(() => {
    onChange(formData);
  }, [formData]);

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          ingredient_id: '',
          nom: '',
          quantite: 1,
          unite: 'piece',
          quantite_par_personne: true,
          notes: '',
        },
      ],
    }));
  };

  const updateIngredient = (index: number, field: keyof RepasIngredient, value: any) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => 
        i === index ? { ...ing, [field]: value } : ing
      ),
    }));
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const addBoisson = () => {
    setFormData(prev => ({
      ...prev,
      boissons: [
        ...prev.boissons,
        {
          nom: '',
          type: 'chaude',
          quantite: 1,
          unite: 'tasse',
          quantite_par_personne: true,
          notes: '',
        },
      ],
    }));
  };

  const updateBoisson = (index: number, field: keyof RepasBoisson, value: any) => {
    setFormData(prev => ({
      ...prev,
      boissons: prev.boissons.map((boisson, i) => 
        i === index ? { ...boisson, [field]: value } : boisson
      ),
    }));
  };

  const removeBoisson = (index: number) => {
    setFormData(prev => ({
      ...prev,
      boissons: prev.boissons.filter((_, i) => i !== index),
    }));
  };

  const selectIngredient = (ingredientId: string, nom: string) => {
    const lastIndex = formData.ingredients.length - 1;
    if (lastIndex >= 0 && !formData.ingredients[lastIndex].ingredient_id) {
      updateIngredient(lastIndex, 'ingredient_id', ingredientId);
      updateIngredient(lastIndex, 'nom', nom);
    }
  };

  const filteredIngredients = ingredients.filter(ing => {
    // Filtrage par recherche textuelle
    const matchesSearch = ing.nom.toLowerCase().includes(searchIngredient.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Filtrage par régimes alimentaires et allergènes des participants
    if (participants.length > 0) {
      // Récupérer tous les régimes alimentaires des participants
      const participantRegimes = participants.flatMap(p => p.regime_alimentaire || []);
      
      // Récupérer tous les allergènes des participants
      const participantAllergenes = participants.flatMap(p => p.allergies || []);
      
      // Vérification des régimes alimentaires
      if (participantRegimes.length > 0) {
        const ingredientRegimes = ing.regime_alimentaire || [];
        
        // Si l'ingrédient a des régimes spécifiés, vérifier qu'il couvre tous les régimes des participants
        if (ingredientRegimes.length > 0) {
          if (!participantRegimes.every(regime => ingredientRegimes.includes(regime))) {
            return false;
          }
        }
        // Si l'ingrédient n'a pas de régime spécifié, on considère qu'il n'est pas compatible avec des régimes spéciaux
        else if (participantRegimes.length > 0) {
          return false;
        }
      }
      
      // Vérification des allergènes
      if (participantAllergenes.length > 0) {
        const ingredientAllergenes = ing.allergenes || [];
        
        // Si l'ingrédient contient un allergène d'un participant, l'exclure
        if (ingredientAllergenes.some(allergene => participantAllergenes.includes(allergene))) {
          return false;
        }
      }
    }
    
    return true;
  });

  const calculateTotalQuantity = (ingredient: RepasIngredient) => {
    if (ingredient.quantite_par_personne) {
      return ingredient.quantite * nombreParticipants;
    }
    return ingredient.quantite;
  };

  return (
    <div className="space-y-6">
      {/* Ingrédients */}
      <div>
        <h3 className="text-lg font-medium mb-4">Ingrédients du petit-déjeuner</h3>
        
        {formData.ingredients.map((ingredient, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">Ingrédient {index + 1}</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeIngredient(index)}
                className="text-red-600 hover:text-red-700"
              >
                Supprimer
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sélection d'ingrédient */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingrédient
                </label>
                {!ingredient.ingredient_id ? (
                  <div>
                    <input
                      type="text"
                      placeholder="Rechercher un ingrédient..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                      value={searchIngredient}
                      onChange={(e) => setSearchIngredient(e.target.value)}
                    />
                    <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md">
                      {filteredIngredients.slice(0, 5).map((ing) => (
                        <button
                          key={ing.id}
                          type="button"
                          onClick={() => selectIngredient(ing.id, ing.nom)}
                          className="w-full text-left p-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          {ing.nom}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <span>{ingredient.nom}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateIngredient(index, 'ingredient_id', '');
                        updateIngredient(index, 'nom', '');
                      }}
                    >
                      Changer
                    </Button>
                  </div>
                )}
              </div>

              {/* Quantité */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantité
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={ingredient.quantite}
                    onChange={(e) => updateIngredient(index, 'quantite', parseFloat(e.target.value) || 0)}
                  />
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={ingredient.unite}
                    onChange={(e) => updateIngredient(index, 'unite', e.target.value as UniteRecette)}
                  >
                    <option value="piece">pièce(s)</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="cuillere_soupe">c. à soupe</option>
                    <option value="cuillere_cafe">c. à café</option>
                    <option value="verre">verre(s)</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={ingredient.notes || ''}
                  onChange={(e) => updateIngredient(index, 'notes', e.target.value)}
                  placeholder="Notes optionnelles..."
                />
              </div>
            </div>

            {/* Par personne - sur une ligne séparée */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={ingredient.quantite_par_personne}
                  onChange={(e) => updateIngredient(index, 'quantite_par_personne', e.target.checked)}
                />
                <span className="text-sm text-gray-700">Quantité par personne</span>
              </label>
              {ingredient.quantite_par_personne && (
                <div className="text-xs text-gray-500 mt-1">
                  Total: {calculateTotalQuantity(ingredient)} {ingredient.unite}
                </div>
              )}
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addIngredient}
          className="w-full"
        >
          + Ajouter un ingrédient
        </Button>
      </div>

      {/* Boissons */}
      <div>
        <h3 className="text-lg font-medium mb-4">Boissons</h3>
        
        {formData.boissons.map((boisson, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">Boisson {index + 1}</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeBoisson(index)}
                className="text-red-600 hover:text-red-700"
              >
                Supprimer
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Nom de la boisson */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la boisson
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={boisson.nom}
                  onChange={(e) => updateBoisson(index, 'nom', e.target.value)}
                  placeholder="Ex: Café, Thé, Jus d'orange..."
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={boisson.type}
                  onChange={(e) => updateBoisson(index, 'type', e.target.value)}
                >
                  <option value="chaude">Boisson chaude</option>
                  <option value="froide">Boisson froide</option>
                </select>
              </div>

              {/* Quantité */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantité
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={boisson.quantite || ''}
                    onChange={(e) => updateBoisson(index, 'quantite', parseFloat(e.target.value) || undefined)}
                  />
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={boisson.unite || 'tasse'}
                    onChange={(e) => updateBoisson(index, 'unite', e.target.value)}
                  >
                    <option value="tasse">tasse(s)</option>
                    <option value="verre">verre(s)</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Par personne - sur une ligne séparée */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={boisson.quantite_par_personne}
                  onChange={(e) => updateBoisson(index, 'quantite_par_personne', e.target.checked)}
                />
                <span className="text-sm text-gray-700">Quantité par personne</span>
              </label>
              {boisson.quantite_par_personne && boisson.quantite && (
                <div className="text-xs text-gray-500 mt-1">
                  Total: {boisson.quantite * nombreParticipants} {boisson.unite}
                </div>
              )}
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addBoisson}
          className="w-full"
        >
          + Ajouter une boisson
        </Button>
      </div>
    </div>
  );
}