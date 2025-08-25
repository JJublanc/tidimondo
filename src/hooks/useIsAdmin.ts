'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

interface AdminCheckResult {
  isAdmin: boolean
  loading: boolean
  error: string | null
}

export function useIsAdmin(): AdminCheckResult {
  const { user, isLoaded } = useUser()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) {
      return // Attendre que Clerk soit chargé
    }

    if (!user) {
      console.log('❌ Pas d\'utilisateur authentifié')
      setIsAdmin(false)
      setLoading(false)
      setError(null)
      return
    }

    const checkAdminStatus = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('🔍 Vérification statut admin pour:', user.id)
        
        const response = await fetch('/api/admin/check', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`)
        }

        const data = await response.json()
        
        if (data.error) {
          throw new Error(data.error)
        }

        console.log('✅ Statut admin reçu:', data.isAdmin)
        setIsAdmin(data.isAdmin === true)

      } catch (err) {
        console.error('❌ Erreur lors de la vérification admin:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [user, isLoaded])

  return { isAdmin, loading, error }
}