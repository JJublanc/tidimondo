'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

interface SubscriptionData {
  subscription_status: string
  current_period_end: string | null
  stripe_customer_id: string | null
}

export function useSubscription() {
  const { user } = useUser()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSubscription() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('subscription_status, current_period_end, stripe_customer_id')
          .eq('clerk_user_id', user.id)
          .single()

        if (error) {
          // Si l'utilisateur n'existe pas encore dans Supabase, ce n'est pas une erreur critique
          if (error.code === 'PGRST116') {
            console.log('Utilisateur pas encore créé dans Supabase, statut par défaut appliqué')
            setSubscription(null)
          } else {
            console.error('Erreur lors de la récupération de l\'abonnement:', error)
            setError(error.message)
          }
        } else {
          setSubscription(data)
        }
      } catch (err) {
        console.error('Erreur:', err)
        setError('Erreur lors de la récupération des données')
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user])

  const hasActiveSubscription = subscription?.subscription_status === 'active' && 
    subscription?.current_period_end && 
    new Date(subscription.current_period_end) > new Date()

  const isTrialing = subscription?.subscription_status === 'trialing'
  const isPastDue = subscription?.subscription_status === 'past_due'
  const isCanceled = subscription?.subscription_status === 'canceled'

  return {
    subscription,
    hasActiveSubscription,
    isTrialing,
    isPastDue,
    isCanceled,
    loading,
    error,
    // Helper pour vérifier si l'utilisateur a accès aux fonctionnalités premium
    hasProAccess: hasActiveSubscription || isTrialing
  }
}