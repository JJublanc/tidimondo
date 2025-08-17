import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Client Supabase avec service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// GET - Recherche d'ingrédients avec autocomplétion
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const categorie = searchParams.get('categorie');
    const excludeAllergenes = searchParams.get('exclude_allergenes')?.split(',') || [];

    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        data: {
          ingredients: [],
          suggestions: []
        }
      });
    }

    const normalizedQuery = normalizeString(query);

    let searchQuery = supabase
      .from('ingredients')
      .select('id, nom, categorie, unite_base, allergenes, saison')
      .limit(limit);

    // Recherche fuzzy : nom exact, nom normalisé, ou contient
    searchQuery = searchQuery.or(
      `nom.ilike.${query}%,nom.ilike.%${query}%,nom_normalise.ilike.${normalizedQuery}%`
    );

    // Filtres
    if (categorie) {
      searchQuery = searchQuery.eq('categorie', categorie);
    }

    // Exclure les allergènes
    if (excludeAllergenes.length > 0) {
      for (const allergene of excludeAllergenes) {
        searchQuery = searchQuery.not('allergenes', 'cs', `{${allergene}}`);
      }
    }

    // Tri par pertinence : exact match en premier, puis alphabétique
    const { data: ingredients, error } = await searchQuery
      .order('nom');

    if (error) {
      console.error('Erreur recherche ingrédients:', error);
      throw error;
    }

    // Tri personnalisé pour mettre les correspondances exactes en premier
    const sortedIngredients = (ingredients || []).sort((a, b) => {
      const aExact = a.nom.toLowerCase().startsWith(query.toLowerCase());
      const bExact = b.nom.toLowerCase().startsWith(query.toLowerCase());
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      return a.nom.localeCompare(b.nom);
    });

    // Générer des suggestions si peu de résultats
    let suggestions: string[] = [];
    if (sortedIngredients.length < 3) {
      const { data: suggestionData } = await supabase
        .from('ingredients')
        .select('nom')
        .ilike('nom', `%${query.split(' ')[0]}%`)
        .limit(5);
      
      suggestions = (suggestionData || [])
        .map(item => item.nom)
        .filter(nom => !sortedIngredients.some(ing => ing.nom === nom));
    }

    return NextResponse.json({
      success: true,
      data: {
        ingredients: sortedIngredients,
        suggestions,
        query: query,
        total: sortedIngredients.length
      }
    });

  } catch (error) {
    console.error('Erreur GET /api/ingredients/search:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur serveur' 
      },
      { status: 500 }
    );
  }
}