'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRecettes } from '@/hooks/useRecettes';
import { useDebounce } from '@/hooks/useDebounce';
import { RepasPrincipalComposition, RepasPlat, SejourParticipant, RepasIngredient, Ingredient } from '@/types/tidimondo';
import { Button } from '@/components/ui/button';

// Type étendu pour inclure les données complètes de l'ingrédient
interface RepasIngredientWithData extends RepasIngredient {
  ingredient?: Ingredient;
}

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
  
  const [formData, setFormData] = useState<{
    entree?: RepasPlat;
    plat_principal?: RepasPlat;
    dessert?: RepasPlat;
    ingredients: RepasIngredientWithData[];
  }>({
    entree: composition?.entree || undefined,
    plat_principal: composition?.plat_principal || undefined,
    dessert: composition?.dessert || undefined,
    ingredients: composition?.ingredients?.map(ing => ({ ...ing, ingredient: undefined })) || [],
  });

  // États pour la gestion des ingrédients
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Ingredient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    nom: '',
    categorie: 'autre' as const,
    unite_base: 'g' as const,
    allergenes: [] as string[]
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
  }, [debouncedSearch, participants]);

  useEffect(() => {
    // Convertir vers le type RepasPrincipalComposition attendu
    const composition: RepasPrincipalComposition = {
      entree: formData.entree,
      plat_principal: formData.plat_principal,
      dessert: formData.dessert,
      ingredients: formData.ingredients.map(ing => ({
        ingredient_id: ing.ingredient_id,
        nom: ing.nom,
        quantite: ing.quantite,
        unite: ing.unite,
        quantite_par_personne: ing.quantite_par_personne,
        notes: ing.notes
      }))
    };
    onChange(composition);
  }, [formData, onChange]);

  // Fonction de recherche d'ingrédients
  const searchIngredients = useCallback(async (query: string, options: { excludeAllergenes?: string[] } = {}) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams({ q: query });
      if (options.excludeAllergenes?.length) {
        params.append('exclude_allergenes', options.excludeAllergenes.join(','));
      }

      const response = await fetch(`/api/ingredients/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data?.ingredients || []);
      }
    } catch (error) {
      console.error('Erreur recherche ingrédients:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Ajouter un ingrédient
  const addIngredient = useCallback((ingredient: Ingredient) => {
    const newIngredient: RepasIngredientWithData = {
      ingredient_id: ingredient.id,
      nom: ingredient.nom,
      quantite: 1,
      unite: ingredient.unite_base,
      quantite_par_personne: true,
      notes: '',
      ingredient
    };

    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, newIngredient]
    }));

    setIngredientSearch('');
    setSearchResults([]);
  }, []);

  // Supprimer un ingrédient
  const removeIngredient = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  }, []);

  // Mettre à jour un ingrédient
  const updateIngredient = useCallback((index: number, updates: Partial<RepasIngredient>) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) =>
        i === index ? { ...ing, ...updates } : ing
      )
    }));
  }, []);

  // Créer un nouvel ingrédient
  const createIngredient = useCallback(async () => {
    try {
      const response = await fetch('/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIngredient)
      });

      if (response.ok) {
        const data = await response.json();
        const ingredient = data.data.ingredient;
        addIngredient(ingredient);
        setShowCreateModal(false);
        setNewIngredient({
          nom: '',
          categorie: 'autre',
          unite_base: 'g',
          allergenes: []
        });
      }
    } catch (error) {
      console.error('Erreur création ingrédient:', error);
    }
  }, [newIngredient, addIngredient]);

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

      {/* Section Ingrédients supplémentaires */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium mb-3">Ingrédients supplémentaires</h4>
        <div className="text-sm text-gray-600 mb-4">
          Ajoutez des accompagnements, boissons ou autres ingrédients pour compléter votre repas.
        </div>

        {/* Liste des ingrédients */}
        {formData.ingredients.length > 0 && (
          <div className="space-y-3 mb-4">
            {formData.ingredients.map((ingredient, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                <div className="flex-1">
                  <div className="font-medium">
                    {ingredient.ingredient?.nom || ingredient.nom}
                  </div>
                  <div className="text-sm text-gray-600">
                    {ingredient.ingredient?.categorie && (
                      <span className="capitalize">{ingredient.ingredient.categorie} • </span>
                    )}
                    {ingredient.quantite} {ingredient.unite}
                    {ingredient.quantite_par_personne ? ' par personne' : ' au total'}
                  </div>
                  {ingredient.notes && (
                    <div className="text-sm text-gray-500 italic">{ingredient.notes}</div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={ingredient.quantite}
                    onChange={(e) => updateIngredient(index, { quantite: parseFloat(e.target.value) || 0 })}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <select
                    value={ingredient.unite}
                    onChange={(e) => updateIngredient(index, { unite: e.target.value as any })}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="piece">pièce</option>
                    <option value="cuillere_soupe">c. à soupe</option>
                    <option value="cuillere_cafe">c. à café</option>
                    <option value="pincee">pincée</option>
                    <option value="verre">verre</option>
                  </select>
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={ingredient.quantite_par_personne}
                      onChange={(e) => updateIngredient(index, { quantite_par_personne: e.target.checked })}
                      className="mr-1"
                    />
                    /pers.
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeIngredient(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recherche d'ingrédients */}
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un ingrédient..."
              value={ingredientSearch}
              onChange={(e) => setIngredientSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {isSearching && (
              <div className="absolute right-3 top-2.5">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>

          {/* Résultats de recherche */}
          {searchResults.length > 0 && (
            <div className="border border-gray-200 rounded-md max-h-48 overflow-y-auto">
              {searchResults.map((ingredient) => (
                <button
                  key={ingredient.id}
                  type="button"
                  onClick={() => addIngredient(ingredient)}
                  className="w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 last:border-b-0"
                >
                  <div className="font-medium">{ingredient.nom}</div>
                  <div className="text-sm text-gray-600 capitalize">
                    {ingredient.categorie} • {ingredient.unite_base}
                    {ingredient.allergenes.length > 0 && (
                      <span className="text-orange-600 ml-2">
                        ⚠ {ingredient.allergenes.join(', ')}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Bouton créer ingrédient */}
          {ingredientSearch && searchResults.length === 0 && !isSearching && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNewIngredient(prev => ({ ...prev, nom: ingredientSearch }));
                setShowCreateModal(true);
              }}
              className="w-full"
            >
              + Créer "{ingredientSearch}"
            </Button>
          )}
        </div>

        {/* Modal de création d'ingrédient */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium mb-4">Créer un nouvel ingrédient</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    type="text"
                    value={newIngredient.nom}
                    onChange={(e) => setNewIngredient(prev => ({ ...prev, nom: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <select
                    value={newIngredient.categorie}
                    onChange={(e) => setNewIngredient(prev => ({ ...prev, categorie: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unité de base</label>
                  <select
                    value={newIngredient.unite_base}
                    onChange={(e) => setNewIngredient(prev => ({ ...prev, unite_base: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="g">Grammes (g)</option>
                    <option value="kg">Kilogrammes (kg)</option>
                    <option value="ml">Millilitres (ml)</option>
                    <option value="l">Litres (l)</option>
                    <option value="piece">Pièce</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={createIngredient}
                  className="flex-1"
                  disabled={!newIngredient.nom.trim()}
                >
                  Créer
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}