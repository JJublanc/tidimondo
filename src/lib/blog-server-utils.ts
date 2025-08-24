import { createClient } from '@supabase/supabase-js';
import { BlogFreemiumLimits, BlogFreemiumCheckResult, BlogArticleStatus } from '@/types/blog';

// Client Supabase avec service role pour les opérations admin (côté serveur uniquement)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =====================================================
// CONSTANTES FREEMIUM
// =====================================================

export const BLOG_FREEMIUM_LIMITS: BlogFreemiumLimits = {
  articles_per_month: 0,        // Gratuit ne peut pas publier
  comments_per_day: 5,          // 5 commentaires par jour
  max_article_length: 0,        // Pas de création d'articles
  can_publish_articles: false,  // Gratuit ne peut pas publier
  can_comment: true,           // Gratuit peut commenter
};

export const BLOG_PREMIUM_LIMITS: BlogFreemiumLimits = {
  articles_per_month: 10,       // 10 articles par mois pour premium
  comments_per_day: 50,         // 50 commentaires par jour
  max_article_length: 20000,    // 20k caractères pour premium
  can_publish_articles: true,   // Premium peut publier
  can_comment: true,           // Premium peut commenter
};

// =====================================================
// FONCTIONS FREEMIUM (CÔTÉ SERVEUR)
// =====================================================

/**
 * Récupère les informations d'abonnement d'un utilisateur pour le blog
 */
export async function getUserBlogSubscriptionInfo(clerkUserId: string) {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, subscription_status, is_admin')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error || !user) {
    throw new Error('Utilisateur non trouvé');
  }

  const isAdmin = user.is_admin || false;
  const isPremium = user.subscription_status === 'active';

  return {
    userId: user.id,
    isAdmin,
    isPremium,
    hasProAccess: isPremium || isAdmin,
    limits: isAdmin ? null : (isPremium ? BLOG_PREMIUM_LIMITS : BLOG_FREEMIUM_LIMITS),
  };
}

/**
 * Vérifie si un utilisateur peut créer un article
 */
export async function canUserCreateArticle(clerkUserId: string): Promise<BlogFreemiumCheckResult> {
  try {
    const userInfo = await getUserBlogSubscriptionInfo(clerkUserId);

    // Les admins peuvent toujours créer
    if (userInfo.isAdmin) {
      return { allowed: true };
    }

    // Les utilisateurs gratuits ne peuvent pas créer d'articles
    if (!userInfo.isPremium) {
      return {
        allowed: false,
        reason: 'Vous devez avoir un abonnement Premium pour publier des articles.',
      };
    }

    // Vérifier la limite mensuelle pour les utilisateurs premium
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: articlesThisMonth, error } = await supabase
      .from('blog_articles')
      .select('id')
      .eq('user_id', userInfo.userId)
      .gte('created_at', startOfMonth.toISOString());

    if (error) {
      throw new Error(`Erreur lors de la vérification des articles: ${error.message}`);
    }

    const currentCount = articlesThisMonth.length;
    const limit = userInfo.limits?.articles_per_month || 0;

    if (currentCount >= limit) {
      const nextMonth = new Date(startOfMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      return {
        allowed: false,
        reason: `Vous avez atteint votre limite de ${limit} articles par mois.`,
        current_count: currentCount,
        limit,
        reset_date: nextMonth.toISOString(),
      };
    }

    return {
      allowed: true,
      current_count: currentCount,
      limit,
    };
  } catch (error) {
    return {
      allowed: false,
      reason: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Vérifie si un utilisateur peut commenter
 */
export async function canUserComment(clerkUserId: string): Promise<BlogFreemiumCheckResult> {
  try {
    const userInfo = await getUserBlogSubscriptionInfo(clerkUserId);

    // Les admins peuvent toujours commenter
    if (userInfo.isAdmin) {
      return { allowed: true };
    }

    // Vérifier la limite quotidienne
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data: commentsToday, error } = await supabase
      .from('blog_comments')
      .select('id')
      .eq('user_id', userInfo.userId)
      .gte('created_at', startOfDay.toISOString());

    if (error) {
      throw new Error(`Erreur lors de la vérification des commentaires: ${error.message}`);
    }

    const currentCount = commentsToday.length;
    const limit = userInfo.limits?.comments_per_day || 0;

    if (currentCount >= limit) {
      const nextDay = new Date(startOfDay);
      nextDay.setDate(nextDay.getDate() + 1);

      return {
        allowed: false,
        reason: `Vous avez atteint votre limite de ${limit} commentaires par jour.`,
        current_count: currentCount,
        limit,
        reset_date: nextDay.toISOString(),
      };
    }

    return {
      allowed: true,
      current_count: currentCount,
      limit,
    };
  } catch (error) {
    return {
      allowed: false,
      reason: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Vérifie si un utilisateur peut modifier un article
 */
export async function canUserEditArticle(
  clerkUserId: string, 
  articleId: string
): Promise<BlogFreemiumCheckResult> {
  try {
    const userInfo = await getUserBlogSubscriptionInfo(clerkUserId);

    // Récupérer l'article
    const { data: article, error } = await supabase
      .from('blog_articles')
      .select('user_id, status')
      .eq('id', articleId)
      .single();

    if (error || !article) {
      return {
        allowed: false,
        reason: 'Article non trouvé.',
      };
    }

    // Les admins peuvent modifier tous les articles
    if (userInfo.isAdmin) {
      return { allowed: true };
    }

    // Les utilisateurs ne peuvent modifier que leurs propres articles
    if (article.user_id !== userInfo.userId) {
      return {
        allowed: false,
        reason: 'Vous ne pouvez modifier que vos propres articles.',
      };
    }

    // Les utilisateurs peuvent toujours modifier leurs propres articles
    // Les admins peuvent modifier tous les articles
    return { allowed: true };
  } catch (error) {
    return {
      allowed: false,
      reason: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Détermine le statut initial d'un article selon le type d'utilisateur
 */
export function getInitialArticleStatus(isAdmin: boolean, isPremium: boolean): BlogArticleStatus {
  if (isAdmin) {
    return 'published'; // Les admins publient directement
  }
  
  if (isPremium) {
    return 'pending'; // Les premium soumettent pour modération
  }
  
  return 'draft'; // Les gratuits ne peuvent que sauvegarder en brouillon
}

// =====================================================
// FONCTIONS DE GESTION DES SLUGS (CÔTÉ SERVEUR)
// =====================================================

/**
 * Génère un slug à partir d'un titre
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9\s-]/g, '')    // Garder uniquement lettres, chiffres, espaces et tirets
    .replace(/\s+/g, '-')            // Remplacer espaces par tirets
    .replace(/-+/g, '-')             // Supprimer tirets multiples
    .replace(/^-|-$/g, '')           // Supprimer tirets en début/fin
    .trim();
}

/**
 * Vérifie si un slug est unique
 */
export async function isSlugUnique(slug: string, excludeId?: string): Promise<boolean> {
  let query = supabase
    .from('blog_articles')
    .select('id')
    .eq('slug', slug);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Erreur lors de la vérification du slug: ${error.message}`);
  }

  return data.length === 0;
}

/**
 * Génère un slug unique en ajoutant un suffixe si nécessaire
 */
export async function generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
  const baseSlug = generateSlug(title);
  let slug = baseSlug;
  let counter = 1;

  while (!(await isSlugUnique(slug, excludeId))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}