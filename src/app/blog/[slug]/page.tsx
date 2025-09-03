'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { BlogArticleWithMetadata } from '@/types/blog'
import { Button } from '@/components/ui/button'
import { MarkdownRenderer } from '@/components/blog/MarkdownRenderer'
import { ArrowLeft, Calendar, Clock, Eye, User, Tag, Share2, Heart } from 'lucide-react'

export default function ArticleDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const [article, setArticle] = useState<BlogArticleWithMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const loadArticle = async () => {
      setLoading(true)
      setNotFound(false)
      
      try {
        // Charger l'article depuis l'API
        const response = await fetch(`/api/blog/articles?slug=${slug}&status=published`)
        if (!response.ok) {
          setNotFound(true)
          return
        }
        
        const { data } = await response.json()
        const foundArticle = data.find((article: BlogArticleWithMetadata) => article.slug === slug)
        
        if (foundArticle) {
          setArticle(foundArticle)
        } else {
          setNotFound(true)
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'article:', error)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      loadArticle()
    }
  }, [slug])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de l'article...</p>
        </div>
      </div>
    )
  }

  if (notFound || !article) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Article non trouvé</h1>
          <p className="text-gray-600 mb-8">L'article que vous recherchez n'existe pas ou a été supprimé.</p>
          <Link href="/blog">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au blog
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {/* En-tête de navigation */}
      <div className="mb-8">
        <Link href="/blog">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au blog
          </Button>
        </Link>
      </div>

      {/* Image mise en avant */}
      {article.featured_image_url && (
        <div className="mb-8">
          <Image
            src={article.featured_image_url}
            alt={article.title}
            width={800}
            height={400}
            className="w-full h-96 object-cover rounded-lg"
          />
        </div>
      )}

      {/* En-tête de l'article */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {article.title}
        </h1>
        
        <p className="text-xl text-gray-600 mb-6">
          {article.excerpt}
        </p>

        {/* Métadonnées */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 border-b border-gray-200 pb-6">
          <div className="flex items-center">
            <User className="w-4 h-4 mr-2" />
            {article.author_first_name} {article.author_last_name}
          </div>
          
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            {new Date(article.created_at).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            {Math.ceil(article.content.length / 200)} min de lecture
          </div>
          
          <div className="flex items-center">
            <Eye className="w-4 h-4 mr-2" />
            {article.view_count} vues
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <MarkdownRenderer
        content={article.content}
        className="mt-8"
      />

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                <Tag className="w-3 h-3 mr-1" />
                {typeof tag === 'string' ? tag : tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Heart className="w-4 h-4 mr-2" />
              J'aime
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Partager
            </Button>
          </div>
          
          <div className="text-sm text-gray-500">
            Catégorie:
            <span className="ml-1 font-medium" style={{ color: article.category_color || '#666' }}>
              {article.category_name}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation vers d'autres articles */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Découvrez d'autres articles
          </h3>
          <Link href="/blog">
            <Button variant="outline">
              Voir tous les articles
            </Button>
          </Link>
        </div>
      </div>
    </article>
  )
}