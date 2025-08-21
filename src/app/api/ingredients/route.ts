import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
  getUserSubscriptionInfo,
  canCreatePrivateIngredient,
  addVisibilityFilter
} from '@/lib/freemium-utils';

// Client Supabase avec service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Schéma de validation pour la création d'ingrédient
const ingredientCreateSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  categorie: z.enum(['legume', 'fruit', 'viande', 'poisson', 'feculent', 'produit_laitier', 'epice', 'condiment', 'boisson', 'autre']),
  unite_base: z.enum(['g', 'kg', 'ml', 'l', 'piece']),
  prix_moyen: z.number().positive().optional(),
  allergenes: z.array(z.enum(['gluten', 'lactose', 'oeuf', 'arachide', 'fruits_coque', 'soja', 'poisson', 'crustace'])).default([]),
  // regime_alimentaire: z.array(z.enum(['vegetarien', 'vegan', 'sans_gluten', 'sans_lactose', 'halal', 'casher'])).default([]), // Temporairement désactivé - colonne pas encore créée en DB
  saison: z.array(z.enum(['printemps', 'ete', 'automne', 'hiver'])).optional(),
  description: z.string().max(500).optional(),
  is_public: z.boolean().default(false)
});

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// GET - Liste des ingrédients avec recherche et filtres
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100 par page
    const search = searchParams.get('search') || '';
    const categorie = searchParams.get('categorie');
    const saison = searchParams.get('saison');
    const allergenes = searchParams.get('allergenes')?.split(',') || [];

    const offset = (page - 1) * limit;

    let query = supabase
      .from('ingredients')
      .select('*', { count: 'exact' });

    // Si l'utilisateur est connecté, appliquer le filtrage de visibilité
    if (clerkUserId) {
      const userInfo = await getUserSubscriptionInfo(clerkUserId);
      query = addVisibilityFilter(query, userInfo.userId, true);
    } else {
      // Si non connecté, montrer seulement le contenu public
      query = query.eq('is_public', true);
    }

    // Recherche par nom
    if (search) {
      query = query.or(`nom.ilike.%${search}%,nom_normalise.ilike.%${normalizeString(search)}%`);
    }

    // Filtres
    if (categorie) {
      query = query.eq('categorie', categorie);
    }

    if (saison) {
      query = query.contains('saison', [saison]);
    }

    if (allergenes.length > 0) {
      // Exclure les ingrédients contenant les allergènes spécifiés
      for (const allergene of allergenes) {
        query = query.not('allergenes', 'cs', `{${allergene}}`);
      }
    }

    // Tri et pagination
    const { data: ingredients, error, count } = await query
      .order('nom')
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erreur récupération ingrédients:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        ingredients: ingredients || [],
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
    console.error('Erreur GET /api/ingredients:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur serveur' 
      },
      { status: 500 }
    );
  }
}

// POST - Création d'un ingrédient personnalisé
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validation des données
    const validatedData = ingredientCreateSchema.parse(body);

    // Récupérer les informations utilisateur
    const userInfo = await getUserSubscriptionInfo(clerkUserId);

    // Vérifier les limitations freemium pour les ingrédients privés
    const { canCreate, message } = await canCreatePrivateIngredient(clerkUserId, validatedData.is_public);
    
    if (!canCreate && message) {
      return NextResponse.json(
        {
          success: false,
          error: message
        },
        { status: 403 }
      );
    }

    // Vérifier si l'ingrédient existe déjà (seulement parmi les ingrédients publics et ceux de l'utilisateur)
    const nomNormalise = normalizeString(validatedData.nom);
    let existingQuery = supabase
      .from('ingredients')
      .select('id, nom, is_public, user_id')
      .eq('nom_normalise', nomNormalise);

    // Appliquer le filtrage de visibilité pour la vérification de doublons
    existingQuery = addVisibilityFilter(existingQuery, userInfo.userId, true);
    
    const { data: existingIngredient } = await existingQuery.single();

    if (existingIngredient) {
      return NextResponse.json(
        {
          success: false,
          error: `Un ingrédient similaire existe déjà : ${existingIngredient.nom}`,
          existing: existingIngredient
        },
        { status: 409 }
      );
    }

    // Créer l'ingrédient (exclure regime_alimentaire temporairement)
    const { regime_alimentaire, ...dataToInsert } = validatedData as Record<string, unknown>;
    const { data: newIngredient, error } = await supabase
      .from('ingredients')
      .insert({
        ...dataToInsert,
        nom_normalise: nomNormalise,
        user_id: userInfo.userId
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur création ingrédient:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: { ingredient: newIngredient }
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur POST /api/ingredients:', error);
    
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