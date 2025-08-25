import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { BlogCategory, BlogCategoryFormData } from '@/types/blog';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/blog/categories - Récupérer toutes les catégories
export async function GET(request: NextRequest) {
  try {
    // Récupérer les catégories de la base de données
    const { data: categories, error } = await supabase
      .from('blog_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des catégories' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: categories || [] });
  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

// POST /api/blog/categories - Créer une nouvelle catégorie (admin seulement)
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

    const body: BlogCategoryFormData = await request.json();
    
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
    const { data: existingCategory } = await supabase
      .from('blog_categories')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Une catégorie avec ce nom existe déjà' },
        { status: 400 }
      );
    }

    // Créer la catégorie
    const { data: newCategory, error } = await supabase
      .from('blog_categories')
      .insert({
        name: body.name,
        slug,
        description: body.description || null,
        color: body.color,
        sort_order: body.sort_order || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de la catégorie:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la catégorie' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: newCategory }, { status: 201 });
  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}