'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import {
  Users,
  FileText,
  Settings,
  BarChart3,
  Shield,
  BookOpen,
  Plus,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'

interface AdminStats {
  totalUsers: number
  totalArticles: number
  pendingArticles: number
  totalViews: number
}

export default function AdminDashboard() {
  const { user, isLoaded } = useUser()
  const { isAdmin, loading: adminLoading, error: adminError } = useIsAdmin()
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalArticles: 0,
    pendingArticles: 0,
    totalViews: 0
  })

  useEffect(() => {
    if (isAdmin) {
      // Charger les statistiques d'administration
      setStats({
        totalUsers: 156,
        totalArticles: 23,
        pendingArticles: 5,
        totalViews: 12450
      })
    }
  }, [isAdmin])

  if (!isLoaded || adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Administration" backLink="/dashboard" />
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-600">Chargement...</div>
        </div>
      </div>
    )
  }

  if (adminError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Erreur" backLink="/dashboard" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Erreur de vérification
            </h2>
            <p className="text-gray-600 mb-6">
              Une erreur s'est produite lors de la vérification de vos permissions : {adminError}
            </p>
            <Link href="/dashboard">
              <Button className="bg-green-600 hover:bg-green-700">
                Retour au dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Accès refusé" backLink="/dashboard" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Accès administrateur requis
            </h2>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
              Seuls les administrateurs peuvent accéder au panneau d'administration.
            </p>
            <Link href="/dashboard">
              <Button className="bg-green-600 hover:bg-green-700">
                Retour au dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Administration TidiMondo" backLink="/dashboard" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Panneau d'administration
          </h2>
          <p className="text-gray-600">
            Bienvenue {user?.firstName}, gérez votre plateforme TidiMondo
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Utilisateurs</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalUsers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Articles</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalArticles}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.pendingArticles}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Vues totales</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalViews.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gestion du Blog */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                <BookOpen className="w-5 h-5 inline mr-2" />
                Gestion du Blog
              </h3>
              <Link href="/admin/blog/nouveau">
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-1" />
                  Nouvel article
                </Button>
              </Link>
            </div>
            
            <div className="space-y-3">
              <Link href="/admin/blog" className="block">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center">
                    <Edit className="w-4 h-4 text-gray-500 mr-3" />
                    <span className="text-sm font-medium text-gray-900">
                      Gérer les articles
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {stats.totalArticles} articles
                  </span>
                </div>
              </Link>

              <Link href="/blog" className="block">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 text-gray-500 mr-3" />
                    <span className="text-sm font-medium text-gray-900">
                      Voir le blog public
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {stats.totalViews} vues
                  </span>
                </div>
              </Link>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <Settings className="w-4 h-4 text-yellow-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">
                    Articles en modération
                  </span>
                </div>
                <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                  {stats.pendingArticles} en attente
                </span>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              <Settings className="w-5 h-5 inline mr-2" />
              Actions rapides
            </h3>
            
            <div className="space-y-3">
              <Link href="/admin/users" className="block">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 text-gray-500 mr-3" />
                    <span className="text-sm font-medium text-gray-900">
                      Gérer les utilisateurs
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Promouvoir/Révoquer admins
                  </span>
                </div>
              </Link>

              <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <BarChart3 className="w-4 h-4 text-gray-500 mr-3" />
                  <span className="text-sm font-medium text-gray-900">
                    Statistiques détaillées
                  </span>
                </div>
                <span className="text-xs text-gray-500">Bientôt</span>
              </button>

              <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <Settings className="w-4 h-4 text-gray-500 mr-3" />
                  <span className="text-sm font-medium text-gray-900">
                    Configuration
                  </span>
                </div>
                <span className="text-xs text-gray-500">Bientôt</span>
              </button>
            </div>
          </div>
        </div>

        {/* Instructions pour les administrateurs */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">
            Guide administrateur
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p><strong>Pour ajouter un article :</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Cliquez sur "Nouvel article" ci-dessus</li>
              <li>Remplissez le formulaire avec titre, contenu, catégorie</li>
              <li>Choisissez "Soumettre pour publication" pour publier directement</li>
              <li>Les articles d'administrateur sont publiés sans modération</li>
            </ol>
            <p className="mt-3">
              <strong>Note :</strong> En tant qu'administrateur, vos articles sont automatiquement approuvés.
              Les articles des utilisateurs Premium passent par la modération.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}