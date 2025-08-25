import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { SejourFormData } from '@/types/tidimondo';

// GET /api/sejours/[id] - Récupérer un séjour spécifique avec ses données complètes
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

    // Récupération du séjour avec vérification de propriété
    const { data: sejour, error: sejourError } = await supabase
      .from('sejours')
      .select('*')
      .eq('id', sejourId)
      .eq('user_id', userId)
      .single();

    if (sejourError || !sejour) {
      return NextResponse.json(
        { error: { message: 'Séjour non trouvé' } },
        { status: 404 }
      );
    }

    // Récupération des participants
    const { data: participants, error: participantsError } = await supabase
      .from('sejour_participants')
      .select('*')
      .eq('sejour_id', sejourId)
      .order('created_at');

    if (participantsError) {
      console.error('Erreur lors de la récupération des participants:', participantsError);
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
          type_repas
        )
      `)
      .eq('sejour_id', sejourId)
      .order('date_repas')
      .order('ordre_dans_journee');

    if (repasError) {
      console.error('Erreur lors de la récupération des repas:', repasError);
    }

    // Récupération des listes de courses
    const { data: listesCourses, error: listesError } = await supabase
      .from('listes_courses')
      .select('*')
      .eq('sejour_id', sejourId)
      .order('date_generation', { ascending: false });

    if (listesError) {
      console.error('Erreur lors de la récupération des listes de courses:', listesError);
    }

    // Calcul des statistiques
    const nombreParticipantsSaisis = participants?.length || 0;
    const nombreRepasPlannifies = repas?.filter(r => r.recette_id).length || 0;
    const joursAvecRepas = new Set(repas?.map(r => r.date_repas)).size;
    const coutTotalRepas = repas?.reduce((total, r) => total + (r.cout_estime || 0), 0) || null;

    const sejourComplet = {
      ...sejour,
      participants: participants || [],
      repas: repas || [],
      listes_courses: listesCourses || [],
      statistiques: {
        nombre_participants_saisis: nombreParticipantsSaisis,
        nombre_repas_planifies: nombreRepasPlannifies,
        nombre_jours_avec_repas: joursAvecRepas,
        cout_total_repas: coutTotalRepas,
      },
    };

    return NextResponse.json({
      data: sejourComplet,
    });
  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: { message: 'Erreur serveur interne' } },
      { status: 500 }
    );
  }
}

// PUT /api/sejours/[id] - Mettre à jour un séjour
export async function PUT(
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

    const body: Partial<SejourFormData> = await request.json();
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
    const { data: existingSejour, error: checkError } = await supabase
      .from('sejours')
      .select('id')
      .eq('id', sejourId)
      .eq('user_id', userId)
      .single();

    if (checkError || !existingSejour) {
      return NextResponse.json(
        { error: { message: 'Séjour non trouvé' } },
        { status: 404 }
      );
    }

    // Validation des dates si fournies
    if (body.date_debut && body.date_fin) {
      if (new Date(body.date_fin) < new Date(body.date_debut)) {
        return NextResponse.json(
          { error: { message: 'La date de fin doit être postérieure à la date de début' } },
          { status: 400 }
        );
      }
    }

    // Validation du nombre de participants
    if (body.nombre_participants !== undefined && body.nombre_participants < 1) {
      return NextResponse.json(
        { error: { message: 'Le nombre de participants doit être au moins 1' } },
        { status: 400 }
      );
    }

    // Préparation des données à mettre à jour
    const updateData: any = {};
    const allowedFields = [
      'nom', 'description', 'lieu', 'date_debut', 'date_fin',
      'nombre_participants', 'type_sejour', 'budget_prevu', 'notes', 'statut'
    ];

    allowedFields.forEach(field => {
      if (body[field as keyof SejourFormData] !== undefined) {
        updateData[field] = body[field as keyof SejourFormData];
      }
    });

    // Mise à jour du séjour
    const { data: sejour, error: updateError } = await supabase
      .from('sejours')
      .update(updateData)
      .eq('id', sejourId)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur lors de la mise à jour du séjour:', updateError);
      return NextResponse.json(
        { error: { message: 'Erreur lors de la mise à jour du séjour' } },
        { status: 500 }
      );
    }

    // Mise à jour des participants si fournis
    if (body.participants) {
      // Suppression des anciens participants
      await supabase
        .from('sejour_participants')
        .delete()
        .eq('sejour_id', sejourId);

      // Ajout des nouveaux participants
      if (body.participants.length > 0) {
        const participantsData = body.participants.map(participant => ({
          sejour_id: sejourId,
          nom: participant.nom,
          email: participant.email || null,
          regime_alimentaire: participant.regime_alimentaire || [],
          allergies: participant.allergies || [],
          preferences: participant.preferences || null,
          notes: participant.notes || null,
        }));

        const { error: participantsError } = await supabase
          .from('sejour_participants')
          .insert(participantsData);

        if (participantsError) {
          console.error('Erreur lors de la mise à jour des participants:', participantsError);
        }
      }
    }

    return NextResponse.json({
      data: sejour,
    });
  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: { message: 'Erreur serveur interne' } },
      { status: 500 }
    );
  }
}

// DELETE /api/sejours/[id] - Supprimer un séjour
export async function DELETE(
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
    const { data: existingSejour, error: checkError } = await supabase
      .from('sejours')
      .select('id')
      .eq('id', sejourId)
      .eq('user_id', userId)
      .single();

    if (checkError || !existingSejour) {
      return NextResponse.json(
        { error: { message: 'Séjour non trouvé' } },
        { status: 404 }
      );
    }

    // Suppression du séjour (les suppressions en cascade sont gérées par la DB)
    const { error: deleteError } = await supabase
      .from('sejours')
      .delete()
      .eq('id', sejourId);

    if (deleteError) {
      console.error('Erreur lors de la suppression du séjour:', deleteError);
      return NextResponse.json(
        { error: { message: 'Erreur lors de la suppression du séjour' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: { message: 'Séjour supprimé avec succès' },
    });
  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: { message: 'Erreur serveur interne' } },
      { status: 500 }
    );
  }
}