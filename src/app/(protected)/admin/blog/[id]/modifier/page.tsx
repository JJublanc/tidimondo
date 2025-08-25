'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useSubscription } from '@/hooks/useSubscription'
import { BlogArticle, BlogCategory, BlogTag } from '@/types/blog'

interface Category {
  id: string
  name: string
  color: string
}

interface Tag {
  id: string
  name: string
}

interface FormData {
  title: string
  excerpt: string
  content: string
  category: string
  tags: string[]
  featuredImage: string
  isFeatured: boolean
  status: 'draft' | 'pending' | 'published' | 'archived'
}

export default function ModifierArticlePage() {
  const router = useRouter()
  const params = useParams()
  const { user: clerkUser } = useUser()
  const { isAdmin, loading: adminLoading } = useIsAdmin()
  const { hasProAccess, loading: subLoading } = useSubscription()
  
  // État pour l'ID utilisateur interne
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined)

  const [article, setArticle] = useState<BlogArticle | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [newTag, setNewTag] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const [formData, setFormData] = useState<FormData>({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    tags: [],
    featuredImage: '',
    isFeatured: false,
    status: 'draft'
  })

  useEffect(() => {
    // Charger l'ID utilisateur puis l'article et les données de référence
    const loadData = async () => {
      if (!params.id || adminLoading || subLoading) return

      try {
        // ÉTAPE 1: Récupérer l'ID utilisateur interne d'abord
        let userInternalId = undefined
        if (clerkUser?.id) {
          const userResponse = await fetch('/api/users/me')
          if (userResponse.ok) {
            const userData = await userResponse.json()
            userInternalId = userData.id
            setCurrentUserId(userData.id)
            console.log('✅ ID utilisateur interne récupéré:', userData.id)
          }
        }

        // ÉTAPE 2: Charger l'article
        const articleResponse = await fetch(`/api/blog/articles/${params.id}`)
        if (articleResponse.ok) {
          const articleData = await articleResponse.json()
          const articleInfo = articleData.data
          setArticle(articleInfo)
          
          console.log('🔍 DIAGNOSTIC PERMISSIONS MODIFICATION:', {
            isAdmin,
            hasProAccess,
            article: {
              id: articleInfo.id,
              user_id: articleInfo.user_id,
              title: articleInfo.title
            },
            user_identifiers: {
              clerkUser_id: clerkUser?.id,
              userInternalId: userInternalId,
              currentUserId: userInternalId
            },
            comparison: {
              'articleInfo.user_id === userInternalId': articleInfo.user_id === userInternalId
            }
          })
          
          // ÉTAPE 3: Vérifier les permissions avec le bon ID utilisateur
          // Si pas admin ET pas premium, rediriger
          if (!isAdmin && !hasProAccess) {
            console.log('❌ Redirection: pas admin et pas premium')
            router.push('/dashboard')
            return
          }
          
          // Si premium mais pas propriétaire de l'article (et pas admin), rediriger
          if (!isAdmin && hasProAccess && articleInfo.user_id !== userInternalId) {
            console.log('❌ REDIRECTION: premium mais pas propriétaire', {
              articleUserId: articleInfo.user_id,
              userInternalId: userInternalId,
              match: articleInfo.user_id === userInternalId
            })
            router.push('/admin/blog')
            return
          }
          
          console.log('✅ Accès autorisé à la modification')
          
          // Pré-remplir le formulaire
          setFormData({
            title: articleInfo.title,
            excerpt: articleInfo.excerpt,
            content: articleInfo.content,
            category: articleInfo.category_id,
            tags: articleInfo.tag_ids || [],
            featuredImage: articleInfo.featured_image_url || '',
            isFeatured: articleInfo.is_featured,
            status: articleInfo.status
          })
        } else {
          // Article non trouvé, rediriger
          router.push('/admin/blog')
        }

        // Charger les catégories
        const categoriesResponse = await fetch('/api/blog/categories')
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          setCategories(categoriesData.data || [])
        }

        // Charger les tags
        const tagsResponse = await fetch('/api/blog/tags')
        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json()
          setAvailableTags(tagsData.data || [])
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
        router.push('/admin/blog')
      }
    }

    if (!adminLoading && !subLoading) {
      loadData()
    }
  }, [isAdmin, adminLoading, hasProAccess, subLoading, router, params.id, clerkUser?.id])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleTagToggle = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(id => id !== tagId)
        : [...prev.tags, tagId]
    }))
  }

  const handleAddNewTag = () => {
    if (newTag.trim() && !availableTags.some(tag => tag.name.toLowerCase() === newTag.toLowerCase())) {
      const newTagObj = {
        id: `new-${Date.now()}`,
        name: newTag.trim().toLowerCase()
      }
      setAvailableTags(prev => [...prev, newTagObj])
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTagObj.id]
      }))
      setNewTag('')
    }
  }

  const handleSave = async (newStatus?: 'draft' | 'pending' | 'published' | 'archived') => {
    if (!article) return

    setIsSaving(true)
    setSaveMessage('')

    try {
      const requestData = {
        title: formData.title,
        excerpt: formData.excerpt,
        content: formData.content,
        category_id: formData.category,
        featured_image_url: formData.featuredImage || undefined,
        is_featured: formData.isFeatured,
        status: newStatus || formData.status,
        tag_ids: formData.tags.filter(id => !id.startsWith('new-'))
      }

      const response = await fetch(`/api/blog/articles/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Erreur ${response.status}`)
      }

      const result = await response.json()
      setSaveMessage('Article mis à jour avec succès !')
      
      // Mettre à jour le statut local
      setFormData(prev => ({ ...prev, status: newStatus || prev.status }))
      setArticle(prev => prev ? { ...prev, status: newStatus || prev.status } : null)

      // Rediriger vers la page de gestion du blog après un délai
      setTimeout(() => {
        router.push('/admin/blog')
      }, 1500)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      setSaveMessage(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteArticle = async () => {
    if (!article || !confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/blog/articles/${params.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      router.push('/admin/blog')
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      setSaveMessage('Erreur lors de la suppression')
    } finally {
      setIsSaving(false)
    }
  }

  if (adminLoading || subLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  // Vérifier les permissions : admin OU (premium ET propriétaire de l'article)
  const canEditThisArticle = isAdmin || (hasProAccess && article && article.user_id === currentUserId)
  
  if (!canEditThisArticle) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès non autorisé</h1>
        <p className="text-gray-600">
          {!hasProAccess
            ? "Vous devez avoir un abonnement Premium pour modifier des articles."
            : "Vous ne pouvez modifier que vos propres articles."
          }
        </p>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Article non trouvé</h1>
        <p className="text-gray-600">L'article demandé n'existe pas.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Modifier l'article
          </h1>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              article.status === 'published' ? 'bg-green-100 text-green-800' :
              article.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              article.status === 'archived' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {article.status === 'published' ? 'Publié' :
               article.status === 'pending' ? 'En attente' :
               article.status === 'archived' ? 'Archivé' : 'Brouillon'}
            </span>
          </div>
        </div>
      </div>

      {saveMessage && (
        <div className={`mb-6 p-4 rounded-lg ${
          saveMessage.includes('succès') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {saveMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Titre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre de l'article
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Entrez le titre de l'article"
              />
            </div>

            {/* Extrait */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Extrait
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => handleInputChange('excerpt', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Résumé de l'article (150 caractères max)"
              />
            </div>

            {/* Contenu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenu de l'article
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Rédigez votre article ici (minimum 50 caractères)"
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleSave()}
                  disabled={isSaving}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>

                {article.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleSave('published')}
                      disabled={isSaving}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      ✅ Publier
                    </button>
                    <button
                      onClick={() => handleSave('archived')}
                      disabled={isSaving}
                      className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      ❌ Rejeter
                    </button>
                  </>
                )}

                {article.status === 'published' && (
                  <button
                    onClick={() => handleSave('archived')}
                    disabled={isSaving}
                    className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Archiver
                  </button>
                )}

                <button
                  onClick={handleDeleteArticle}
                  disabled={isSaving}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>

            {/* Catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Image mise en avant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image mise en avant
              </label>
              <input
                type="url"
                value={formData.featuredImage}
                onChange={(e) => handleInputChange('featuredImage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="URL de l'image"
              />
              {formData.featuredImage && (
                <img
                  src={formData.featuredImage}
                  alt="Aperçu"
                  className="mt-2 w-full h-32 object-cover rounded-lg"
                />
              )}
            </div>

            {/* Article mis en avant */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                  className="mr-2 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Article mis en avant</span>
              </label>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="space-y-2 mb-3">
                {availableTags.map((tag) => (
                  <label key={tag.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.tags.includes(tag.id)}
                      onChange={() => handleTagToggle(tag.id)}
                      className="mr-2 rounded"
                    />
                    <span className="text-sm">{tag.name}</span>
                  </label>
                ))}
              </div>
              
              {/* Ajouter un nouveau tag */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Nouveau tag"
                />
                <button
                  onClick={handleAddNewTag}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}