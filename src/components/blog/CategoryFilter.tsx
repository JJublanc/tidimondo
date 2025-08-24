'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { BlogCategory } from '@/types/blog'
import { ChevronDown, Filter, X } from 'lucide-react'

interface CategoryFilterProps {
  categories: BlogCategory[]
  showAll?: boolean
  className?: string
}

export function CategoryFilter({ 
  categories, 
  showAll = true, 
  className = '' 
}: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  const selectedCategoryId = searchParams.get('category_id')
  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId)

  const createQueryString = (name: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(name, value)
    } else {
      params.delete(name)
    }
    // Remettre la page à 1 quand on change de filtre
    params.set('page', '1')
    return params.toString()
  }

  const handleCategorySelect = (categoryId: string | null) => {
    const queryString = createQueryString('category_id', categoryId)
    router.push(`${pathname}?${queryString}`)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Version desktop - liens horizontaux */}
      <div className="hidden md:flex flex-wrap gap-2">
        {showAll && (
          <Link
            href={`${pathname}?${createQueryString('category_id', null)}`}
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !selectedCategoryId
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Toutes les catégories
          </Link>
        )}
        
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`${pathname}?${createQueryString('category_id', category.id)}`}
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategoryId === category.id
                ? 'text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={{
              backgroundColor: selectedCategoryId === category.id ? category.color : undefined
            }}
          >
            {category.name}
          </Link>
        ))}
      </div>

      {/* Version mobile - dropdown */}
      <div className="md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>
              {selectedCategory ? selectedCategory.name : 'Toutes les catégories'}
            </span>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
            <div className="py-1">
              {showAll && (
                <button
                  onClick={() => handleCategorySelect(null)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                    !selectedCategoryId ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  Toutes les catégories
                </button>
              )}
              
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                    selectedCategoryId === category.id ? 'font-medium' : 'text-gray-700'
                  }`}
                  style={{
                    backgroundColor: selectedCategoryId === category.id ? `${category.color}20` : undefined,
                    color: selectedCategoryId === category.id ? category.color : undefined
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Affichage du filtre actif avec possibilité de le supprimer */}
      {selectedCategory && (
        <div className="mt-3 flex items-center space-x-2">
          <span className="text-sm text-gray-500">Filtre actif :</span>
          <div className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium text-white"
               style={{ backgroundColor: selectedCategory.color }}>
            <span>{selectedCategory.name}</span>
            <button
              onClick={() => handleCategorySelect(null)}
              className="ml-1 hover:bg-black/20 rounded-full p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Composant simple pour afficher juste les catégories sans filtrage
export function CategoryList({ categories, className = '' }: { categories: BlogCategory[], className?: string }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/blog/categorie/${category.slug}`}
          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: category.color }}
        >
          {category.name}
        </Link>
      ))}
    </div>
  )
}

// Hook personnalisé pour récupérer les catégories
export function useCategories() {
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/blog/categories')
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des catégories')
        }
        const data = await response.json()
        setCategories(data.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return { categories, loading, error }
}