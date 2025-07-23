'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '@/lib/supabase-client'

interface SubscriptionData {
  subscription_status: string
  current_period_end: string | null
  stripe_customer_id: string | null
}

export function useSubscription() {
  const { user, loading: authLoading } = useAuth()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) {
      return // Attendre que l'authentification soit chargée
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
        
        console.log('📡 Récupération de l\'abonnement pour user:', user.id)
        
        const { data, error: supabaseError } = await supabase
          .from('users')
          .select('subscription_status, current_period_end, stripe_customer_id')
          .eq('id', user.id) // Utiliser l'ID Supabase directement
          .single()

        if (supabaseError) {
          if (supabaseError.code === 'PGRST116') {
            console.log('ℹ️ Utilisateur pas encore créé dans la table users')
            setSubscription(null)
          } else {
            console.error('❌ Erreur Supabase:', supabaseError)
            setError(supabaseError.message)
          }
        } else {
          console.log('✅ Données utilisateur récupérées:', data)
          setSubscription(data)
        }
      } catch (err) {
        console.error('❌ Erreur lors de la récupération:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user, authLoading])

  return { subscription, loading, error }
}