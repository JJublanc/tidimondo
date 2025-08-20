'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { UserButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  ChefHat, 
  ArrowLeft,
  Filter,
  Grid,
  List
} from 'lucide-react'

interface Ustensile {
  id: string
  nom: string
  description?: string
  categorie?: string
  created_at: string
}

export default function UstensilesPage() {
  const { user } = useUser()
  const [ustensiles, setUstensiles] = useState<Ustensile[]>([])
  const [filteredUstensiles, setFilteredUstensiles] = useState<Ustensile[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUstensile, setEditingUstensile] = useState<Ustensile | null>(null)
  const [newUstensile, setNewUstensile] = useState({
    nom: '',
    description: '',
    categorie: 'Cuisson'
  })

  const categories = [
    'Cuisson',
    'Préparation',
    'Service',
    'Mesure',
    'Découpe',
    'Mélange',
    'Autre'
  ]

  // Charger les ustensiles
  useEffect(() => {
    loadUstensiles()
  }, [])

  // Filtrer les ustensiles
  useEffect(() => {
    let filtered = ustensiles

    if (searchTerm) {
      filtered = filtered.filter(ustensile =>
        ustensile.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ustensile.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(ustensile => ustensile.categorie === selectedCategory)
    }

    setFilteredUstensiles(filtered)
  }, [ustensiles, searchTerm, selectedCategory])

  const loadUstensiles = async () => {
    try {
      const response = await fetch('/api/ustensiles')
      if (response.ok) {
        const result = await response.json()
        const ustensilesList = Array.isArray(result) ? result : (result.data?.ustensiles || [])
        setUstensiles(ustensilesList)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des ustensiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUstensile = async () => {
    if (!newUstensile.nom.trim()) return

    try {
      const response = await fetch('/api/ustensiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUstensile)
      })

      if (response.ok) {
        const ustensile = await response.json()
        setUstensiles(prev => [...prev, ustensile])
        setNewUstensile({ nom: '', description: '', categorie: 'Cuisson' })
        setShowAddModal(false)
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error)
    }
  }

  const handleEditUstensile = async () => {
    if (!editingUstensile || !editingUstensile.nom.trim()) return

    try {
      const response = await fetch(`/api/ustensiles/${editingUstensile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: editingUstensile.nom,
          description: editingUstensile.description,
          categorie: editingUstensile.categorie
        })
      })

      if (response.ok) {
        const updatedUstensile = await response.json()
        setUstensiles(prev => prev.map(u => u.id === updatedUstensile.id ? updatedUstensile : u))
        setEditingUstensile(null)
      }
    } catch (error) {
      console.error('Erreur lors de la modification:', error)
    }
  }

  const handleDeleteUstensile = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet ustensile ?')) return

    try {
      const response = await fetch(`/api/ustensiles/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setUstensiles(prev => prev.filter(u => u.id !== id))
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }

  if (!user) {
    return <div>Chargement...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Mes Ustensiles</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </span>
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestion des Ustensiles</h2>
            <p className="text-gray-600">
              Organisez et gérez vos ustensiles de cuisine
            </p>
          </div>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="mt-4 sm:mt-0 bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un ustensile
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher un ustensile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">Toutes catégories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* View Mode */}
              <div className="flex items-center space-x-1 border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded ${viewMode === 'grid' ? 'bg-green-100 text-green-600' : 'text-gray-400'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded ${viewMode === 'list' ? 'bg-green-100 text-green-600' : 'text-gray-400'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total ustensiles</p>
                <p className="text-2xl font-semibold text-gray-900">{ustensiles.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Filter className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Catégories</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {new Set(ustensiles.map(u => u.categorie)).size}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                <Search className="w-6 h-6 text-sky-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Résultats</p>
                <p className="text-2xl font-semibold text-gray-900">{filteredUstensiles.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ustensiles List/Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des ustensiles...</p>
          </div>
        ) : filteredUstensiles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun ustensile trouvé</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Aucun ustensile ne correspond à vos critères de recherche.'
                : 'Commencez par ajouter vos premiers ustensiles.'
              }
            </p>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un ustensile
            </Button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
          }>
            {filteredUstensiles.map((ustensile) => (
              <div key={ustensile.id} className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow ${
                viewMode === 'list' ? 'p-4' : 'p-6'
              }`}>
                {viewMode === 'grid' ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <ChefHat className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingUstensile(ustensile)}
                          className="text-gray-400 hover:text-green-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUstensile(ustensile.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{ustensile.nom}</h3>
                    {ustensile.description && (
                      <p className="text-sm text-gray-600 mb-3">{ustensile.description}</p>
                    )}
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {ustensile.categorie}
                    </span>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <ChefHat className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{ustensile.nom}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>{ustensile.categorie}</span>
                          {ustensile.description && (
                            <>
                              <span>•</span>
                              <span>{ustensile.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingUstensile(ustensile)}
                        className="text-gray-400 hover:text-green-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUstensile(ustensile.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter un ustensile</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'ustensile *
                </label>
                <input
                  type="text"
                  value={newUstensile.nom}
                  onChange={(e) => setNewUstensile(prev => ({ ...prev, nom: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ex: Couteau de chef"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newUstensile.description}
                  onChange={(e) => setNewUstensile(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="Description optionnelle..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  value={newUstensile.categorie}
                  onChange={(e) => setNewUstensile(prev => ({ ...prev, categorie: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddModal(false)
                  setNewUstensile({ nom: '', description: '', categorie: 'Cuisson' })
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleAddUstensile}
                disabled={!newUstensile.nom.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                Ajouter
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUstensile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Modifier l'ustensile</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'ustensile *
                </label>
                <input
                  type="text"
                  value={editingUstensile.nom}
                  onChange={(e) => setEditingUstensile(prev => prev ? { ...prev, nom: e.target.value } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editingUstensile.description || ''}
                  onChange={(e) => setEditingUstensile(prev => prev ? { ...prev, description: e.target.value } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  value={editingUstensile.categorie || 'Cuisson'}
                  onChange={(e) => setEditingUstensile(prev => prev ? { ...prev, categorie: e.target.value } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setEditingUstensile(null)}
              >
                Annuler
              </Button>
              <Button
                onClick={handleEditUstensile}
                disabled={!editingUstensile.nom.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                Sauvegarder
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}