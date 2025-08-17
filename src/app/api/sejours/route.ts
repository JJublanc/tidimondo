import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { SejourFormData, Sejour, SejourFilters } from '@/types/tidimondo';

// GET /api/sejours - Récupérer la liste des séjours de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: { message: 'Non autorisé' } },
        { status: 401 }
      );
    }

    const supabase = supabaseAdmin;
    
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
    const { searchParams } = new URL(request.url);
    
    // Paramètres de pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Filtres
    const filters: SejourFilters = {
      search: searchParams.get('search') || undefined,
      statut: searchParams.get('statut')?.split(',') as any || undefined,
      type_sejour: searchParams.get('type_sejour') as any || undefined,
      date_debut_apres: searchParams.get('date_debut_apres') || undefined,
      date_fin_avant: searchParams.get('date_fin_avant') || undefined,
    };

    // Construction de la requête
    let query = supabase
      .from('sejours')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Application des filtres
    if (filters.search) {
      query = query.ilike('nom', `%${filters.search}%`);
    }

    if (filters.statut && filters.statut.length > 0) {
      query = query.in('statut', filters.statut);
    }

    if (filters.type_sejour) {
      query = query.eq('type_sejour', filters.type_sejour);
    }

    if (filters.date_debut_apres) {
      query = query.gte('date_debut', filters.date_debut_apres);
    }

    if (filters.date_fin_avant) {
      query = query.lte('date_fin', filters.date_fin_avant);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: sejours, error, count } = await query;

    if (error) {
      console.error('Erreur lors de la récupération des séjours:', error);
      return NextResponse.json(
        { error: { message: 'Erreur lors de la récupération des séjours' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        data: sejours || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: { message: 'Erreur serveur interne' } },
      { status: 500 }
    );
  }
}

// POST /api/sejours - Créer un nouveau séjour
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: { message: 'Non autorisé' } },
        { status: 401 }
      );
    }

    const body: SejourFormData = await request.json();

    // Validation des données
    if (!body.nom || !body.date_debut || !body.date_fin) {
      return NextResponse.json(
        { error: { message: 'Nom, date de début et date de fin sont requis' } },
        { status: 400 }
      );
    }

    if (new Date(body.date_fin) < new Date(body.date_debut)) {
      return NextResponse.json(
        { error: { message: 'La date de fin doit être postérieure à la date de début' } },
        { status: 400 }
      );
    }

    if (body.nombre_participants < 1) {
      return NextResponse.json(
        { error: { message: 'Le nombre de participants doit être au moins 1' } },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;
    
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

    // Vérification des limitations pour les utilisateurs gratuits
    // TODO: Implémenter la vérification du plan utilisateur
    const { data: existingSejours, error: countError } = await supabase
      .from('sejours')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);

    if (countError) {
      console.error('Erreur lors de la vérification des séjours existants:', countError);
      return NextResponse.json(
        { error: { message: 'Erreur lors de la vérification des limitations' } },
        { status: 500 }
      );
    }

    // Limitation pour les utilisateurs gratuits (à adapter selon votre logique métier)
    // if (existingSejours && existingSejours.length >= 1 && !userIsPro) {
    //   return NextResponse.json(
    //     { error: { message: 'Limite de séjours atteinte pour le plan gratuit' } },
    //     { status: 403 }
    //   );
    // }

    // Création du séjour
    const sejourData = {
      user_id: userId,
      nom: body.nom,
      description: body.description || null,
      lieu: body.lieu || null,
      date_debut: body.date_debut,
      date_fin: body.date_fin,
      nombre_participants: body.nombre_participants,
      type_sejour: body.type_sejour || null,
      budget_prevu: body.budget_prevu || null,
      notes: body.notes || null,
      statut: body.statut || 'brouillon',
    };

    const { data: sejour, error: sejourError } = await supabase
      .from('sejours')
      .insert(sejourData)
      .select()
      .single();

    if (sejourError) {
      console.error('Erreur lors de la création du séjour:', sejourError);
      return NextResponse.json(
        { error: { message: 'Erreur lors de la création du séjour' } },
        { status: 500 }
      );
    }

    // Création des participants si fournis
    if (body.participants && body.participants.length > 0) {
      const participantsData = body.participants.map(participant => ({
        sejour_id: sejour.id,
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
        console.error('Erreur lors de la création des participants:', participantsError);
        // On continue même si les participants n'ont pas pu être créés
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