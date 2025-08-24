import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { BlogTagFormData } from '@/types/blog';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/blog/tags - Récupérer tous les tags
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query = supabase
      .from('blog_tags')
      .select('*')
      .order('name', { ascending: true });

    // Filtrer par recherche si fournie
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: tags, error } = await query;

    if (error) {
      console.error('Erreur lors de la récupération des tags:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des tags' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: tags });
  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

// POST /api/blog/tags - Créer un nouveau tag (admin seulement)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier si l'utilisateur est admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !user?.is_admin) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const body: BlogTagFormData = await request.json();
    
    // Validation des données
    if (!body.name || !body.color) {
      return NextResponse.json(
        { error: 'Le nom et la couleur sont requis' },
        { status: 400 }
      );
    }

    // Générer le slug
    const slug = body.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Vérifier l'unicité du slug
    const { data: existingTag } = await supabase
      .from('blog_tags')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingTag) {
      return NextResponse.json(
        { error: 'Un tag avec ce nom existe déjà' },
        { status: 400 }
      );
    }

    // Créer le tag
    const { data: newTag, error } = await supabase
      .from('blog_tags')
      .insert({
        name: body.name,
        slug,
        color: body.color,
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création du tag:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la création du tag' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: newTag }, { status: 201 });
  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}