import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { BlogArticleFormData } from '@/types/blog';
import {
  canUserEditArticle,
  getUserBlogSubscriptionInfo
} from '@/lib/blog-server-utils';
import { extractExcerpt } from '@/lib/blog-utils';
import { generateUniqueSlug } from '@/lib/blog-server-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Schéma de validation pour la mise à jour d'article
const articleUpdateSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères').max(200).optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(50, 'Le contenu doit contenir au moins 50 caractères').optional(),
  category_id: z.string().uuid().nullable().optional(),
  featured_image_url: z.string().url().nullable().optional(),
  is_featured: z.boolean().optional(),
  status: z.enum(['draft', 'pending', 'published', 'archived']).optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
});

// GET /api/blog/articles/[id] - Récupérer un article spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: articleId } = await params;

    // Vérifier l'authentification pour les articles non publiés
    const { userId: clerkUserId } = await auth();
    let userInfo = null;

    if (clerkUserId) {
      try {
        userInfo = await getUserBlogSubscriptionInfo(clerkUserId);
      } catch (error) {
        // Utilisateur non trouvé, continuer sans authentification
      }
    }

    // Récupérer l'article avec métadonnées
    const { data: article, error } = await supabase
      .from('blog_articles_with_metadata')
      .select('*')
      .eq('id', articleId)
      .single();

    if (error || !article) {
      return NextResponse.json(
        { error: 'Article non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier les permissions de lecture
    const canRead = 
      article.status === 'published' || // Article publié
      (userInfo && article.user_id === userInfo.userId) || // Auteur
      (userInfo && userInfo.isAdmin); // Admin

    if (!canRead) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Incrémenter le compteur de vues pour les articles publiés
    if (article.status === 'published') {
      await supabase
        .from('blog_articles')
        .update({ view_count: article.view_count + 1 })
        .eq('id', articleId);
      
      article.view_count += 1;
    }

    return NextResponse.json({ data: article });
  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

// PUT /api/blog/articles/[id] - Mettre à jour un article
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { id: articleId } = await params;

    // Vérifier les permissions de modification
    const canEdit = await canUserEditArticle(clerkUserId, articleId);
    if (!canEdit.allowed) {
      return NextResponse.json(
        { error: canEdit.reason },
        { status: 403 }
      );
    }

    // Récupérer les informations utilisateur
    const userInfo = await getUserBlogSubscriptionInfo(clerkUserId);

    // Récupérer l'article existant
    const { data: existingArticle, error: fetchError } = await supabase
      .from('blog_articles')
      .select('*')
      .eq('id', articleId)
      .single();

    if (fetchError || !existingArticle) {
      return NextResponse.json(
        { error: 'Article non trouvé' },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Validation des données
    const validatedData = articleUpdateSchema.parse(body);

    // Vérifier la longueur du contenu selon le plan
    if (validatedData.content && !userInfo.isAdmin && userInfo.limits) {
      if (validatedData.content.length > userInfo.limits.max_article_length) {
        return NextResponse.json(
          { 
            error: `Le contenu ne peut pas dépasser ${userInfo.limits.max_article_length} caractères. Votre article en contient ${validatedData.content.length}.` 
          },
          { status: 400 }
        );
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {};

    if (validatedData.title) {
      updateData.title = validatedData.title;
      // Régénérer le slug si le titre change
      if (validatedData.title !== existingArticle.title) {
        updateData.slug = await generateUniqueSlug(validatedData.title, articleId);
      }
    }

    if (validatedData.content) {
      updateData.content = validatedData.content;
      // Régénérer l'extrait si le contenu change et pas d'extrait fourni
      if (!validatedData.excerpt && validatedData.content !== existingArticle.content) {
        updateData.excerpt = extractExcerpt(validatedData.content);
      }
    }

    if (validatedData.excerpt !== undefined) {
      updateData.excerpt = validatedData.excerpt;
    }

    if (validatedData.category_id !== undefined) {
      updateData.category_id = validatedData.category_id;
    }

    if (validatedData.featured_image_url !== undefined) {
      updateData.featured_image_url = validatedData.featured_image_url;
    }

    // Seuls les admins peuvent modifier is_featured
    if (validatedData.is_featured !== undefined && userInfo.isAdmin) {
      updateData.is_featured = validatedData.is_featured;
    }

    // Gestion du statut
    if (validatedData.status !== undefined) {
      // Les utilisateurs non-admin ne peuvent pas publier directement
      if (!userInfo.isAdmin && validatedData.status === 'published') {
        return NextResponse.json(
          { error: 'Seuls les administrateurs peuvent publier directement des articles' },
          { status: 403 }
        );
      }

      updateData.status = validatedData.status;

      // Mettre à jour published_at si on publie
      if (validatedData.status === 'published' && existingArticle.status !== 'published') {
        updateData.published_at = new Date().toISOString();
      }
    }

    updateData.updated_at = new Date().toISOString();

    // Mettre à jour l'article
    const { data: updatedArticle, error: updateError } = await supabase
      .from('blog_articles')
      .update(updateData)
      .eq('id', articleId)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur lors de la mise à jour de l\'article:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de l\'article' },
        { status: 500 }
      );
    }

    // Mettre à jour les tags si fournis
    if (validatedData.tag_ids !== undefined) {
      // Supprimer les anciens tags
      await supabase
        .from('blog_article_tags')
        .delete()
        .eq('article_id', articleId);

      // Ajouter les nouveaux tags
      if (validatedData.tag_ids.length > 0) {
        const tagInserts = validatedData.tag_ids.map(tagId => ({
          article_id: articleId,
          tag_id: tagId,
        }));

        const { error: tagsError } = await supabase
          .from('blog_article_tags')
          .insert(tagInserts);

        if (tagsError) {
          console.error('Erreur lors de la mise à jour des tags:', tagsError);
          // Ne pas faire échouer la mise à jour pour les tags
        }
      }
    }

    // Récupérer l'article complet avec métadonnées
    const { data: completeArticle, error: fetchCompleteError } = await supabase
      .from('blog_articles_with_metadata')
      .select('*')
      .eq('id', articleId)
      .single();

    if (fetchCompleteError) {
      console.error('Erreur lors de la récupération de l\'article:', fetchCompleteError);
      return NextResponse.json({ data: updatedArticle });
    }

    return NextResponse.json({ data: completeArticle });
  } catch (error) {
    if (error instanceof z.ZodError) {
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

// DELETE /api/blog/articles/[id] - Supprimer un article
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { id: articleId } = await params;

    // Vérifier les permissions de suppression
    const canEdit = await canUserEditArticle(clerkUserId, articleId);
    if (!canEdit.allowed) {
      return NextResponse.json(
        { error: canEdit.reason },
        { status: 403 }
      );
    }

    // Supprimer l'article (les tags et commentaires seront supprimés en cascade)
    const { error } = await supabase
      .from('blog_articles')
      .delete()
      .eq('id', articleId);

    if (error) {
      console.error('Erreur lors de la suppression de l\'article:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de l\'article' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Article supprimé avec succès' });
  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}