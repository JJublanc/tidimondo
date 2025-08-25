'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { BlogArticleWithMetadata } from '@/types/blog'
import { formatDate, formatRelativeDate, estimateReadingTime } from '@/lib/blog-utils'
import { Calendar, Clock, Eye, MessageCircle, User, Tag } from 'lucide-react'

interface ArticleCardProps {
  article: BlogArticleWithMetadata
  variant?: 'default' | 'featured' | 'compact'
  showAuthor?: boolean
  showCategory?: boolean
  showTags?: boolean
  showStats?: boolean
}

export function ArticleCard({ 
  article, 
  variant = 'default',
  showAuthor = true,
  showCategory = true,
  showTags = true,
  showStats = true
}: ArticleCardProps) {
  const router = useRouter()
  const readingTime = estimateReadingTime(article.content)
  const authorName = article.author_first_name
    ? `${article.author_first_name} ${article.author_last_name || ''}`.trim()
    : article.author_email

  const handleCardClick = (e: React.MouseEvent) => {
    // Empêcher la navigation si on clique sur un lien interne
    if ((e.target as HTMLElement).closest('a[href^="/blog/categorie"], a[href*="tag="]')) {
      return
    }
    router.push(`/blog/${article.slug}`)
  }

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  if (variant === 'featured') {
    return (
      <article
        className="relative overflow-hidden rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
        onClick={handleCardClick}
      >
        {article.featured_image_url && (
          <div className="relative h-64 w-full">
            <Image
              src={article.featured_image_url}
              alt={article.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {article.is_featured && (
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-600 text-white">
                  ⭐ À la une
                </span>
              </div>
            )}
          </div>
        )}
        
        <div className="p-6">
          {showCategory && article.category_name && (
            <div className="mb-3">
              <Link
                href={`/blog/categorie/${article.category_slug}`}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: article.category_color || '#6B7280' }}
                onClick={handleLinkClick}
              >
                {article.category_name}
              </Link>
            </div>
          )}

          <h2 className="text-2xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-green-600 transition-colors">
            {article.title}
          </h2>

          {article.excerpt && (
            <p className="text-gray-600 mb-4 line-clamp-3">
              {article.excerpt}
            </p>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              {showAuthor && (
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{authorName}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{formatRelativeDate(article.published_at || article.created_at)}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{readingTime} min</span>
              </div>
            </div>

            {showStats && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{article.view_count}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{article.comments_count}</span>
                </div>
              </div>
            )}
          </div>

          {showTags && article.tags && article.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {article.tags.slice(0, 3).map((tag) => (
                <Link
                  key={tag.id}
                  href={`/blog?tag=${tag.slug}`}
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  style={{ backgroundColor: `${tag.color}20` }}
                  onClick={handleLinkClick}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag.name}
                </Link>
              ))}
              {article.tags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{article.tags.length - 3} autres
                </span>
              )}
            </div>
          )}
        </div>
      </article>
    )
  }

  if (variant === 'compact') {
    return (
      <article
        className="flex space-x-4 p-4 bg-white rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleCardClick}
      >
        {article.featured_image_url && (
          <div className="relative w-24 h-24 flex-shrink-0">
            <Image
              src={article.featured_image_url}
              alt={article.title}
              fill
              className="object-cover rounded-lg"
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          {showCategory && article.category_name && (
            <div className="mb-1">
              <span 
                className="inline-block px-2 py-1 rounded text-xs font-medium text-white"
                style={{ backgroundColor: article.category_color || '#6B7280' }}
              >
                {article.category_name}
              </span>
            </div>
          )}

          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2 hover:text-green-600 transition-colors">
            {article.title}
          </h3>

          <div className="flex items-center text-sm text-gray-500 space-x-3">
            <span>{formatRelativeDate(article.published_at || article.created_at)}</span>
            <span>{readingTime} min</span>
            {showStats && (
              <>
                <span>{article.view_count} vues</span>
                <span>{article.comments_count} commentaires</span>
              </>
            )}
          </div>
        </div>
      </article>
    )
  }

  // Variant par défaut
  return (
    <article
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer"
      onClick={handleCardClick}
    >
      {article.featured_image_url && (
        <div className="relative h-48 w-full">
          <Image
            src={article.featured_image_url}
            alt={article.title}
            fill
            className="object-cover"
          />
          {article.is_featured && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-600 text-white">
                ⭐ À la une
              </span>
            </div>
          )}
        </div>
      )}
      
      <div className="p-6">
        {showCategory && article.category_name && (
          <div className="mb-3">
            <Link
              href={`/blog/categorie/${article.category_slug}`}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: article.category_color || '#6B7280' }}
              onClick={handleLinkClick}
            >
              {article.category_name}
            </Link>
          </div>
        )}

        <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-green-600 transition-colors">
          {article.title}
        </h2>

        {article.excerpt && (
          <p className="text-gray-600 mb-4 line-clamp-3">
            {article.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-3">
            {showAuthor && (
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>{authorName}</span>
              </div>
            )}
            
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{formatRelativeDate(article.published_at || article.created_at)}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{readingTime} min</span>
            </div>
          </div>

          {showStats && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{article.view_count}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="h-4 w-4" />
                <span>{article.comments_count}</span>
              </div>
            </div>
          )}
        </div>

        {showTags && article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {article.tags.slice(0, 4).map((tag) => (
              <Link
                key={tag.id}
                href={`/blog?tag=${tag.slug}`}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                style={{ backgroundColor: `${tag.color}20` }}
                onClick={handleLinkClick}
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag.name}
              </Link>
            ))}
            {article.tags.length > 4 && (
              <span className="text-xs text-gray-500">
                +{article.tags.length - 4} autres
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  )
}