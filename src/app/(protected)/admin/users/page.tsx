'use client'

import { useState } from 'react'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Shield, UserPlus, UserMinus, AlertCircle } from 'lucide-react'

export default function AdminUsersPage() {
  const { isAdmin, loading } = useIsAdmin()
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [revokeAdminEmail, setRevokeAdminEmail] = useState('')
  const [promoting, setPromoting] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handlePromoteAdmin = async () => {
    if (!newAdminEmail.trim()) {
      setMessage({ type: 'error', text: 'Veuillez saisir un email' })
      return
    }

    setPromoting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetEmail: newAdminEmail.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la promotion')
      }

      setMessage({ type: 'success', text: data.message })
      setNewAdminEmail('')
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Erreur inconnue' 
      })
    } finally {
      setPromoting(false)
    }
  }

  const handleRevokeAdmin = async () => {
    if (!revokeAdminEmail.trim()) {
      setMessage({ type: 'error', text: 'Veuillez saisir un email' })
      return
    }

    if (!confirm(`Êtes-vous sûr de vouloir révoquer les droits administrateur de ${revokeAdminEmail} ?`)) {
      return
    }

    setRevoking(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/promote', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetEmail: revokeAdminEmail.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la révocation')
      }

      setMessage({ type: 'success', text: data.message })
      setRevokeAdminEmail('')
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Erreur inconnue' 
      })
    } finally {
      setRevoking(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Gestion des utilisateurs" backLink="/admin" />
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-600">Chargement...</div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Accès refusé" backLink="/admin" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Accès administrateur requis
            </h2>
            <p className="text-gray-600">
              Vous n'avez pas les permissions nécessaires pour gérer les utilisateurs.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Gestion des utilisateurs" backLink="/admin" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {message.text}
            </div>
          </div>
        )}

        {/* Promouvoir un administrateur */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            <UserPlus className="w-5 h-5 inline mr-2" />
            Promouvoir un administrateur
          </h2>
          <p className="text-gray-600 mb-4">
            Accordez les droits d'administration à un utilisateur existant.
          </p>
          
          <div className="flex gap-4">
            <Input
              type="email"
              placeholder="Email de l'utilisateur"
              value={newAdminEmail}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAdminEmail(e.target.value)}
              className="flex-1"
              disabled={promoting}
            />
            <Button
              onClick={handlePromoteAdmin}
              disabled={promoting || !newAdminEmail.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {promoting ? 'Promotion...' : 'Promouvoir'}
            </Button>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            <p><strong>Note :</strong> L'utilisateur doit déjà avoir un compte sur TidiMondo.</p>
          </div>
        </div>

        {/* Révoquer un administrateur */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            <UserMinus className="w-5 h-5 inline mr-2" />
            Révoquer les droits administrateur
          </h2>
          <p className="text-gray-600 mb-4">
            Retirez les droits d'administration à un utilisateur.
          </p>
          
          <div className="flex gap-4">
            <Input
              type="email"
              placeholder="Email de l'administrateur"
              value={revokeAdminEmail}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRevokeAdminEmail(e.target.value)}
              className="flex-1"
              disabled={revoking}
            />
            <Button
              onClick={handleRevokeAdmin}
              disabled={revoking || !revokeAdminEmail.trim()}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              {revoking ? 'Révocation...' : 'Révoquer'}
            </Button>
          </div>
          
          <div className="mt-4 text-sm text-red-600">
            <p><strong>Attention :</strong> Cette action est irréversible. L'utilisateur perdra immédiatement ses droits d'administration.</p>
          </div>
        </div>

        {/* Informations de sécurité */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">
            <Shield className="w-5 h-5 inline mr-2" />
            Sécurité et bonnes pratiques
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <ul className="list-disc list-inside space-y-1">
              <li>Seuls les administrateurs existants peuvent promouvoir d'autres utilisateurs</li>
              <li>Il doit toujours y avoir au moins un administrateur sur la plateforme</li>
              <li>Les droits sont vérifiés côté serveur pour une sécurité maximale</li>
              <li>Toutes les actions d'administration sont tracées dans les logs</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}