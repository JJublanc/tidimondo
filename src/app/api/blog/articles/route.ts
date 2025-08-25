import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { 
  BlogArticleFormData, 
  BlogArticleFilters, 
  BlogArticleWithMetadata,
  BlogArticleStatus 
} from '@/types/blog';
import {
  canUserCreateArticle,
  getInitialArticleStatus,
  getUserBlogSubscriptionInfo
} from '@/lib/blog-server-utils';
import { extractExcerpt } from '@/lib/blog-utils';
import { generateUniqueSlug } from '@/lib/blog-server-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Schéma de validation pour la création d'article
const articleCreateSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères').max(200),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(50, 'Le contenu doit contenir au moins 50 caractères'),
  category_id: z.string().uuid().optional(),
  featured_image_url: z.string().url().optional(),
  is_featured: z.boolean().default(false),
  status: z.enum(['draft', 'pending', 'published', 'archived']).optional(),
  tag_ids: z.array(z.string().uuid()).default([]),
});

// GET /api/blog/articles - Récupérer les articles avec filtres et pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const offset = (page - 1) * limit;

    // Vérifier l'authentification pour déterminer les permissions
    const { userId: clerkUserId } = await auth();
    let userInfo = null;

    if (clerkUserId) {
      try {
        userInfo = await getUserBlogSubscriptionInfo(clerkUserId);
      } catch (error) {
        // Utilisateur non trouvé, continuer sans authentification
      }
    }

    // Filtres optionnels
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const myArticlesOnly = searchParams.get('my_articles_only') === 'true';

    // Construire la requête selon les permissions
    let query = supabase
      .from('blog_articles_with_metadata')
      .select('*', { count: 'exact' });

    // Filtres selon les permissions
    if (!userInfo) {
      // Visiteurs non connectés : seulement les articles publiés
      query = query.eq('status', 'published');
    } else if (userInfo.isAdmin) {
      // Admins : tous les articles
      // Pas de filtre supplémentaire
    } else if (myArticlesOnly) {
      // Utilisateurs premium en mode "gestion" : seulement LEURS articles
      query = query.eq('user_id', userInfo.userId);
    } else {
      // Utilisateurs connectés en mode "lecture" : articles publiés + leurs propres articles
      query = query.or(`status.eq.published,user_id.eq.${userInfo.userId}`);
    }

    if (category) {
      query = query.eq('category_slug', category);
    }

    if (status && userInfo?.isAdmin) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // Pagination et tri
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: articles, error, count } = await query;

    if (error) {
      console.error('Erreur lors de la récupération des articles:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des articles' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: articles || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

// POST /api/blog/articles - Créer un nouvel article
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier les permissions de création
    const canCreate = await canUserCreateArticle(clerkUserId);
    if (!canCreate.allowed) {
      return NextResponse.json(
        { error: canCreate.reason },
        { status: 403 }
      );
    }

    // Récupérer les informations utilisateur
    const userInfo = await getUserBlogSubscriptionInfo(clerkUserId);

    const body = await request.json();
    console.log('📝 Données reçues pour création article:', body);
    
    // Validation des données
    const validatedData = articleCreateSchema.parse(body);
    console.log('✅ Données validées:', validatedData);

    // Vérifier la longueur du contenu selon le plan
    if (!userInfo.isAdmin && userInfo.limits) {
      if (validatedData.content.length > userInfo.limits.max_article_length) {
        return NextResponse.json(
          { 
            error: `Le contenu ne peut pas dépasser ${userInfo.limits.max_article_length} caractères. Votre article en contient ${validatedData.content.length}.` 
          },
          { status: 400 }
        );
      }
    }

    // Générer le slug unique
    const slug = await generateUniqueSlug(validatedData.title);

    // Générer l'extrait si non fourni
    const excerpt = validatedData.excerpt || extractExcerpt(validatedData.content);

    // Déterminer le statut initial
    // Les admins peuvent choisir le statut, sinon c'est 'draft' par défaut
    const initialStatus = validatedData.status || 'draft';

    // Préparer les données d'insertion
    const articleData = {
      user_id: userInfo.userId,
      title: validatedData.title,
      slug,
      excerpt,
      content: validatedData.content,
      category_id: validatedData.category_id || null,
      featured_image_url: validatedData.featured_image_url || null,
      is_featured: userInfo.isAdmin ? validatedData.is_featured : false, // Seuls les admins peuvent mettre en avant
      status: initialStatus,
      published_at: initialStatus === 'published' ? new Date().toISOString() : null,
    };

    // Insérer l'article
    const { data: article, error } = await supabase
      .from('blog_articles')
      .insert(articleData)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de l\'article:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'article' },
        { status: 500 }
      );
    }

    // Associer les tags si fournis
    if (validatedData.tag_ids.length > 0) {
      const tagInserts = validatedData.tag_ids.map(tagId => ({
        article_id: article.id,
        tag_id: tagId,
      }));

      const { error: tagsError } = await supabase
        .from('blog_article_tags')
        .insert(tagInserts);

      if (tagsError) {
        console.error('Erreur lors de l\'association des tags:', tagsError);
        // Ne pas faire échouer la création pour les tags
      }
    }

    // Récupérer l'article complet avec métadonnées
    const { data: completeArticle, error: fetchError } = await supabase
      .from('blog_articles_with_metadata')
      .select('*')
      .eq('id', article.id)
      .single();

    if (fetchError) {
      console.error('Erreur lors de la récupération de l\'article:', fetchError);
      return NextResponse.json({ data: article });
    }

    return NextResponse.json({ data: completeArticle }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Erreur validation Zod:', error.errors);
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}