import { createClient } from '@supabase/supabase-js';

// Client Supabase avec service role pour les opérations admin
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface FreemiumLimits {
  sejours: number;
  recettes_privees: number;
  ingredients_prives: number;
  ustensiles_prives: number;
}

export const FREEMIUM_LIMITS: FreemiumLimits = {
  sejours: 1,
  recettes_privees: 5,
  ingredients_prives: 10,
  ustensiles_prives: 5,
};

// Limites spécifiques au blog
export const BLOG_FREEMIUM_LIMITS = {
  articles_per_month: 0,        // Gratuit ne peut pas publier
  comments_per_day: 5,          // 5 commentaires par jour
  max_article_length: 0,        // Pas de création d'articles
  can_publish_articles: false,  // Gratuit ne peut pas publier
  can_comment: true,           // Gratuit peut commenter
};

export const BLOG_PREMIUM_LIMITS = {
  articles_per_month: 10,       // 10 articles par mois pour premium
  comments_per_day: 50,         // 50 commentaires par jour
  max_article_length: 20000,    // 20k caractères pour premium
  can_publish_articles: true,   // Premium peut publier
  can_comment: true,           // Premium peut commenter
};

export interface UserSubscriptionInfo {
  hasProAccess: boolean;
  subscriptionStatus: string | null;
  userId: string;
}

/**
 * Récupère les informations d'abonnement d'un utilisateur
 */
export async function getUserSubscriptionInfo(clerkUserId: string): Promise<UserSubscriptionInfo> {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, subscription_status')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error || !user) {
    throw new Error('Utilisateur non trouvé');
  }

  return {
    hasProAccess: user.subscription_status === 'active',
    subscriptionStatus: user.subscription_status,
    userId: user.id,
  };
}

/**
 * Vérifie si un utilisateur peut créer un nouveau séjour
 */
export async function canCreateSejour(clerkUserId: string): Promise<{ canCreate: boolean; message?: string }> {
  const userInfo = await getUserSubscriptionInfo(clerkUserId);
  
  if (userInfo.hasProAccess) {
    return { canCreate: true };
  }

  // Utiliser la fonction de base de données pour compter les séjours
  const { data, error } = await supabase
    .rpc('count_user_sejours', { user_clerk_id: clerkUserId });

  if (error) {
    console.error('Erreur lors du comptage des séjours:', error);
    throw new Error('Erreur lors de la vérification des limitations');
  }

  const currentCount = data || 0;
  
  if (currentCount >= FREEMIUM_LIMITS.sejours) {
    return {
      canCreate: false,
      message: `Limite de ${FREEMIUM_LIMITS.sejours} séjour atteinte. Passez au plan Pro pour créer plus de séjours.`
    };
  }

  return { canCreate: true };
}

/**
 * Vérifie si un utilisateur peut créer une nouvelle recette privée
 */
export async function canCreatePrivateRecette(clerkUserId: string, isPublic: boolean = false): Promise<{ canCreate: boolean; message?: string }> {
  // Si la recette est publique, pas de limitation
  if (isPublic) {
    return { canCreate: true };
  }

  const userInfo = await getUserSubscriptionInfo(clerkUserId);
  
  if (userInfo.hasProAccess) {
    return { canCreate: true };
  }

  // Utiliser la fonction de base de données pour compter les recettes privées
  const { data, error } = await supabase
    .rpc('count_user_private_recettes', { user_clerk_id: clerkUserId });

  if (error) {
    console.error('Erreur lors du comptage des recettes privées:', error);
    throw new Error('Erreur lors de la vérification des limitations');
  }

  const currentCount = data || 0;
  
  if (currentCount >= FREEMIUM_LIMITS.recettes_privees) {
    return {
      canCreate: false,
      message: `Limite de ${FREEMIUM_LIMITS.recettes_privees} recettes privées atteinte. Passez au plan Pro pour créer plus de recettes privées.`
    };
  }

  return { canCreate: true };
}

/**
 * Vérifie si un utilisateur peut créer un nouvel ingrédient privé
 */
export async function canCreatePrivateIngredient(clerkUserId: string, isPublic: boolean = false): Promise<{ canCreate: boolean; message?: string }> {
  // Si l'ingrédient est public, pas de limitation
  if (isPublic) {
    return { canCreate: true };
  }

  const userInfo = await getUserSubscriptionInfo(clerkUserId);
  
  if (userInfo.hasProAccess) {
    return { canCreate: true };
  }

  // Utiliser la fonction de base de données pour compter les ingrédients privés
  const { data, error } = await supabase
    .rpc('count_user_private_ingredients', { user_clerk_id: clerkUserId });

  if (error) {
    console.error('Erreur lors du comptage des ingrédients privés:', error);
    throw new Error('Erreur lors de la vérification des limitations');
  }

  const currentCount = data || 0;
  
  if (currentCount >= FREEMIUM_LIMITS.ingredients_prives) {
    return {
      canCreate: false,
      message: `Limite de ${FREEMIUM_LIMITS.ingredients_prives} ingrédients privés atteinte. Passez au plan Pro pour créer plus d'ingrédients privés.`
    };
  }

  return { canCreate: true };
}

/**
 * Vérifie si un utilisateur peut créer un nouvel ustensile privé
 */
export async function canCreatePrivateUstensile(clerkUserId: string, isPublic: boolean = false): Promise<{ canCreate: boolean; message?: string }> {
  // Si l'ustensile est public, pas de limitation
  if (isPublic) {
    return { canCreate: true };
  }

  const userInfo = await getUserSubscriptionInfo(clerkUserId);
  
  if (userInfo.hasProAccess) {
    return { canCreate: true };
  }

  // Utiliser la fonction de base de données pour compter les ustensiles privés
  const { data, error } = await supabase
    .rpc('count_user_private_ustensiles', { user_clerk_id: clerkUserId });

  if (error) {
    console.error('Erreur lors du comptage des ustensiles privés:', error);
    throw new Error('Erreur lors de la vérification des limitations');
  }

  const currentCount = data || 0;
  
  if (currentCount >= FREEMIUM_LIMITS.ustensiles_prives) {
    return {
      canCreate: false,
      message: `Limite de ${FREEMIUM_LIMITS.ustensiles_prives} ustensiles privés atteinte. Passez au plan Pro pour créer plus d'ustensiles privés.`
    };
  }

  return { canCreate: true };
}

/**
 * Filtre les données selon le statut public/privé et les permissions utilisateur
 */
export function filterDataByVisibility<T extends { is_public?: boolean; user_id?: string }>(
  data: T[],
  currentUserId: string
): T[] {
  return data.filter(item => {
    // Contenu public : accessible à tous
    if (item.is_public) {
      return true;
    }
    
    // Contenu privé : accessible seulement au propriétaire
    if (item.user_id === currentUserId) {
      return true;
    }
    
    // Sinon, pas accessible
    return false;
  });
}

/**
 * Construit une requête Supabase avec filtres de visibilité
 */
export function addVisibilityFilter(
  query: any,
  currentUserId: string,
  includePublic: boolean = true
) {
  if (includePublic) {
    // Inclure le contenu public ET le contenu privé de l'utilisateur
    return query.or(`is_public.eq.true,and(is_public.eq.false,user_id.eq.${currentUserId})`);
  } else {
    // Inclure seulement le contenu privé de l'utilisateur
    return query.and('is_public.eq.false').eq('user_id', currentUserId);
  }
}

/**
 * Classe d'erreur pour les limitations freemium
 */
export class FreemiumLimitError extends Error {
  constructor(message: string, public limit: number, public current: number) {
    super(message);
    this.name = 'FreemiumLimitError';
  }
}