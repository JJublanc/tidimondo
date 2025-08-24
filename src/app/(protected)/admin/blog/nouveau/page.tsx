'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { useSubscription } from '@/hooks/useSubscription'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Save, Eye, Send, AlertCircle, Tag, Folder } from 'lucide-react'

interface Category {
  id: string
  name: string
  color: string
}

interface Tag {
  id: string
  name: string
}

export default function NewArticlePage() {
  const router = useRouter()
  const { hasProAccess, loading } = useSubscription()
  const [saving, setSaving] = useState(false)
  
  // État du formulaire
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category_id: '',
    tags: [] as string[],
    featured_image: '',
    status: 'draft' as 'draft' | 'pending'
  })

  // Données temporaires
  const [categories, setCategories] = useState<Category[]>([])
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    // Rediriger si pas d'accès Premium
    if (!loading && !hasProAccess) {
      router.push('/pricing')
      return
    }

    // Charger les catégories et tags depuis l'API
    const loadCategoriesAndTags = async () => {
      try {
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
        console.error('Erreur lors du chargement des catégories/tags:', error)
      }
    }

    if (hasProAccess && !loading) {
      loadCategoriesAndTags()
    }
  }, [hasProAccess, loading, router])

  const handleInputChange = (field: string, value: string) => {
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

  const handleSave = async (status: 'draft' | 'pending') => {
    // Validation côté client
    const validationErrors = []
    
    if (!formData.title.trim()) {
      validationErrors.push('Le titre est requis')
    }
    
    if (!formData.content.trim()) {
      validationErrors.push('Le contenu est requis')
    } else if (formData.content.trim().length < 50) {
      validationErrors.push('Le contenu doit contenir au moins 50 caractères')
    }
    
    if (!formData.category_id) {
      validationErrors.push('La catégorie est requise')
    }
    
    if (validationErrors.length > 0) {
      alert('Erreurs de validation :\n' + validationErrors.join('\n'))
      return
    }
    
    setSaving(true)
    
    try {
      const articleData = {
        title: formData.title.trim(),
        excerpt: formData.excerpt.trim() || undefined,
        content: formData.content.trim(),
        category_id: formData.category_id || undefined,
        featured_image_url: formData.featured_image.trim() || undefined,
        is_featured: false,
        status,
        tag_ids: formData.tags || []
      }
      
      console.log('Envoi article:', articleData)
      
      const response = await fetch('/api/blog/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Améliorer les messages d'erreur
        let errorMessage = 'Erreur lors de la sauvegarde'
        if (errorData.error) {
          errorMessage = errorData.error
        } else if (errorData.details) {
          // Erreurs de validation Zod
          errorMessage = errorData.details.map((err: any) => err.message).join('\n')
        } else {
          errorMessage = `Erreur ${response.status}: ${response.statusText}`
        }
        
        throw new Error(errorMessage)
      }
      
      const result = await response.json()
      console.log('Article créé:', result)
      
      if (status === 'pending') {
        alert('Article soumis pour modération ! Vous recevrez une notification une fois qu\'il sera approuvé.')
      } else {
        alert('Brouillon sauvegardé avec succès !')
      }
      
      router.push('/admin/blog')
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      alert(`${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setSaving(false)
    }
  }

  const isFormValid = formData.title.trim() &&
                      formData.content.trim().length >= 50 &&
                      formData.category_id
  
  const contentLength = formData.content.trim().length
  const isContentValid = contentLength >= 50

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Nouvel Article" backLink="/blog" />
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-600">Chargement...</div>
        </div>
      </div>
    )
  }

  if (!hasProAccess) {
    return null // Redirection en cours
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Nouvel Article" backLink="/blog" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">
              Créer un nouvel article
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Partagez vos conseils et expériences avec la communauté TidiMondo
            </p>
          </div>

          <form className="p-6 space-y-6">
            {/* Titre */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Titre de l'article *
              </label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('title', e.target.value)}
                placeholder="Ex: Comment organiser un séjour culinaire parfait"
                className="w-full"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.title.length}/100 caractères
              </p>
            </div>

            {/* Résumé */}
            <div>
              <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
                Résumé
              </label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('excerpt', e.target.value)}
                placeholder="Décrivez brièvement le contenu de votre article..."
                rows={3}
                maxLength={300}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.excerpt.length}/300 caractères
              </p>
            </div>

            {/* Catégorie */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                <Folder className="w-4 h-4 inline mr-1" />
                Catégorie *
              </label>
              <select
                id="category"
                value={formData.category_id}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('category_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Sélectionnez une catégorie</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Tags
              </label>
              
              {/* Tags existants */}
              <div className="flex flex-wrap gap-2 mb-3">
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      formData.tags.includes(tag.id)
                        ? 'bg-green-100 text-green-800 border-2 border-green-300'
                        : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>

              {/* Ajouter un nouveau tag */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newTag}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTag(e.target.value)}
                  placeholder="Ajouter un nouveau tag..."
                  className="flex-1"
                  onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && (e.preventDefault(), handleAddNewTag())}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddNewTag}
                  disabled={!newTag.trim()}
                >
                  Ajouter
                </Button>
              </div>
            </div>

            {/* Image à la une */}
            <div>
              <label htmlFor="featured_image" className="block text-sm font-medium text-gray-700 mb-2">
                Image à la une (URL)
              </label>
              <Input
                id="featured_image"
                type="url"
                value={formData.featured_image}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('featured_image', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL d'une image pour illustrer votre article
              </p>
            </div>

            {/* Contenu */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Contenu de l'article *
              </label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('content', e.target.value)}
                placeholder="Rédigez le contenu de votre article ici..."
                rows={15}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Utilisez le format Markdown pour la mise en forme
              </p>
            </div>

            {/* Informations sur la modération */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm">
                  <h4 className="font-medium text-blue-800 mb-1">
                    Processus de modération
                  </h4>
                  <p className="text-blue-700">
                    Vos articles sont soumis à modération avant publication pour garantir 
                    la qualité du contenu. Vous recevrez une notification une fois votre 
                    article approuvé.
                  </p>
                </div>
              </div>
            </div>
          </form>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/blog')}
              disabled={saving}
            >
              Annuler
            </Button>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => handleSave('draft')}
                disabled={saving || !formData.title.trim()}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder le brouillon'}
              </Button>

              <Button
                onClick={() => handleSave('pending')}
                disabled={saving || !isFormValid}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {saving ? 'Envoi...' : 'Soumettre pour publication'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}