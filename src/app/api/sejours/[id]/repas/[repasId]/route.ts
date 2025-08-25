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

// PUT /api/sejours/[id]/repas/[repasId] - Modifier un repas
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; repasId: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: { message: 'Non autorisé' } },
        { status: 401 }
      );
    }

    const body: Partial<RepasFormData> = await request.json();
    const supabase = supabaseAdmin;
    const { id: sejourId, repasId } = await params;

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

    // Vérification que le repas existe et appartient au séjour
    const { data: existingRepas, error: repasCheckError } = await supabase
      .from('sejour_repas')
      .select('id')
      .eq('id', repasId)
      .eq('sejour_id', sejourId)
      .single();

    if (repasCheckError || !existingRepas) {
      return NextResponse.json(
        { error: { message: 'Repas non trouvé' } },
        { status: 404 }
      );
    }

    // Validation des données si fournies
    if (body.nombre_portions !== undefined && body.nombre_portions < 1) {
      return NextResponse.json(
        { error: { message: 'Le nombre de portions doit être au moins 1' } },
        { status: 400 }
      );
    }

    // Vérification que la date du repas est dans la période du séjour
    if (body.date_repas) {
      const dateRepas = new Date(body.date_repas);
      const dateDebut = new Date(sejour.date_debut);
      const dateFin = new Date(sejour.date_fin);

      if (dateRepas < dateDebut || dateRepas > dateFin) {
        return NextResponse.json(
          { error: { message: 'La date du repas doit être comprise dans la période du séjour' } },
          { status: 400 }
        );
      }
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

    // Préparation des données à mettre à jour
    const updateData: any = {};
    const allowedFields = [
      'recette_id', 'date_repas', 'type_repas', 'nombre_portions',
      'notes', 'repas_libre', 'cout_estime', 'ordre_dans_journee', 'composition'
    ];

    allowedFields.forEach(field => {
      if (body[field as keyof RepasFormData] !== undefined) {
        updateData[field] = body[field as keyof RepasFormData];
      }
    });

    // Mise à jour du repas
    const { data: repas, error: updateError } = await supabase
      .from('sejour_repas')
      .update(updateData)
      .eq('id', repasId)
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

    if (updateError) {
      console.error('Erreur lors de la mise à jour du repas:', updateError);
      return NextResponse.json(
        { error: { message: 'Erreur lors de la mise à jour du repas' } },
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

// DELETE /api/sejours/[id]/repas/[repasId] - Supprimer un repas
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; repasId: string }> }
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
    const { id: sejourId, repasId } = await params;

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

    // Vérification que le repas existe et appartient au séjour
    const { data: existingRepas, error: repasCheckError } = await supabase
      .from('sejour_repas')
      .select('id')
      .eq('id', repasId)
      .eq('sejour_id', sejourId)
      .single();

    if (repasCheckError || !existingRepas) {
      return NextResponse.json(
        { error: { message: 'Repas non trouvé' } },
        { status: 404 }
      );
    }

    // Suppression du repas
    const { error: deleteError } = await supabase
      .from('sejour_repas')
      .delete()
      .eq('id', repasId);

    if (deleteError) {
      console.error('Erreur lors de la suppression du repas:', deleteError);
      return NextResponse.json(
        { error: { message: 'Erreur lors de la suppression du repas' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: { message: 'Repas supprimé avec succès' },
    });
  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: { message: 'Erreur serveur interne' } },
      { status: 500 }
    );
  }
}