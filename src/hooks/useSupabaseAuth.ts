'use client'

import { useSession } from '@clerk/nextjs'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'

// Hook d'authentification amélioré
export function useSupabaseAuth() {
  const { session } = useSession()

  useEffect(() => {
    if (session) {
      const signInWithClerk = async () => {
        try {
          const token = await session.getToken({ template: 'supabase' })
          
          if (token) {
            console.log('🔑 Authentification Supabase avec token Clerk')
            
            const { error } = await supabase.auth.setSession({
              access_token: token,
              refresh_token: ''
            })
            
            if (error) {
              console.error('❌ Erreur authentification Supabase:', error)
              throw error
            } else {
              console.log('✅ Authentification Supabase réussie')
            }
          }
        } catch (err) {
          console.error('❌ Erreur Supabase auth:', err)
        }
      }
      
      signInWithClerk()
    } else {
      // Déconnexion de Supabase si pas de session Clerk
      supabase.auth.signOut()
      console.log('🚪 Déconnexion Supabase')
    }
  }, [session])

  return { supabase }
}