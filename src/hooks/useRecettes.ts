import { useState, useCallback, useEffect } from 'react';
import type { RecetteComplete, RecetteFormData, RecetteIngredientFormData, RecetteUstensileFormData } from '@/types/tidimondo';

interface UseRecettesReturn {
  recettes: RecetteComplete[];
  loading: boolean;
  error: string | null;
  
  // Actions CRUD
  fetchRecettes: (filters?: {
    search?: string;
    difficulte?: number;
    temps_max?: number;
    type_repas?: string;
    regime_alimentaire?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) => Promise<void>;
  createRecette: (data: {
    recette: RecetteFormData;
    ingredients: RecetteIngredientFormData[];
    ustensiles: RecetteUstensileFormData[];
  }) => Promise<RecetteComplete>;
  updateRecette: (id: string, data: {
    recette: Partial<RecetteFormData>;
    ingredients?: RecetteIngredientFormData[];
    ustensiles?: RecetteUstensileFormData[];
  }) => Promise<RecetteComplete>;
  deleteRecette: (id: string) => Promise<void>;
  getRecette: (id: string) => Promise<RecetteComplete>;
  
  // Utilitaires
  refreshRecettes: () => Promise<void>;
  clearError: () => void;
}

interface CreateRecetteData {
  recette: RecetteFormData;
  ingredients: RecetteIngredientFormData[];
  ustensiles: RecetteUstensileFormData[];
}

interface UpdateRecetteData {
  recette: Partial<RecetteFormData>;
  ingredients?: RecetteIngredientFormData[];
  ustensiles?: RecetteUstensileFormData[];
}

export const useRecettes = (): UseRecettesReturn => {
  const [recettes, setRecettes] = useState<RecetteComplete[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction utilitaire pour gérer les erreurs
  const handleError = useCallback((error: unknown, defaultMessage: string) => {
    console.error(defaultMessage, error);
    const errorMessage = error instanceof Error ? error.message : defaultMessage;
    setError(errorMessage);
    throw new Error(errorMessage);
  }, []);

  // Récupérer la liste des recettes
  const fetchRecettes = useCallback(async (filters?: {
    search?: string;
    difficulte?: number;
    temps_max?: number;
    type_repas?: string;
    regime_alimentaire?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      // Construction des paramètres de requête
      const searchParams = new URLSearchParams();
      
      if (filters?.search) searchParams.set('search', filters.search);
      if (filters?.difficulte) searchParams.set('difficulte', filters.difficulte.toString());
      if (filters?.temps_max) searchParams.set('temps_max', filters.temps_max.toString());
      if (filters?.type_repas) searchParams.set('type_repas', filters.type_repas);
      if (filters?.regime_alimentaire) searchParams.set('regime_alimentaire', filters.regime_alimentaire);
      if (filters?.sort) searchParams.set('sort', filters.sort);
      if (filters?.order) searchParams.set('order', filters.order);
      if (filters?.page) searchParams.set('page', filters.page.toString());
      if (filters?.limit) searchParams.set('limit', filters.limit.toString());
      
      const url = `/api/recettes${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la récupération des recettes');
      }
      
      setRecettes(data.data.recettes);
    } catch (error) {
      console.error('Erreur lors de la récupération des recettes', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la récupération des recettes';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Créer une nouvelle recette
  const createRecette = useCallback(async (data: CreateRecetteData): Promise<RecetteComplete> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/recettes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la création de la recette');
      }
      
      const newRecette = result.data.recette;
      setRecettes(prev => [newRecette, ...prev]);
      
      return newRecette;
    } catch (error) {
      handleError(error, 'Erreur lors de la création de la recette');
      throw error; // Re-throw pour que le composant puisse gérer l'erreur
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Mettre à jour une recette
  const updateRecette = useCallback(async (id: string, data: UpdateRecetteData): Promise<RecetteComplete> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/recettes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la mise à jour de la recette');
      }
      
      const updatedRecette = result.data.recette;
      setRecettes(prev => prev.map(r => r.id === id ? updatedRecette : r));
      
      return updatedRecette;
    } catch (error) {
      handleError(error, 'Erreur lors de la mise à jour de la recette');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Supprimer une recette
  const deleteRecette = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/recettes/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la suppression de la recette');
      }
      
      setRecettes(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      handleError(error, 'Erreur lors de la suppression de la recette');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Récupérer une recette spécifique
  const getRecette = useCallback(async (id: string): Promise<RecetteComplete> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/recettes/${id}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la récupération de la recette');
      }
      
      return result.data.recette;
    } catch (error) {
      handleError(error, 'Erreur lors de la récupération de la recette');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Rafraîchir la liste des recettes
  const refreshRecettes = useCallback(async () => {
    await fetchRecettes();
  }, [fetchRecettes]);

  // Effacer l'erreur
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Charger les recettes au montage du hook
  useEffect(() => {
    fetchRecettes();
  }, [fetchRecettes]);

  return {
    recettes,
    loading,
    error,
    fetchRecettes,
    createRecette,
    updateRecette,
    deleteRecette,
    getRecette,
    refreshRecettes,
    clearError,
  };
};

// Hook pour une recette spécifique
export const useRecette = (id: string) => {
  const [recette, setRecette] = useState<RecetteComplete | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecette = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/recettes/${id}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la récupération de la recette');
      }
      
      setRecette(result.data.recette);
    } catch (error) {
      console.error('Erreur récupération recette:', error);
      setError(error instanceof Error ? error.message : 'Erreur serveur');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRecette();
  }, [fetchRecette]);

  return {
    recette,
    loading,
    error,
    refetch: fetchRecette,
  };
};