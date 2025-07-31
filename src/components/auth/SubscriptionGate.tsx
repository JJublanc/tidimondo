'use client'

import { useSubscription } from '@/hooks/useSubscription'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Crown, Lock } from 'lucide-react'

interface SubscriptionGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  showUpgrade?: boolean
}

export function SubscriptionGate({ 
  children, 
  fallback, 
  showUpgrade = true 
}: SubscriptionGateProps) {
  const { hasProAccess, loading } = useSubscription()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (hasProAccess) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }


  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 text-center">
      <Crown className="h-12 w-12 text-blue-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Fonctionnalité Premium
      </h3>
      <p className="text-gray-600 mb-4">
        Cette fonctionnalité est réservée aux abonnés Pro. 
        Passez au plan Pro pour débloquer toutes les fonctionnalités.
      </p>
      {showUpgrade && (
        <Link href="/pricing">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Crown className="h-4 w-4 mr-2" />
            Passer au Pro
          </Button>
        </Link>
      )}
    </div>
  )
}

// Composant pour flouter le contenu premium
export function PremiumBlur({ 
  children, 
  enabled = true 
}: { 
  children: React.ReactNode
  enabled?: boolean 
}) {
  const { hasProAccess } = useSubscription()

  if (hasProAccess || !enabled) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/80">
        <div className="text-center">
          <Crown className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Contenu Premium</p>
          <Link href="/pricing">
            <Button size="sm" className="mt-2">
              Débloquer
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}