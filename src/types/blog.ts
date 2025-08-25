// Types pour le système de blog TidiMondo

// =====================================================
// ÉNUMÉRATIONS ET TYPES DE BASE
// =====================================================

export type BlogArticleStatus = 'draft' | 'pending' | 'published' | 'archived';
export type BlogCommentStatus = 'pending' | 'approved' | 'rejected';

// =====================================================
// INTERFACES PRINCIPALES
// =====================================================

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  color: string;
  created_at: string;
}

export interface BlogArticle {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  status: BlogArticleStatus;
  is_featured: boolean;
  view_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogComment {
  id: string;
  article_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  status: BlogCommentStatus;
  created_at: string;
  updated_at: string;
}

export interface BlogArticleTag {
  article_id: string;
  tag_id: string;
}

// =====================================================
// INTERFACES ÉTENDUES
// =====================================================

export interface BlogArticleWithMetadata extends BlogArticle {
  category_name: string | null;
  category_slug: string | null;
  category_color: string | null;
  author_first_name: string | null;
  author_last_name: string | null;
  author_email: string;
  comments_count: number;
  tags: BlogTag[];
}

export interface BlogCommentWithAuthor extends BlogComment {
  author_first_name: string | null;
  author_last_name: string | null;
  author_email: string;
  replies?: BlogCommentWithAuthor[];
}

// =====================================================
// TYPES POUR LES FORMULAIRES
// =====================================================

export interface BlogArticleFormData {
  title: string;
  excerpt?: string;
  content: string;
  category_id?: string;
  featured_image_url?: string;
  is_featured: boolean;
  status: BlogArticleStatus;
  tag_ids: string[];
}

export interface BlogCategoryFormData {
  name: string;
  description?: string;
  color: string;
  sort_order: number;
}

export interface BlogTagFormData {
  name: string;
  color: string;
}

export interface BlogCommentFormData {
  content: string;
  parent_id?: string;
}

// =====================================================
// TYPES POUR LES FILTRES
// =====================================================

export interface BlogArticleFilters {
  search?: string;
  category_id?: string;
  tag_ids?: string[];
  status?: BlogArticleStatus[];
  author_id?: string;
  is_featured?: boolean;
  date_from?: string;
  date_to?: string;
}

export interface BlogCommentFilters {
  article_id?: string;
  status?: BlogCommentStatus[];
  author_id?: string;
  date_from?: string;
  date_to?: string;
}

// =====================================================
// TYPES POUR LES STATISTIQUES
// =====================================================

export interface BlogStats {
  published_articles: number;
  pending_articles: number;
  draft_articles: number;
  approved_comments: number;
  pending_comments: number;
  categories_count: number;
  tags_count: number;
  total_views: number;
}

export interface BlogUserStats {
  articles_count: number;
  published_articles_count: number;
  pending_articles_count: number;
  draft_articles_count: number;
  total_views: number;
  comments_received: number;
  articles_this_month: number;
}

// =====================================================
// TYPES POUR LES RÉPONSES API
// =====================================================

export interface BlogApiResponse<T> {
  data: T;
  error: null;
}

export interface BlogApiError {
  data: null;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export type BlogApiResult<T> = BlogApiResponse<T> | BlogApiError;

export interface BlogPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =====================================================
// TYPES POUR LES RESTRICTIONS FREEMIUM
// =====================================================

export interface BlogFreemiumLimits {
  articles_per_month: number;
  comments_per_day: number;
  max_article_length: number;
  can_publish_articles: boolean;
  can_comment: boolean;
}

export interface BlogFreemiumCheckResult {
  allowed: boolean;
  reason?: string;
  current_count?: number;
  limit?: number;
  reset_date?: string;
}

// =====================================================
// TYPES POUR L'ÉDITEUR
// =====================================================

export interface BlogEditorState {
  mode: 'edit' | 'preview';
  content: string;
  title: string;
  excerpt: string;
  category_id: string | null;
  tag_ids: string[];
  is_featured: boolean;
  featured_image_url: string | null;
}

export interface BlogEditorAction {
  type: 'SET_MODE' | 'SET_CONTENT' | 'SET_TITLE' | 'SET_EXCERPT' | 
        'SET_CATEGORY' | 'SET_TAGS' | 'SET_FEATURED' | 'SET_IMAGE';
  payload: any;
}

// =====================================================
// TYPES POUR LA NAVIGATION ET L'UI
// =====================================================

export interface BlogBreadcrumb {
  label: string;
  href?: string;
}

export interface BlogSidebarItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: number;
  active?: boolean;
}

// =====================================================
// TYPES POUR LE SEO
// =====================================================

export interface BlogSEOData {
  title: string;
  description: string;
  keywords: string[];
  canonical_url?: string;
  og_image?: string;
  og_type?: 'article' | 'website';
  article_author?: string;
  article_published_time?: string;
  article_modified_time?: string;
  article_section?: string;
  article_tags?: string[];
}