import { BlogFreemiumLimits, BlogFreemiumCheckResult, BlogArticleStatus } from '@/types/blog';

// =====================================================
// CONSTANTES FREEMIUM
// =====================================================

export const BLOG_FREEMIUM_LIMITS: BlogFreemiumLimits = {
  articles_per_month: 5,        // Pour les utilisateurs premium
  comments_per_day: 10,         // Pour tous les utilisateurs
  max_article_length: 5000,     // Caractères pour premium
  can_publish_articles: false,  // Gratuit ne peut pas publier
  can_comment: true,           // Gratuit peut commenter
};

export const BLOG_PREMIUM_LIMITS: BlogFreemiumLimits = {
  articles_per_month: 50,       // Limite généreuse pour premium
  comments_per_day: 50,         // Limite généreuse pour premium
  max_article_length: 20000,    // 20k caractères pour premium
  can_publish_articles: true,   // Premium peut publier
  can_comment: true,           // Premium peut commenter
};

// =====================================================
// FONCTIONS UTILITAIRES
// =====================================================

/**
 * Génère un slug unique à partir d'un titre
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s-]/g, '') // Supprime les caractères spéciaux
    .replace(/\s+/g, '-') // Remplace les espaces par des tirets
    .replace(/-+/g, '-') // Supprime les tirets multiples
    .trim()
    .replace(/^-+|-+$/g, ''); // Supprime les tirets en début/fin
}


/**
 * Extrait un extrait automatique du contenu Markdown
 */
export function extractExcerpt(content: string, maxLength: number = 200): string {
  // Supprime le Markdown basique
  const plainText = content
    .replace(/#{1,6}\s+/g, '') // Titres
    .replace(/\*\*(.*?)\*\*/g, '$1') // Gras
    .replace(/\*(.*?)\*/g, '$1') // Italique
    .replace(/`(.*?)`/g, '$1') // Code inline
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Liens
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Images
    .replace(/\n+/g, ' ') // Sauts de ligne
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Coupe au dernier mot complet
  const truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return lastSpace > 0 
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...';
}

/**
 * Compte les mots dans un texte
 */
export function countWords(text: string): number {
  return text
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length;
}

/**
 * Estime le temps de lecture en minutes
 */
export function estimateReadingTime(content: string, wordsPerMinute: number = 200): number {
  const wordCount = countWords(content);
  return Math.ceil(wordCount / wordsPerMinute);
}

// =====================================================
// FONCTIONS FREEMIUM
// =====================================================


/**
 * Formate une date pour l'affichage
 */
export function formatDate(dateString: string, locale: string = 'fr-FR'): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formate une date relative (il y a X jours)
 */
export function formatRelativeDate(dateString: string, locale: string = 'fr-FR'): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return "Aujourd'hui";
  } else if (diffInDays === 1) {
    return 'Hier';
  } else if (diffInDays < 7) {
    return `Il y a ${diffInDays} jours`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `Il y a ${months} mois`;
  } else {
    const years = Math.floor(diffInDays / 365);
    return `Il y a ${years} an${years > 1 ? 's' : ''}`;
  }
}