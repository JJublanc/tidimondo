import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { TypeRepas } from '@/types/tidimondo';

interface RepasFormData {
  recette_id?: string;
  date_repas: string;
  type_repas: TypeRepas;
  nombre_portions: number;
  notes?: string;
  repas_libre?: string;
  cout_estime?: number;
  ordre_dans_journee?: number;
  composition?: any; // Composition JSON du repas
}

// GET /api/sejours/[id]/repas - Récupérer tous les repas d'un séjour
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: { message: 'Non autorisé' } },
        { status: 401 }
      );
    }

    const supabase = supabaseAdmin;
    const { id: sejourId } = await params;

    // Récupérer l'UUID de l'utilisateur depuis la table users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: { message: 'Utilisateur non trouvé' } },
        { status: 404 }
      );
    }

    const userId = userData.id;

    // Vérification que le séjour appartient à l'utilisateur
    const { data: sejour, error: sejourError } = await supabase
      .from('sejours')
      .select('id')
      .eq('id', sejourId)
      .eq('user_id', userId)
      .single();

    if (sejourError || !sejour) {
      return NextResponse.json(
        { error: { message: 'Séjour non trouvé' } },
        { status: 404 }
      );
    }

    // Récupération des repas avec les recettes
    const { data: repas, error: repasError } = await supabase
      .from('sejour_repas')
      .select(`
        *,
        recette:recettes(
          id,
          nom,
          description,
          portions,
          temps_preparation,
          temps_cuisson,
          regime_alimentaire,
          type_repas,
          image_url
        )
      `)
      .eq('sejour_id', sejourId)
      .order('date_repas')
      .order('ordre_dans_journee');

    if (repasError) {
      console.error('Erreur lors de la récupération des repas:', repasError);
      return NextResponse.json(
        { error: { message: 'Erreur lors de la récupération des repas' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: repas || [],
    });
  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: { message: 'Erreur serveur interne' } },
      { status: 500 }
    );
  }
}

// POST /api/sejours/[id]/repas - Ajouter un repas à un séjour
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: { message: 'Non autorisé' } },
        { status: 401 }
      );
    }

    const body: RepasFormData = await request.json();
    const supabase = supabaseAdmin;
    const { id: sejourId } = await params;

    // Récupérer l'UUID de l'utilisateur depuis la table users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: { message: 'Utilisateur non trouvé' } },
        { status: 404 }
      );
    }

    const userId = userData.id;

    // Validation des données
    if (!body.date_repas || !body.type_repas || !body.nombre_portions) {
      return NextResponse.json(
        { error: { message: 'Date, type de repas et nombre de portions sont requis' } },
        { status: 400 }
      );
    }

    if (body.nombre_portions < 1) {
      return NextResponse.json(
        { error: { message: 'Le nombre de portions doit être au moins 1' } },
        { status: 400 }
      );
    }

    // Vérification que le séjour appartient à l'utilisateur
    const { data: sejour, error: sejourError } = await supabase
      .from('sejours')
      .select('id, date_debut, date_fin')
      .eq('id', sejourId)
      .eq('user_id', userId)
      .single();

    if (sejourError || !sejour) {
      return NextResponse.json(
        { error: { message: 'Séjour non trouvé' } },
        { status: 404 }
      );
    }

    // Vérification que la date du repas est dans la période du séjour
    const dateRepas = new Date(body.date_repas);
    const dateDebut = new Date(sejour.date_debut);
    const dateFin = new Date(sejour.date_fin);

    if (dateRepas < dateDebut || dateRepas > dateFin) {
      return NextResponse.json(
        { error: { message: 'La date du repas doit être comprise dans la période du séjour' } },
        { status: 400 }
      );
    }

    // Vérification que la recette existe si fournie
    if (body.recette_id) {
      const { data: recette, error: recetteError } = await supabase
        .from('recettes')
        .select('id')
        .eq('id', body.recette_id)
        .eq('user_id', userId)
        .single();

      if (recetteError || !recette) {
        return NextResponse.json(
          { error: { message: 'Recette non trouvée' } },
          { status: 404 }
        );
      }
    }

    // Création du repas
    const repasData = {
      sejour_id: sejourId,
      recette_id: body.recette_id || null,
      date_repas: body.date_repas,
      type_repas: body.type_repas,
      nombre_portions: body.nombre_portions,
      notes: body.notes || null,
      repas_libre: body.repas_libre || null,
      cout_estime: body.cout_estime || null,
      ordre_dans_journee: body.ordre_dans_journee || 0,
      composition: body.composition || null,
    };

    const { data: repas, error: repasError } = await supabase
      .from('sejour_repas')
      .insert(repasData)
      .select(`
        *,
        recette:recettes(
          id,
          nom,
          description,
          portions,
          temps_preparation,
          temps_cuisson,
          regime_alimentaire,
          type_repas,
          image_url
        )
      `)
      .single();

    if (repasError) {
      console.error('Erreur lors de la création du repas:', repasError);
      return NextResponse.json(
        { error: { message: 'Erreur lors de la création du repas' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: repas,
    });
  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: { message: 'Erreur serveur interne' } },
      { status: 500 }
    );
  }
}