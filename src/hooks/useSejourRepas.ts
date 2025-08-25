'use client';

import { useState, useEffect } from 'react';
import { SejourRepas, TypeRepas, ApiResult } from '@/types/tidimondo';

interface RepasFormData {
  recette_id?: string;
  date_repas: string;
  type_repas: TypeRepas;
  nombre_portions: number;
  notes?: string;
  repas_libre?: string;
  cout_estime?: number;
  ordre_dans_journee?: number;
}

export function useSejourRepas(sejourId: string) {
  const [repas, setRepas] = useState<SejourRepas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRepas = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/sejours/${sejourId}/repas`);
      const result: ApiResult<SejourRepas[]> = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || 'Erreur lors du chargement des repas');
      }

      setRepas(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const createRepas = async (data: RepasFormData): Promise<SejourRepas> => {
    try {
      const response = await fetch(`/api/sejours/${sejourId}/repas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResult<SejourRepas> = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || 'Erreur lors de la création du repas');
      }

      // Ajouter à la liste locale
      setRepas(prev => [...prev, result.data].sort((a, b) => {
        const dateCompare = a.date_repas.localeCompare(b.date_repas);
        if (dateCompare !== 0) return dateCompare;
        return a.ordre_dans_journee - b.ordre_dans_journee;
      }));
      
      return result.data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  const updateRepas = async (repasId: string, data: Partial<RepasFormData>): Promise<SejourRepas> => {
    try {
      const response = await fetch(`/api/sejours/${sejourId}/repas/${repasId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResult<SejourRepas> = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || 'Erreur lors de la mise à jour du repas');
      }

      // Mettre à jour la liste locale
      setRepas(prev => prev.map(r => r.id === repasId ? result.data : r).sort((a, b) => {
        const dateCompare = a.date_repas.localeCompare(b.date_repas);
        if (dateCompare !== 0) return dateCompare;
        return a.ordre_dans_journee - b.ordre_dans_journee;
      }));
      
      return result.data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  const deleteRepas = async (repasId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/sejours/${sejourId}/repas/${repasId}`, {
        method: 'DELETE',
      });

      const result: ApiResult<{ message: string }> = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || 'Erreur lors de la suppression du repas');
      }

      // Retirer de la liste locale
      setRepas(prev => prev.filter(r => r.id !== repasId));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  // Fonctions utilitaires pour organiser les repas
  const getRepasByDate = (date: string) => {
    return repas.filter(r => r.date_repas === date);
  };

  const getRepasByDateAndType = (date: string, type: TypeRepas) => {
    return repas.find(r => r.date_repas === date && r.type_repas === type);
  };

  const getRepasGroupedByDate = () => {
    const grouped: { [date: string]: SejourRepas[] } = {};
    repas.forEach(r => {
      if (!grouped[r.date_repas]) {
        grouped[r.date_repas] = [];
      }
      grouped[r.date_repas].push(r);
    });
    
    // Trier les repas de chaque jour par ordre
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => a.ordre_dans_journee - b.ordre_dans_journee);
    });
    
    return grouped;
  };

  const getStatistiques = () => {
    const repasAvecRecette = repas.filter(r => r.recette_id);
    const repasSansRecette = repas.filter(r => !r.recette_id);
    const coutTotal = repas.reduce((total, r) => total + (r.cout_estime || 0), 0);
    
    const repartitionParType = repas.reduce((acc, r) => {
      acc[r.type_repas] = (acc[r.type_repas] || 0) + 1;
      return acc;
    }, {} as { [key in TypeRepas]?: number });

    return {
      total: repas.length,
      avec_recette: repasAvecRecette.length,
      sans_recette: repasSansRecette.length,
      cout_total: coutTotal,
      repartition_par_type: repartitionParType,
    };
  };

  useEffect(() => {
    if (sejourId) {
      fetchRepas();
    }
  }, [sejourId]);

  return {
    repas,
    loading,
    error,
    createRepas,
    updateRepas,
    deleteRepas,
    getRepasByDate,
    getRepasByDateAndType,
    getRepasGroupedByDate,
    getStatistiques,
    refresh: fetchRepas,
  };
}