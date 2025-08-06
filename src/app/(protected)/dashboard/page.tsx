'use client'

import { UserButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SubscriptionGate, PremiumBlur } from '@/components/auth/SubscriptionGate'
import { useSubscription } from '@/hooks/useSubscription'
import {
  Crown,
  BarChart3,
  Users,
  Zap,
  Settings,
  FileText,
  HelpCircle,
  TrendingUp,
  Calendar,
  Bell
} from 'lucide-react'

export default function DashboardPage() {
  const { user } = useUser()
  const { hasProAccess, subscription, loading } = useSubscription()

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
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">TidiMondo Dashboard</h1>
              {hasProAccess && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800">
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
            Bienvenue dans votre espace personnel TidiMondo
            {hasProAccess ? ' Pro' : ''}
          </p>
        </div>

        {/* Upgrade Banner for Free Users */}
        {!hasProAccess && !loading && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  🚀 Passez au plan Pro !
                </h3>
                <p className="text-blue-100">
                  Débloquez toutes les fonctionnalités avancées et boostez votre productivité.
                </p>
              </div>
              <Link href="/pricing">
                <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                  <Crown className="h-4 w-4 mr-2" />
                  Découvrir Pro
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Basic Stats - Always visible */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
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
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Projets</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {hasProAccess ? '∞' : '1'}
                </p>
              </div>
            </div>
          </div>

          {/* Premium Stats */}
          <SubscriptionGate
            fallback={
              <div className="bg-white rounded-lg shadow p-6 opacity-50">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Analytics</p>
                    <p className="text-2xl font-semibold text-gray-900">Pro</p>
                  </div>
                </div>
              </div>
            }
          >
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Analytics</p>
                  <p className="text-2xl font-semibold text-gray-900">24.5k</p>
                </div>
              </div>
            </div>
          </SubscriptionGate>

          <SubscriptionGate
            fallback={
              <div className="bg-white rounded-lg shadow p-6 opacity-50">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Croissance</p>
                    <p className="text-2xl font-semibold text-gray-900">Pro</p>
                  </div>
                </div>
              </div>
            }
          >
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Croissance</p>
                  <p className="text-2xl font-semibold text-gray-900">+12%</p>
                </div>
              </div>
            </div>
          </SubscriptionGate>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Actions rapides</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {!hasProAccess && (
              <Link href="/pricing">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Crown className="h-4 w-4 mr-2" />
                  Passer au Pro
                </Button>
              </Link>
            )}
            <Link href="/settings">
              <Button className="w-full" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
            </Link>
            <Button className="w-full" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Documentation
            </Button>
            <Button className="w-full" variant="outline">
              <HelpCircle className="h-4 w-4 mr-2" />
              Support
            </Button>
          </div>
        </div>

        {/* Premium Features Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Analytics Chart - Premium */}
          <SubscriptionGate>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Analytics avancées
              </h3>
              <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-600">Graphiques détaillés</p>
                </div>
              </div>
            </div>
          </SubscriptionGate>

          {/* Calendar - Premium with Blur */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Calendrier des tâches
            </h3>
            <PremiumBlur>
              <div className="h-64 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Calendar className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <p className="text-gray-600">Planning intelligent</p>
                </div>
              </div>
            </PremiumBlur>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Activité récente
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-blue-600" />
              <span className="text-gray-700">Bienvenue sur TidiMondo !</span>
              <span className="text-sm text-gray-500">Il y a quelques instants</span>
            </div>
            {hasProAccess && (
              <div className="flex items-center space-x-3">
                <Crown className="h-5 w-5 text-purple-600" />
                <span className="text-gray-700">Abonnement Pro activé</span>
                <span className="text-sm text-gray-500">Aujourd&apos;hui</span>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}