'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  ListeCoursesContenu, 
  ListeCoursesIngredient, 
  CategorieIngredient 
} from '@/types/tidimondo';

interface ListeCoursesData {
  contenu: ListeCoursesContenu;
  cout_total_estime: number;
  sejour: {
    id: string;
    nom: string;
    date_debut: string;
    date_fin: string;
    nombre_participants: number;
  };
}

const categorieLabels: Record<CategorieIngredient, string> = {
  'legume': '🥬 Légumes',
  'fruit': '🍎 Fruits',
  'viande': '🥩 Viandes',
  'poisson': '🐟 Poissons',
  'feculent': '🍞 Féculents',
  'produit_laitier': '🧀 Produits laitiers',
  'epice': '🌶️ Épices',
  'condiment': '🧂 Condiments',
  'boisson': '🥤 Boissons',
  'autre': '📦 Autres'
};

export default function ListeCoursesPage() {
  const params = useParams();
  const router = useRouter();
  const sejourId = params.id as string;
  
  const [listeCoursesData, setListeCoursesData] = useState<ListeCoursesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ingredientsModifies, setIngredientsModifies] = useState<Record<string, { quantite: number; unite: string }>>({});

  useEffect(() => {
    fetchListeCourses();
  }, [sejourId]);

  const fetchListeCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sejours/${sejourId}/liste-courses`);
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de la liste de courses');
      }
      
      const result = await response.json();
      setListeCoursesData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantite = (ingredientId: string, nouvelleQuantite: number, unite: string) => {
    setIngredientsModifies(prev => ({
      ...prev,
      [ingredientId]: { quantite: nouvelleQuantite, unite }
    }));
  };

  const getQuantiteAffichee = (ingredient: ListeCoursesIngredient) => {
    const modif = ingredientsModifies[ingredient.ingredient_id];
    return modif ? modif.quantite : ingredient.quantite_totale;
  };

  const getUniteAffichee = (ingredient: ListeCoursesIngredient) => {
    const modif = ingredientsModifies[ingredient.ingredient_id];
    return modif ? modif.unite : ingredient.unite;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const exporterPDF = async () => {
    try {
      const response = await fetch(`/api/sejours/${sejourId}/liste-courses/export-pdf`);
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'export PDF');
      }
      
      const htmlContent = await response.text();
      
      // Ouvrir une nouvelle fenêtre avec le contenu HTML pour impression
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Attendre que le contenu soit chargé puis lancer l'impression
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (err) {
      console.error('Erreur lors de l\'export PDF:', err);
      alert('Erreur lors de l\'export PDF');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Génération de la liste de courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ Erreur</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.back()}>
            Retour
          </Button>
        </div>
      </div>
    );
  }

  if (!listeCoursesData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  const { contenu, cout_total_estime, sejour } = listeCoursesData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                📝 Liste de courses
              </h1>
              <h2 className="text-xl text-gray-700 mb-1">{sejour.nom}</h2>
              <p className="text-gray-600">
                Du {formatDate(sejour.date_debut)} au {formatDate(sejour.date_fin)}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => router.back()}
                variant="outline"
              >
                ← Retour
              </Button>
              <Button
                onClick={exporterPDF}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                📄 Export PDF
              </Button>
            </div>
          </div>

          {/* Résumé */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{contenu.resume.nombre_participants}</div>
              <div className="text-sm text-gray-600">Participants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{contenu.resume.nombre_repas}</div>
              <div className="text-sm text-gray-600">Repas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{contenu.resume.nombre_recettes}</div>
              <div className="text-sm text-gray-600">Recettes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{contenu.ingredients.length}</div>
              <div className="text-sm text-gray-600">Ingrédients</div>
            </div>
          </div>
        </div>

        {/* Liste des ingrédients par catégorie */}
        <div className="space-y-6">
          {Object.entries(contenu.categories).map(([categorie, ingredients]) => {
            if (!ingredients || ingredients.length === 0) return null;
            
            return (
              <div key={categorie} className="bg-white rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {categorieLabels[categorie as CategorieIngredient] || categorie}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {ingredients.length} ingrédient{ingredients.length > 1 ? 's' : ''}
                  </p>
                </div>
                
                <div className="p-4">
                  <div className="space-y-3">
                    {ingredients.map((ingredient) => (
                      <div 
                        key={ingredient.ingredient_id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {ingredient.nom}
                          </div>
                          {ingredient.recettes_utilisees.length > 0 && (
                            <div className="text-sm text-gray-600 mt-1">
                              Utilisé dans : {ingredient.recettes_utilisees.join(', ')}
                            </div>
                          )}
                          {ingredient.notes.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              Notes : {ingredient.notes.join(', ')}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {/* Quantité modifiable */}
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={getQuantiteAffichee(ingredient)}
                              onChange={(e) => updateQuantite(
                                ingredient.ingredient_id,
                                parseFloat(e.target.value) || 0,
                                getUniteAffichee(ingredient)
                              )}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600 min-w-[3rem]">
                              {getUniteAffichee(ingredient)}
                            </span>
                          </div>
                          
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ingrédients non catégorisés */}
        {contenu.ingredients.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm mt-6">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                📋 Liste complète
              </h3>
              <p className="text-sm text-gray-600">
                Tous les ingrédients ({contenu.ingredients.length})
              </p>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {contenu.ingredients.map((ingredient) => (
                  <div 
                    key={ingredient.ingredient_id}
                    className="flex justify-between items-center p-2 text-sm"
                  >
                    <span className="text-gray-900">{ingredient.nom}</span>
                    <span className="text-gray-600">
                      {getQuantiteAffichee(ingredient)} {getUniteAffichee(ingredient)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions en bas */}
        <div className="mt-8 flex justify-center space-x-4">
          <Button
            onClick={() => router.push(`/sejours/${sejourId}/planification`)}
            variant="outline"
          >
            📅 Retour à la planification
          </Button>
          <Button
            onClick={exporterPDF}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            📄 Télécharger PDF
          </Button>
        </div>
      </div>
    </div>
  );
}