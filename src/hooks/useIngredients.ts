import { useState, useCallback, useEffect } from 'react';
import type { Ingredient } from '@/types/tidimondo';

interface UseIngredientsReturn {
  ingredients: Ingredient[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchIngredients: (params?: {
    search?: string;
    categorie?: string;
    saison?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  createIngredient: (data: {
    nom: string;
    categorie: string;
    unite_base: string;
    prix_moyen?: number;
    allergenes?: string[];
    saison?: string[];
    description?: string;
  }) => Promise<Ingredient>;
  
  // Utilitaires
  clearError: () => void;
  refreshIngredients: () => Promise<void>;
}

interface UseIngredientSearchReturn {
  results: Ingredient[];
  loading: boolean;
  error: string | null;
  suggestions: string[];
  
  // Actions
  search: (query: string, options?: {
    categorie?: string;
    excludeAllergenes?: string[];
    limit?: number;
  }) => Promise<void>;
  clearResults: () => void;
}

export const useIngredients = (): UseIngredientsReturn => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((error: unknown, defaultMessage: string) => {
    console.error(defaultMessage, error);
    const errorMessage = error instanceof Error ? error.message : defaultMessage;
    setError(errorMessage);
  }, []);

  const fetchIngredients = useCallback(async (params?: {
    search?: string;
    categorie?: string;
    saison?: string;
    page?: number;
    limit?: number;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const searchParams = new URLSearchParams();
      
      if (params?.search) searchParams.set('search', params.search);
      if (params?.categorie) searchParams.set('categorie', params.categorie);
      if (params?.saison) searchParams.set('saison', params.saison);
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      
      const response = await fetch(`/api/ingredients?${searchParams.toString()}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la récupération des ingrédients');
      }
      
      setIngredients(data.data.ingredients);
    } catch (error) {
      handleError(error, 'Erreur lors de la récupération des ingrédients');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const createIngredient = useCallback(async (data: {
    nom: string;
    categorie: string;
    unite_base: string;
    prix_moyen?: number;
    allergenes?: string[];
    saison?: string[];
    description?: string;
  }): Promise<Ingredient> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ingredients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la création de l\'ingrédient');
      }
      
      const newIngredient = result.data.ingredient;
      setIngredients(prev => [newIngredient, ...prev]);
      
      return newIngredient;
    } catch (error) {
      handleError(error, 'Erreur lors de la création de l\'ingrédient');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshIngredients = useCallback(async () => {
    await fetchIngredients();
  }, [fetchIngredients]);

  // Charger les ingrédients au montage
  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  return {
    ingredients,
    loading,
    error,
    fetchIngredients,
    createIngredient,
    clearError,
    refreshIngredients,
  };
};

// Hook spécialisé pour la recherche d'ingrédients avec debounce
export const useIngredientSearch = (): UseIngredientSearchReturn => {
  const [results, setResults] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const search = useCallback(async (query: string, options?: {
    categorie?: string;
    excludeAllergenes?: string[];
    limit?: number;
  }) => {
    if (query.length < 2) {
      setResults([]);
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const searchParams = new URLSearchParams();
      searchParams.set('q', query);
      
      if (options?.categorie) {
        searchParams.set('categorie', options.categorie);
      }
      
      if (options?.excludeAllergenes && options.excludeAllergenes.length > 0) {
        searchParams.set('exclude_allergenes', options.excludeAllergenes.join(','));
      }
      
      if (options?.limit) {
        searchParams.set('limit', options.limit.toString());
      }
      
      const response = await fetch(`/api/ingredients/search?${searchParams.toString()}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la recherche');
      }
      
      setResults(data.data.ingredients);
      setSuggestions(data.data.suggestions || []);
    } catch (error) {
      console.error('Erreur recherche ingrédients:', error);
      setError(error instanceof Error ? error.message : 'Erreur de recherche');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    suggestions,
    search,
    clearResults,
  };
};

// Hook pour gérer les ingrédients favoris/récents
export const useIngredientHistory = () => {
  const [recentIngredients, setRecentIngredients] = useState<Ingredient[]>([]);
  const [favoriteIngredients, setFavoriteIngredients] = useState<string[]>([]);

  // Charger l'historique depuis localStorage
  useEffect(() => {
    const recent = localStorage.getItem('tidimondo_recent_ingredients');
    const favorites = localStorage.getItem('tidimondo_favorite_ingredients');
    
    if (recent) {
      try {
        setRecentIngredients(JSON.parse(recent));
      } catch (error) {
        console.error('Erreur chargement ingrédients récents:', error);
      }
    }
    
    if (favorites) {
      try {
        setFavoriteIngredients(JSON.parse(favorites));
      } catch (error) {
        console.error('Erreur chargement ingrédients favoris:', error);
      }
    }
  }, []);

  const addRecentIngredient = useCallback((ingredient: Ingredient) => {
    setRecentIngredients(prev => {
      const filtered = prev.filter(ing => ing.id !== ingredient.id);
      const updated = [ingredient, ...filtered].slice(0, 10); // Garder les 10 derniers
      
      localStorage.setItem('tidimondo_recent_ingredients', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const toggleFavoriteIngredient = useCallback((ingredientId: string) => {
    setFavoriteIngredients(prev => {
      const updated = prev.includes(ingredientId)
        ? prev.filter(id => id !== ingredientId)
        : [...prev, ingredientId];
      
      localStorage.setItem('tidimondo_favorite_ingredients', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setRecentIngredients([]);
    setFavoriteIngredients([]);
    localStorage.removeItem('tidimondo_recent_ingredients');
    localStorage.removeItem('tidimondo_favorite_ingredients');
  }, []);

  return {
    recentIngredients,
    favoriteIngredients,
    addRecentIngredient,
    toggleFavoriteIngredient,
    clearHistory,
  };
};