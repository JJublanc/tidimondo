'use client';

import { useState, useEffect, useCallback } from 'react';
import { useIngredientSearch } from '@/hooks/useIngredients';
import { useDebounce } from '@/hooks/useDebounce';
import { RepasIngredient, UniteRecette, SejourParticipant, Ingredient } from '@/types/tidimondo';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, X } from 'lucide-react';

interface RepasSimpleComposition {
  ingredients: RepasIngredient[];
}

interface RepasSimpleFormProps {
  composition?: RepasSimpleComposition;
  nombreParticipants: number;
  participants: SejourParticipant[];
  onChange: (composition: RepasSimpleComposition) => void;
  placeholder?: string;
}

// Type étendu pour l'affichage des ingrédients avec leurs données
type RepasIngredientWithData = RepasIngredient & {
  ingredient?: Ingredient;
};

// Type étendu pour le formulaire avec ingrédients enrichis
type ExtendedRepasSimpleComposition = Omit<RepasSimpleComposition, 'ingredients'> & {
  ingredients: RepasIngredientWithData[];
};

export default function RepasSimpleForm({
  composition,
  nombreParticipants,
  participants,
  onChange,
  placeholder = "Rechercher un ingrédient..."
}: RepasSimpleFormProps) {
  const { results: searchResults, search: searchIngredients } = useIngredientSearch();
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [showCreateIngredientModal, setShowCreateIngredientModal] = useState(false);
  const [newIngredientData, setNewIngredientData] = useState({
    nom: '',
    categorie: 'autre',
    unite_base: 'piece' as const,
    saison: [] as string[],
    allergenes: [] as string[],
    regime_alimentaire: [] as string[]
  });
  
  const [formData, setFormData] = useState<ExtendedRepasSimpleComposition>({
    ingredients: composition?.ingredients?.map(ing => ({
      ingredient_id: ing.ingredient_id,
      nom: ing.nom,
      quantite: ing.quantite,
      unite: ing.unite,
      quantite_par_personne: ing.quantite_par_personne,
      notes: ing.notes,
      ingredient: undefined // Sera chargé si nécessaire
    })) || [],
  });

  const debouncedSearch = useDebounce(ingredientSearch, 300);

  // Charger les données complètes des ingrédients existants
  useEffect(() => {
    const loadIngredientData = async () => {
      // Vérifier s'il y a des ingrédients sans données complètes
      const needsLoading = formData.ingredients.some(ing => ing.ingredient_id && !ing.ingredient);
      
      if (needsLoading) {
        try {
          const response = await fetch('/api/ingredients?limit=1000');
          if (response.ok) {
            const result = await response.json();
            const allIngredients = result.data?.ingredients || [];
            
            const updatedIngredients = formData.ingredients.map((ing) => {
              if (!ing.ingredient && ing.ingredient_id) {
                const ingredient = allIngredients.find((i: Ingredient) => i.id === ing.ingredient_id);
                if (ingredient) {
                  return { ...ing, ingredient };
                }
              }
              return ing;
            });
            
            // Ne mettre à jour que si il y a vraiment des changements
            const hasChanges = updatedIngredients.some((ing, index) =>
              ing.ingredient && !formData.ingredients[index].ingredient
            );
            
            if (hasChanges) {
              setFormData(prev => ({
                ...prev,
                ingredients: updatedIngredients
              }));
            }
          }
        } catch (error) {
          console.error('Erreur chargement ingrédients:', error);
        }
      }
    };

    loadIngredientData();
  }, [composition]); // Se déclenche uniquement quand la composition initiale change

  // Recherche d'ingrédients avec debounce
  useEffect(() => {
    if (debouncedSearch && debouncedSearch.length > 2) {
      // Filtrer par allergènes des participants
      const participantAllergenes = participants.flatMap(p => p.allergies || []);
      searchIngredients(debouncedSearch, {
        excludeAllergenes: participantAllergenes
      });
    }
  }, [debouncedSearch, searchIngredients, participants]);

  // Synchroniser les changements avec le parent
  useEffect(() => {
    const cleanIngredients: RepasIngredient[] = formData.ingredients.map(ing => ({
      ingredient_id: ing.ingredient_id,
      nom: ing.ingredient?.nom || '',
      quantite: ing.quantite,
      unite: ing.unite,
      quantite_par_personne: ing.quantite_par_personne || false
    }));
    
    onChange({
      ingredients: cleanIngredients
    });
  }, [formData, onChange]);

  const addIngredient = (ingredient: Ingredient) => {
    // Vérifier si l'ingrédient n'est pas déjà ajouté
    const isAlreadyAdded = formData.ingredients.some(ing => ing.ingredient_id === ingredient.id);
    if (isAlreadyAdded) {
      alert('Cet ingrédient est déjà dans la liste');
      return;
    }

    const newIngredient: RepasIngredientWithData = {
      ingredient_id: ingredient.id,
      nom: ingredient.nom,
      quantite: 1,
      unite: ingredient.unite_base, // Utiliser l'unité de base de l'ingrédient
      quantite_par_personne: false,
      ingredient: ingredient // Stocker les données de l'ingrédient pour l'affichage
    };
    
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, newIngredient]
    }));
    setIngredientSearch('');
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const updateIngredient = (index: number, field: keyof RepasIngredient, value: any) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) =>
        i === index ? { ...ing, [field]: value } : ing
      )
    }));
  };

  const handleCreateIngredient = async () => {
    try {
      const response = await fetch('/api/ingredients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newIngredientData),
      });
      
      if (response.ok) {
        const result = await response.json();
        const newIngredient = result.data.ingredient;
        
        // Ajouter automatiquement l'ingrédient créé
        addIngredient(newIngredient);
        
        // Réinitialiser le modal
        setNewIngredientData({
          nom: '',
          categorie: 'autre',
          unite_base: 'piece' as const,
          saison: [] as string[],
          allergenes: [] as string[],
          regime_alimentaire: [] as string[]
        });
        setShowCreateIngredientModal(false);
      } else if (response.status === 409) {
        // Ingrédient existe déjà
        const error = await response.json();
        const confirmUse = confirm(
          `L'ingrédient "${newIngredientData.nom}" existe déjà. Voulez-vous l'utiliser ?`
        );
        
        if (confirmUse && error.existing) {
          // Ajouter l'ingrédient existant
          addIngredient(error.existing);
          // Réinitialiser le modal
          setNewIngredientData({
            nom: '',
            categorie: 'autre',
            unite_base: 'piece' as const,
            saison: [] as string[],
            allergenes: [] as string[],
            regime_alimentaire: [] as string[]
          });
          setShowCreateIngredientModal(false);
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Erreur lors de la création de l\'ingrédient');
      }
    } catch (error) {
      console.error('Erreur création ingrédient:', error);
      alert('Erreur lors de la création de l\'ingrédient');
    }
  };

  return (
    <div className="space-y-4">
      {/* Ajouter un ingrédient */}
      <div>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={ingredientSearch}
            onChange={(e) => setIngredientSearch(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={placeholder}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowCreateIngredientModal(true)}
            className="whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            Créer
          </Button>
        </div>
        
        {/* Résultats de recherche */}
        {ingredientSearch.length > 2 && (
          <div className="mt-2 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
            {searchResults.length > 0 ? (
              searchResults.map((ingredient: Ingredient) => (
                <button
                  key={ingredient.id}
                  type="button"
                  onClick={() => addIngredient(ingredient)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="font-medium">{ingredient.nom}</div>
                  {ingredient.categorie && (
                    <div className="text-sm text-gray-500 capitalize">{ingredient.categorie}</div>
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500 text-sm">
                Aucun ingrédient trouvé pour "{ingredientSearch}"
                <button
                  type="button"
                  onClick={() => {
                    setNewIngredientData(prev => ({ ...prev, nom: ingredientSearch }));
                    setShowCreateIngredientModal(true);
                  }}
                  className="block mt-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Créer "{ingredientSearch}" comme nouvel ingrédient
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Liste des ingrédients */}
      <div className="space-y-3">
        {formData.ingredients.map((ingredient: RepasIngredientWithData, index: number) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <span className="font-medium">
                {ingredient.ingredient?.nom || `Ingrédient ${index + 1}`}
              </span>
            </div>
            <input
              type="number"
              value={ingredient.quantite}
              onChange={(e) => updateIngredient(index, 'quantite', parseFloat(e.target.value) || 0)}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              min="0"
              step="0.1"
            />
            <select
              value={ingredient.unite}
              onChange={(e) => updateIngredient(index, 'unite', e.target.value)}
              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="piece">pièce</option>
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
              <option value="l">l</option>
              <option value="cuillere_soupe">c. à s.</option>
              <option value="cuillere_cafe">c. à c.</option>
            </select>
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={ingredient.quantite_par_personne || false}
                onChange={(e) => updateIngredient(index, 'quantite_par_personne', e.target.checked)}
                className="mr-1"
              />
              Par personne
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeIngredient(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Modal de création d'ingrédient */}
      {showCreateIngredientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Créer un nouvel ingrédient</h3>
              <button
                type="button"
                onClick={() => setShowCreateIngredientModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'ingrédient *
                </label>
                <input
                  type="text"
                  value={newIngredientData.nom}
                  onChange={(e) => setNewIngredientData(prev => ({ ...prev, nom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Tomate"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  value={newIngredientData.categorie}
                  onChange={(e) => setNewIngredientData(prev => ({ ...prev, categorie: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="legume">Légume</option>
                  <option value="fruit">Fruit</option>
                  <option value="viande">Viande</option>
                  <option value="poisson">Poisson</option>
                  <option value="feculent">Féculent</option>
                  <option value="produit_laitier">Produit laitier</option>
                  <option value="epice">Épice</option>
                  <option value="condiment">Condiment</option>
                  <option value="boisson">Boisson</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unité de base *
                </label>
                <select
                  value={newIngredientData.unite_base}
                  onChange={(e) => setNewIngredientData(prev => ({ ...prev, unite_base: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="piece">Pièce</option>
                  <option value="g">Gramme</option>
                  <option value="kg">Kilogramme</option>
                  <option value="ml">Millilitre</option>
                  <option value="l">Litre</option>
                </select>
              </div>
              
              {/* Allergènes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allergènes
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'gluten', label: 'Gluten' },
                    { value: 'lactose', label: 'Lactose' },
                    { value: 'oeuf', label: 'Œuf' },
                    { value: 'arachide', label: 'Arachide' },
                    { value: 'fruits_coque', label: 'Fruits à coque' },
                    { value: 'soja', label: 'Soja' },
                    { value: 'poisson', label: 'Poisson' },
                    { value: 'crustace', label: 'Crustacé' }
                  ].map((allergene) => (
                    <label key={allergene.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newIngredientData.allergenes.includes(allergene.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewIngredientData(prev => ({
                              ...prev,
                              allergenes: [...prev.allergenes, allergene.value]
                            }));
                          } else {
                            setNewIngredientData(prev => ({
                              ...prev,
                              allergenes: prev.allergenes.filter(a => a !== allergene.value)
                            }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{allergene.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateIngredientModal(false)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleCreateIngredient}
                disabled={!newIngredientData.nom.trim()}
              >
                Créer l'ingrédient
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}