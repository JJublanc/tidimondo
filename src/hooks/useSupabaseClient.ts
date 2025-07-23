'use client'

import { useSession } from '@clerk/nextjs'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useRef, useState } from 'react'

export function useSupabaseClient(): SupabaseClient {
  const { session } = useSession()
  const [client] = useState(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ))
  const lastTokenRef = useRef<string | null>(null)

  useEffect(() => {
    const updateAuth = async () => {
      if (!session) {
        console.log('❌ Pas de session Clerk disponible')
        // Nettoyer la session Supabase
        await client.auth.signOut()
        lastTokenRef.current = null
        return
      }

      try {
        console.log('🎫 Récupération d\'un token Clerk frais...')
        const token = await session.getToken({ template: 'supabase' })
        
        // Décoder et logger le contenu du token
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            console.log('🔍 Contenu du token Clerk:', {
              sub: payload.sub,
              supabase_id: payload.supabase_id,
              email: payload.email,
              exp: payload.exp,
              iat: payload.iat
            })
          } catch (e) {
            console.log('⚠️ Impossible de décoder le token:', token.substring(0, 50) + '...')
          }
        }
        
        if (token && token !== lastTokenRef.current) {
          console.log('✅ Nouveau token Clerk récupéré, connexion avec signInWithJwt')
          
          const { error } = await client.auth.signInWithJwt({
            token,
            options: {
              persistSession: true
            }
          })
          
          if (error) {
            console.error('❌ Erreur lors de la connexion JWT:', error)
          } else {
            console.log('✅ Connexion Supabase réussie avec JWT')
            lastTokenRef.current = token
          }
        } else if (!token) {
          console.log('⚠️ Template "supabase" non disponible, utilisation du token par défaut')
          const defaultToken = await session.getToken()
          
          if (defaultToken && defaultToken !== lastTokenRef.current) {
            console.log('✅ Connexion avec token par défaut')
            
            const { error } = await client.auth.signInWithJwt({ token: defaultToken })
            
            if (error) {
              console.error('❌ Erreur avec token par défaut:', error)
            } else {
              console.log('✅ Connexion configurée avec token par défaut')
              lastTokenRef.current = defaultToken
            }
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors de la récupération du token:', error)
      }
    }

    updateAuth()

    // Rafraîchir le token toutes les 30 secondes pour éviter l'expiration
    const interval = setInterval(updateAuth, 30000)
    
    return () => clearInterval(interval)
  }, [session, client])

  return client
}