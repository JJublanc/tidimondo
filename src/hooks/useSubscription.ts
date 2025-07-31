'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useSupabaseWithClerk } from './useSupabaseWithClerk'

interface SubscriptionData {
  subscription_status: string
  current_period_end: string | null
  stripe_customer_id: string | null
}

export function useSubscription() {
  const { user, isLoaded } = useUser()
  const { supabase } = useSupabaseWithClerk()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) {
      return // Attendre que Clerk soit chargé
    }

    if (!user) {
      console.log('❌ Pas d\'utilisateur authentifié')
      setSubscription(null)
      setLoading(false)
      setError(null)
      return
    }

    const fetchSubscription = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('📡 Initialisation utilisateur pour:', user.id)
        
        // APPROCHE DIRECTE : Créer/mettre à jour l'utilisateur d'abord
        // La fonction gère automatiquement les conflits avec ON CONFLICT
        const { data: userResult, error: createError } = await supabase
          .rpc('create_user_profile', {
            p_clerk_user_id: user.id,
            p_email: user.emailAddresses[0]?.emailAddress || null
          })

        if (createError) {
          console.error('❌ Erreur initialisation utilisateur:', createError)
          setError(`Erreur initialisation: ${createError.message}`)
          return
        }

        console.log('✅ Utilisateur initialisé:', userResult)
        
        // Utiliser les données retournées par la fonction
        setSubscription({
          subscription_status: userResult.subscription_status || 'free',
          current_period_end: userResult.current_period_end || null,
          stripe_customer_id: userResult.stripe_customer_id || null
        })

      } catch (err) {
        console.error('❌ Erreur lors de l\'initialisation:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user, isLoaded])

  // Calculer hasProAccess basé sur le statut d'abonnement
  const hasProAccess = subscription?.subscription_status === 'active'

  return { subscription, loading, error, hasProAccess }
}