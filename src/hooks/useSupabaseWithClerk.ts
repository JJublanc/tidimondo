'use client'

import { useAuth, useSession } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'
import { useMemo } from 'react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function useSupabaseWithClerk() {
  const { getToken } = useAuth()
  const { session } = useSession()

  const supabase = useMemo(() => {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        // Fonction pour récupérer le token JWT de Clerk
        fetch: async (url, options = {}) => {
          const clerkToken = await getToken({
            template: 'supabase'
          })

          // Ajouter le token d'autorisation aux headers
          const headers = new Headers(options?.headers)
          if (clerkToken) {
            headers.set('Authorization', `Bearer ${clerkToken}`)
          }

          // Effectuer la requête avec le token
          return fetch(url, {
            ...options,
            headers,
          })
        },
      },
    })
  }, [getToken])

  return { supabase, session }
}