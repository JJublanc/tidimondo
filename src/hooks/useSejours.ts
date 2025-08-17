'use client';

import { useState, useEffect } from 'react';
import { 
  Sejour, 
  SejourComplet, 
  SejourFormData, 
  SejourFilters, 
  PaginatedResponse,
  ApiResult 
} from '@/types/tidimondo';

export function useSejours(filters?: SejourFilters) {
  const [sejours, setSejours] = useState<Sejour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchSejours = async (page = 1, newFilters?: SejourFilters) => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      const activeFilters = newFilters || filters;
      if (activeFilters) {
        if (activeFilters.search) searchParams.append('search', activeFilters.search);
        if (activeFilters.statut) searchParams.append('statut', activeFilters.statut.join(','));
        if (activeFilters.type_sejour) searchParams.append('type_sejour', activeFilters.type_sejour);
        if (activeFilters.date_debut_apres) searchParams.append('date_debut_apres', activeFilters.date_debut_apres);
        if (activeFilters.date_fin_avant) searchParams.append('date_fin_avant', activeFilters.date_fin_avant);
      }

      const response = await fetch(`/api/sejours?${searchParams}`);
      const result: ApiResult<PaginatedResponse<Sejour>> = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || 'Erreur lors du chargement des séjours');
      }

      setSejours(result.data.data);
      setPagination(result.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const createSejour = async (data: SejourFormData): Promise<Sejour> => {
    try {
      const response = await fetch('/api/sejours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResult<Sejour> = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || 'Erreur lors de la création du séjour');
      }

      // Rafraîchir la liste
      await fetchSejours(pagination.page);
      
      return result.data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  const updateSejour = async (id: string, data: Partial<SejourFormData>): Promise<Sejour> => {
    try {
      const response = await fetch(`/api/sejours/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResult<Sejour> = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || 'Erreur lors de la mise à jour du séjour');
      }

      // Mettre à jour la liste locale
      setSejours(prev => prev.map(s => s.id === id ? result.data : s));
      
      return result.data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  const getSejour = async (id: string): Promise<SejourComplet> => {
    try {
      const response = await fetch(`/api/sejours/${id}`);
      const result: ApiResult<SejourComplet> = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || 'Erreur lors du chargement du séjour');
      }

      return result.data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  const deleteSejour = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/sejours/${id}`, {
        method: 'DELETE',
      });

      const result: ApiResult<{ message: string }> = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || 'Erreur lors de la suppression du séjour');
      }

      // Retirer de la liste locale
      setSejours(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  const changePage = (newPage: number) => {
    fetchSejours(newPage);
  };

  const applyFilters = (newFilters: SejourFilters) => {
    fetchSejours(1, newFilters);
  };

  useEffect(() => {
    fetchSejours();
  }, []);

  return {
    sejours,
    loading,
    error,
    pagination,
    createSejour,
    updateSejour,
    getSejour,
    deleteSejour,
    changePage,
    applyFilters,
    refresh: () => fetchSejours(pagination.page),
  };
}

export function useSejour(id: string) {
  const [sejour, setSejour] = useState<SejourComplet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSejour = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/sejours/${id}`);
      const result: ApiResult<SejourComplet> = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || 'Erreur lors du chargement du séjour');
      }

      setSejour(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const updateSejour = async (data: Partial<SejourFormData>): Promise<Sejour> => {
    try {
      const response = await fetch(`/api/sejours/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResult<Sejour> = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || 'Erreur lors de la mise à jour du séjour');
      }

      // Rafraîchir les données complètes
      await fetchSejour();
      
      return result.data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  useEffect(() => {
    if (id) {
      fetchSejour();
    }
  }, [id]);

  return {
    sejour,
    loading,
    error,
    updateSejour,
    refresh: fetchSejour,
  };
}