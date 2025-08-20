'use client'

import { UserButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SubscriptionGate } from '@/components/auth/SubscriptionGate'
import { useSubscription } from '@/hooks/useSubscription'
import {
  Crown,
  Calendar,
  FileText,
  Package,
  ChefHat,
  ArrowRight,
  TrendingUp,
  Users
} from 'lucide-react'

export default function DashboardPage() {
  const { user } = useUser()
  const { hasProAccess, loading } = useSubscription()

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
              <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">TidiMondo Dashboard</h1>
              {hasProAccess && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-green-50 text-green-800">
                  <Crown className="h-3 w-3 mr-1" />
                  Pro
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Bonjour, {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </span>
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tableau de bord</h2>
          <p className="text-gray-600">
            Bienvenue dans votre espace de planification culinaire
            {hasProAccess ? ' Pro' : ''}
          </p>
        </div>

        {/* Upgrade Banner for Free Users */}
        {!hasProAccess && !loading && (
          <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-lg p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  🚀 Passez au plan Pro !
                </h3>
                <p className="text-green-100">
                  Débloquez les séjours illimités, l&apos;export PDF et toutes les fonctionnalités avancées.
                </p>
              </div>
              <Link href="/pricing">
                <Button variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
                  <Crown className="h-4 w-4 mr-2" />
                  Découvrir Pro - 9,99€
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Stats Cards - Simplifiées */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Statut</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {hasProAccess ? 'Pro' : 'Gratuit'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Séjours</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {hasProAccess ? '∞' : '1 max'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-sky-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Recettes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {hasProAccess ? '∞' : '10 max'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Principale - Gros Blocs */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Accès rapide</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Mes Séjours */}
            <Link href="/sejours" className="group">
              <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-xl p-6 text-white hover:from-green-700 hover:to-green-600 transition-all duration-200 transform hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <Calendar className="h-8 w-8" />
                  <ArrowRight className="h-5 w-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Mes Séjours</h4>
                <p className="text-green-100 text-sm">
                  Planifiez et gérez vos séjours culinaires
                </p>
              </div>
            </Link>

            {/* Mes Recettes */}
            <Link href="/recettes" className="group">
              <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-xl p-6 text-white hover:from-orange-600 hover:to-orange-500 transition-all duration-200 transform hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <FileText className="h-8 w-8" />
                  <ArrowRight className="h-5 w-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Mes Recettes</h4>
                <p className="text-orange-100 text-sm">
                  Créez et organisez vos recettes
                </p>
              </div>
            </Link>

            {/* Mes Ingrédients */}
            <Link href="/ingredients" className="group">
              <div className="bg-gradient-to-r from-sky-500 to-sky-400 rounded-xl p-6 text-white hover:from-sky-600 hover:to-sky-500 transition-all duration-200 transform hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <Package className="h-8 w-8" />
                  <ArrowRight className="h-5 w-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Mes Ingrédients</h4>
                <p className="text-sky-100 text-sm">
                  Gérez votre inventaire d&apos;ingrédients
                </p>
              </div>
            </Link>

            {/* Mes Ustensiles */}
            <Link href="/ustensiles" className="group">
              <div className="bg-gradient-to-r from-gray-600 to-gray-500 rounded-xl p-6 text-white hover:from-gray-700 hover:to-gray-600 transition-all duration-200 transform hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <ChefHat className="h-8 w-8" />
                  <ArrowRight className="h-5 w-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Mes Ustensiles</h4>
                <p className="text-gray-100 text-sm">
                  Organisez vos ustensiles de cuisine
                </p>
              </div>
            </Link>

          </div>
        </div>

        {/* Actions Secondaires */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Raccourcis Utiles */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Raccourcis utiles
            </h3>
            <div className="space-y-3">
              <Link href="/sejours/nouveau">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Créer un nouveau séjour
                </Button>
              </Link>
              <Link href="/recettes/nouvelle">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Ajouter une recette
                </Button>
              </Link>
              {!hasProAccess && (
                <Link href="/pricing">
                  <Button className="w-full justify-start bg-green-600 hover:bg-green-700">
                    <Crown className="h-4 w-4 mr-2" />
                    Passer au Pro - 9,99€
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Aperçu Pro */}
          <SubscriptionGate
            fallback={
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-200">
                <div className="text-center">
                  <Crown className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Fonctionnalités Pro
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Débloquez toutes les fonctionnalités avancées pour seulement 9,99€/mois
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 mb-4">
                    <li>✓ Séjours illimités</li>
                    <li>✓ Export PDF des listes</li>
                    <li>✓ Synchronisation multi-appareils</li>
                  </ul>
                  <Link href="/pricing">
                    <Button className="bg-green-600 hover:bg-green-700">
                      Découvrir Pro
                    </Button>
                  </Link>
                </div>
              </div>
            }
          >
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Statistiques Pro
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Séjours créés</span>
                  <span className="font-semibold text-green-600">Illimités</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Recettes disponibles</span>
                  <span className="font-semibold text-green-600">Toutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Export PDF</span>
                  <span className="font-semibold text-green-600">Activé</span>
                </div>
              </div>
            </div>
          </SubscriptionGate>

        </div>

      </main>
    </div>
  )
}