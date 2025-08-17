import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { RecetteFormData, RecetteIngredientFormData, RecetteUstensileFormData, RecetteComplete } from '@/types/tidimondo';

// Client Supabase avec service role pour les opérations admin
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Schéma de validation pour la création de recette
const recetteCreateSchema = z.object({
  recette: z.object({
    nom: z.string().min(3, 'Le nom doit contenir au moins 3 caractères').max(100),
    description: z.string().max(500).optional(),
    instructions: z.string().min(10, 'Les instructions doivent contenir au moins 10 caractères'),
    temps_preparation: z.number().min(1).max(480).optional(),
    temps_cuisson: z.number().min(0).max(480).optional(),
    portions: z.number().min(1).max(20),
    difficulte: z.number().min(1).max(5).optional(),
    regime_alimentaire: z.array(z.enum(['vegetarien', 'vegan', 'sans_gluten', 'sans_lactose', 'halal', 'casher'])).default([]),
    type_repas: z.array(z.enum(['petit_dejeuner', 'dejeuner', 'diner', 'collation', 'apero'])).default([]),
    saison: z.array(z.enum(['printemps', 'ete', 'automne', 'hiver'])).optional(),
    is_public: z.boolean().default(false),
    notes_personnelles: z.string().optional()
  }),
  ingredients: z.array(z.object({
    ingredient_id: z.string().uuid(),
    quantite: z.number().positive(),
    unite: z.enum(['g', 'kg', 'ml', 'l', 'piece', 'cuillere_soupe', 'cuillere_cafe', 'pincee', 'verre']),
    optionnel: z.boolean().default(false),
    notes: z.string().optional()
  })).default([]),
  ustensiles: z.array(z.object({
    ustensile_id: z.string().uuid(),
    obligatoire: z.boolean().default(false),
    notes: z.string().optional()
  })).default([])
});

// Fonction utilitaire pour normaliser les chaînes
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Fonction pour vérifier les limitations freemium
async function checkFreemiumLimitations(clerkUserId: string, ingredientsCount: number, userUuid: string) {
  // Vérifier l'abonnement de l'utilisateur
  const { data: user } = await supabase
    .from('users')
    .select('subscription_status')
    .eq('clerk_user_id', clerkUserId)
    .single();

  const hasProAccess = user?.subscription_status === 'active';

  if (!hasProAccess) {
    // Vérifier le nombre de recettes existantes
    const { count: existingRecettes } = await supabase
      .from('recettes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userUuid);

    if ((existingRecettes || 0) >= 5) {
      throw new Error('Limite de 5 recettes atteinte. Passez au plan Pro pour créer plus de recettes.');
    }

    // Vérifier le nombre d'ingrédients par recette
    if (ingredientsCount > 15) {
      throw new Error('Limite de 15 ingrédients par recette. Passez au plan Pro pour ajouter plus d\'ingrédients.');
    }
  }

  return hasProAccess;
}

// GET - Liste des recettes utilisateur
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer l'UUID de l'utilisateur depuis la table users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const userId = userData.id;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50); // Max 50 par page
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';
    
    // Paramètres de filtrage
    const search = searchParams.get('search');
    const difficulte = searchParams.get('difficulte');
    const tempsMax = searchParams.get('temps_max');
    const typeRepas = searchParams.get('type_repas');
    const regimeAlimentaire = searchParams.get('regime_alimentaire');

    const offset = (page - 1) * limit;

    // Construction de la requête avec filtres
    let query = supabase
      .from('recettes')
      .select(`
        *,
        recette_ingredients (
          id,
          quantite,
          unite,
          optionnel,
          notes,
          ordre_affichage,
          ingredient:ingredients (
            id,
            nom,
            categorie,
            unite_base,
            allergenes
          )
        ),
        recette_ustensiles (
          id,
          obligatoire,
          notes,
          ustensile:ustensiles (
            id,
            nom,
            categorie
          )
        )
      `, { count: 'exact' })
      .eq('user_id', userId);

    // Application des filtres
    if (search) {
      query = query.or(`nom.ilike.%${search}%,description.ilike.%${search}%,instructions.ilike.%${search}%`);
    }
    
    if (difficulte) {
      query = query.eq('difficulte', parseInt(difficulte));
    }
    
    if (tempsMax) {
      const maxTime = parseInt(tempsMax);
      query = query.or(`temps_preparation.lte.${maxTime},temps_cuisson.lte.${maxTime}`);
    }
    
    if (typeRepas) {
      query = query.contains('type_repas', [typeRepas]);
    }
    
    if (regimeAlimentaire) {
      query = query.contains('regime_alimentaire', [regimeAlimentaire]);
    }

    // Application du tri et pagination
    const { data: recettes, error, count } = await query
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erreur récupération recettes:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        recettes: recettes || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
          hasMore: (count || 0) > offset + limit
        }
      }
    });

  } catch (error) {
    console.error('Erreur GET /api/recettes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur serveur' 
      },
      { status: 500 }
    );
  }
}

