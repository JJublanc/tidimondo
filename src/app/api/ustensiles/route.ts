import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
  getUserSubscriptionInfo,
  canCreatePrivateUstensile,
  addVisibilityFilter
} from '@/lib/freemium-utils';

// Client Supabase avec service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Schéma de validation pour la création d'ustensile
const ustensileCreateSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  categorie: z.enum(['cuisson', 'preparation', 'service', 'mesure', 'autre']),
  description: z.string().max(500).optional(),
  obligatoire_defaut: z.boolean().default(false),
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

// GET - Liste des ustensiles avec recherche et filtres
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const search = searchParams.get('search') || '';
    const categorie = searchParams.get('categorie');

    const offset = (page - 1) * limit;

    let query = supabase
      .from('ustensiles')
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

    // Filtre par catégorie
    if (categorie) {
      query = query.eq('categorie', categorie);
    }

    // Tri et pagination
    const { data: ustensiles, error, count } = await query
      .order('categorie')
      .order('nom')
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erreur récupération ustensiles:', error);
      throw error;
    }

    // Grouper par catégorie pour faciliter l'affichage
    const ustensilesGroupes = (ustensiles || []).reduce((acc, ustensile) => {
      if (!acc[ustensile.categorie]) {
        acc[ustensile.categorie] = [];
      }
      acc[ustensile.categorie].push(ustensile);
      return acc;
    }, {} as Record<string, typeof ustensiles>);

    return NextResponse.json({
      success: true,
      data: {
        ustensiles: ustensiles || [],
        ustensilesGroupes,
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
    console.error('Erreur GET /api/ustensiles:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur serveur' 
      },
      { status: 500 }
    );
  }
}

// POST - Création d'un ustensile personnalisé
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validation des données
    const validatedData = ustensileCreateSchema.parse(body);

    // Récupérer les informations utilisateur
    const userInfo = await getUserSubscriptionInfo(clerkUserId);

    // Vérifier les limitations freemium pour les ustensiles privés
    const { canCreate, message } = await canCreatePrivateUstensile(clerkUserId, validatedData.is_public);
    
    if (!canCreate && message) {
      return NextResponse.json(
        {
          success: false,
          error: message
        },
        { status: 403 }
      );
    }

    // Vérifier si l'ustensile existe déjà (seulement parmi les ustensiles publics et ceux de l'utilisateur)
    const nomNormalise = normalizeString(validatedData.nom);
    let existingQuery = supabase
      .from('ustensiles')
      .select('id, nom, is_public, user_id')
      .eq('nom_normalise', nomNormalise);

    // Appliquer le filtrage de visibilité pour la vérification de doublons
    existingQuery = addVisibilityFilter(existingQuery, userInfo.userId, true);
    
    const { data: existingUstensile } = await existingQuery.single();

    if (existingUstensile) {
      return NextResponse.json(
        {
          success: false,
          error: `Un ustensile similaire existe déjà : ${existingUstensile.nom}`,
          existing: existingUstensile
        },
        { status: 409 }
      );
    }

    // Créer l'ustensile
    const { data: newUstensile, error } = await supabase
      .from('ustensiles')
      .insert({
        ...validatedData,
        nom_normalise: nomNormalise,
        user_id: userInfo.userId
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur création ustensile:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: { ustensile: newUstensile }
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur POST /api/ustensiles:', error);
    
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