'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArticleCard } from '@/components/blog/ArticleCard'
import { CategoryFilter } from '@/components/blog/CategoryFilter'
import { BlogArticleWithMetadata, BlogCategory } from '@/types/blog'
import { ArrowLeft, Home, BookOpen } from 'lucide-react'

export default function BlogPage() {
  const [articles, setArticles] = useState<BlogArticleWithMetadata[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      
      try {
        // Charger les articles publiés uniquement
        const articlesResponse = await fetch('/api/blog/articles?status=published&limit=20')
        if (articlesResponse.ok) {
          const articlesData = await articlesResponse.json()
          setArticles(articlesData.data || [])
        }

        // Charger les catégories
        const categoriesResponse = await fetch('/api/blog/categories')
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          setCategories(categoriesData.data || [])
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des articles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Header du blog */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo et navigation */}
            <div className="flex items-center space-x-6">
              <Link href="/" className="flex items-center space-x-2 group">
                <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">T</span>
                </div>
                <span className="text-xl font-bold text-gray-900">TidiMondo</span>
              </Link>
              
              <nav className="hidden md:flex items-center space-x-1">
                <Link
                  href="/"
                  className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Home className="h-4 w-4" />
                  <span>Accueil</span>
                </Link>
                <div className="flex items-center space-x-1 px-3 py-2 text-green-600 bg-green-50 rounded-lg">
                  <BookOpen className="h-4 w-4" />
                  <span className="font-medium">Blog</span>
                </div>
              </nav>
            </div>

            {/* Lien retour mobile */}
            <div className="md:hidden">
              <Link
                href="/"
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Retour</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero section du blog */}
      <div className="bg-gradient-to-r from-green-600 to-green-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Blog TidiMondo
            </h1>
            <p className="text-xl text-green-100 max-w-3xl mx-auto">
              Découvrez nos conseils et astuces pour organiser vos séjours culinaires,
              optimiser vos recettes et créer des expériences gastronomiques inoubliables
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar avec filtres */}
          <aside className="lg:w-64">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Catégories</h3>
              <CategoryFilter categories={categories} />
            </div>
          </aside>

          {/* Liste des articles */}
          <main className="flex-1">
            {articles.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun article trouvé
                </h3>
                <p className="text-gray-500">
                  Les articles publiés apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}