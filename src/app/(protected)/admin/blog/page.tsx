'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { useSubscription } from '@/hooks/useSubscription'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Eye, Trash2, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { BlogArticleWithMetadata } from '@/types/blog'

export default function BlogManagementPage() {
  const { hasProAccess, loading } = useSubscription()
  const { isAdmin, loading: adminLoading } = useIsAdmin()
  const [articles, setArticles] = useState<BlogArticleWithMetadata[]>([])
  const [loadingArticles, setLoadingArticles] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchArticles = async () => {
    try {
      setLoadingArticles(true)
      
      // Paramètres différents selon le rôle
      let url = '/api/blog/articles'
      if (isAdmin) {
        // Admins : tous les articles pour modération
        url += '?limit=50'
      } else {
        // Utilisateurs premium : seulement LEURS articles
        url += '?my_articles_only=true&limit=20'
      }
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des articles')
      }
      const data = await response.json()
      setArticles(data.data || [])
    } catch (error) {
      console.error('Erreur:', error)
      setError('Impossible de charger les articles')
    } finally {
      setLoadingArticles(false)
    }
  }

  useEffect(() => {
    fetchArticles()
  }, [])

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      return
    }

    try {
      const response = await fetch(`/api/blog/articles/${articleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Erreur ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }

      // Mettre à jour la liste locale
      setArticles(articles.filter(a => a.id !== articleId))
      alert('Article supprimé avec succès')
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert(`Erreur lors de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  const handleStatusChange = async (articleId: string, newStatus: 'published' | 'archived' | 'pending') => {
    try {
      const response = await fetch(`/api/blog/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Erreur ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      // Mettre à jour la liste locale
      setArticles(articles.map(a =>
        a.id === articleId ? { ...a, status: newStatus } : a
      ))
      
      const statusLabels = {
        published: 'publié',
        archived: 'archivé',
        pending: 'soumis pour modération'
      }
      alert(`Article ${statusLabels[newStatus]} avec succès`)
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      alert(`Erreur lors de la mise à jour: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Brouillon' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'En attente' },
      published: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Publié' },
      archived: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Archivé' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Redirection si l'utilisateur n'a aucun accès
  if (!loading && !adminLoading && !hasProAccess && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Accès Restreint" backLink="/dashboard" />
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">🔒</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Accès Premium Requis</h3>
            <p className="text-gray-600 mb-4">
              Cette fonctionnalité est réservée aux utilisateurs Premium.
            </p>
            <Link href="/pricing">
              <Button className="bg-green-600 hover:bg-green-700">
                Passer au Premium
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading || adminLoading || loadingArticles) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          title={isAdmin ? "Administration du Blog" : "Gestion du Blog"}
          backLink={isAdmin ? "/admin" : "/dashboard"}
        />
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-600">Chargement...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          title={isAdmin ? "Administration du Blog" : "Gestion du Blog"}
          backLink={isAdmin ? "/admin" : "/dashboard"}
        />
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchArticles}>Réessayer</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title={isAdmin ? "Administration du Blog" : "Gestion du Blog"}
        backLink={isAdmin ? "/admin" : "/dashboard"}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête avec actions */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isAdmin ? 'Administration du Blog' : 'Mes Articles'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isAdmin
                ? 'Gérez tous les articles du système et modérez le contenu en attente'
                : 'Créez et gérez vos articles de blog pour partager avec la communauté'
              }
            </p>
          </div>
          
          <Link href="/admin/blog/nouveau">
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              {isAdmin ? 'Créer un Article' : 'Nouvel Article'}
            </Button>
          </Link>
        </div>

        {/* Statistiques rapides pour les admins */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm font-medium text-gray-500">Total</div>
              <div className="text-2xl font-bold text-gray-900">{articles.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm font-medium text-gray-500">En attente</div>
              <div className="text-2xl font-bold text-yellow-600">
                {articles.filter(a => a.status === 'pending').length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm font-medium text-gray-500">Publiés</div>
              <div className="text-2xl font-bold text-green-600">
                {articles.filter(a => a.status === 'published').length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm font-medium text-gray-500">Archivés</div>
              <div className="text-2xl font-bold text-red-600">
                {articles.filter(a => a.status === 'archived').length}
              </div>
            </div>
          </div>
        )}

        {/* Informations contextuelles */}
        {!isAdmin && hasProAccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Utilisateur Premium Actif
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Vos articles suivent le processus de modération :</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li><strong>Brouillon</strong> : Vous pouvez modifier l'article</li>
                    <li><strong>Soumis</strong> : En attente de validation par l'équipe</li>
                    <li><strong>Publié</strong> : Visible sur le blog public</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Mode Administration
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>En tant qu'administrateur, vous pouvez :</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Modérer tous les articles soumis par les utilisateurs</li>
                    <li>Publier ou rejeter les articles en attente</li>
                    <li>Créer du contenu officiel directement publié</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Liste des articles */}
        {articles.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow p-8">
              <Edit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun article pour le moment
              </h3>
              <p className="text-gray-600 mb-4">
                {(hasProAccess || isAdmin)
                  ? 'Commencez par créer votre premier article de blog.'
                  : 'Passez au plan Premium pour commencer à écrire des articles.'
                }
              </p>
              {(hasProAccess || isAdmin) ? (
                <Link href="/admin/blog/nouveau">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer mon premier article
                  </Button>
                </Link>
              ) : (
                <Link href="/pricing">
                  <Button className="bg-green-600 hover:bg-green-700">
                    Découvrir Premium
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {isAdmin ? `Tous les Articles (${articles.length})` : `Mes Articles (${articles.length})`}
              </h3>
              {isAdmin && articles.filter(a => a.status === 'pending').length > 0 && (
                <div className="text-sm text-yellow-600 mt-1">
                  {articles.filter(a => a.status === 'pending').length} article(s) en attente de modération
                </div>
              )}
            </div>
            
            <div className="divide-y divide-gray-200">
              {articles.map((article) => (
                <div key={article.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {article.title}
                        </h4>
                        {getStatusBadge(article.status)}
                      </div>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span>Créé le {formatDate(article.created_at)}</span>
                        {isAdmin && article.author_first_name && (
                          <span>Par {article.author_first_name} {article.author_last_name || ''}</span>
                        )}
                        <span className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {article.view_count} vues
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Link href={`/blog/${article.slug || article.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                      </Link>
                      
                      {(hasProAccess || isAdmin) && (
                        <Link href={`/admin/blog/${article.id}/modifier`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Modifier
                          </Button>
                        </Link>
                      )}
                      
                      {/* Actions de modération pour les admins */}
                      {isAdmin && article.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleStatusChange(article.id, 'published')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Publier
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleStatusChange(article.id, 'archived')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Rejeter
                          </Button>
                        </>
                      )}
                      
                      {/* Bouton d'envoi en modération pour les utilisateurs */}
                      {!isAdmin && article.status === 'draft' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleStatusChange(article.id, 'pending')}
                        >
                          <Clock className="w-4 h-4 mr-1" />
                          Soumettre
                        </Button>
                      )}
                      
                      {/* Suppression : admins peuvent toujours supprimer, utilisateurs seulement si brouillon ou en attente */}
                      {(isAdmin || (!isAdmin && ['draft', 'pending'].includes(article.status))) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteArticle(article.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Liens utiles */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Blog Public
            </h3>
            <p className="text-gray-600 mb-4">
              Consultez tous les articles publiés sur le blog TidiMondo.
            </p>
            <Link href="/blog">
              <Button variant="outline">
                Voir le blog public
              </Button>
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Conseils de rédaction
            </h3>
            <p className="text-gray-600 mb-4">
              Découvrez nos conseils pour écrire des articles engageants.
            </p>
            <Button variant="outline" disabled>
              Guide de rédaction (bientôt)
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}