// POST - Création nouvelle recette
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer l'UUID de l'utilisateur depuis la table users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const userId = userData.id;

    const body = await request.json();
    
    // Validation des données
    const validatedData = recetteCreateSchema.parse(body);
    const { recette, ingredients, ustensiles } = validatedData;

    // Vérification des limitations freemium
    await checkFreemiumLimitations(clerkUserId, ingredients.length, userId);

    // Début de la transaction
    const { data: newRecette, error: recetteError } = await supabase
      .from('recettes')
      .insert({
        ...recette,
        user_id: userId,
        nom_normalise: normalizeString(recette.nom),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (recetteError) {
      console.error('Erreur création recette:', recetteError);
      throw recetteError;
    }

    // Insertion des ingrédients
    if (ingredients.length > 0) {
      const { error: ingredientsError } = await supabase
        .from('recette_ingredients')
        .insert(
          ingredients.map((ing, index) => ({
            recette_id: newRecette.id,
            ingredient_id: ing.ingredient_id,
            quantite: ing.quantite,
            unite: ing.unite,
            optionnel: ing.optionnel,
            notes: ing.notes,
            ordre_affichage: index + 1,
            created_at: new Date().toISOString()
          }))
        );

      if (ingredientsError) {
        console.error('Erreur insertion ingrédients:', ingredientsError);
        // Rollback - supprimer la recette créée
        await supabase.from('recettes').delete().eq('id', newRecette.id);
        throw ingredientsError;
      }
    }

    // Insertion des ustensiles
    if (ustensiles.length > 0) {
      const { error: ustensilesError } = await supabase
        .from('recette_ustensiles')
        .insert(
          ustensiles.map((ust) => ({
            recette_id: newRecette.id,
            ustensile_id: ust.ustensile_id,
            obligatoire: ust.obligatoire,
            notes: ust.notes,
            created_at: new Date().toISOString()
          }))
        );

      if (ustensilesError) {
        console.error('Erreur insertion ustensiles:', ustensilesError);
        // Rollback - supprimer la recette et les ingrédients
        await supabase.from('recette_ingredients').delete().eq('recette_id', newRecette.id);
        await supabase.from('recettes').delete().eq('id', newRecette.id);
        throw ustensilesError;
      }
    }

    // Récupération de la recette complète avec relations
    const { data: recetteComplete, error: fetchError } = await supabase
      .from('recettes')
      .select(`
        *,
        recette_ingredients (
          id,
          quantite,
          unite,
          optionnel,
          notes,
          ordre_affichage,
          ingredient:ingredients (
            id,
            nom,
            categorie,
            unite_base,
            prix_moyen_euro,
            allergenes
          )
        ),
        recette_ustensiles (
          id,
          obligatoire,
          notes,
          ustensile:ustensiles (
            id,
            nom,
            categorie
          )
        )
      `)
      .eq('id', newRecette.id)
      .single();

    if (fetchError) {
      console.error('Erreur récupération recette complète:', fetchError);
      throw fetchError;
    }

    return NextResponse.json({
      success: true,
      data: { recette: recetteComplete }
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur POST /api/recettes:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Données invalides', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur serveur' 
      },
      { status: 500 }
    );
  }
}