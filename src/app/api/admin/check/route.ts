import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { isAdmin: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    console.log('🔍 Vérification statut admin pour:', userId)

    // Utiliser la fonction sécurisée de la base de données
    const { data, error } = await supabaseAdmin
      .rpc('is_user_admin', { p_clerk_user_id: userId })

    if (error) {
      console.error('❌ Erreur lors de la vérification admin:', error)
      return NextResponse.json(
        { isAdmin: false, error: 'Erreur lors de la vérification' },
        { status: 500 }
      )
    }

    const isAdmin = data === true

    console.log('✅ Statut admin vérifié:', { userId, isAdmin })

    return NextResponse.json({
      isAdmin,
      userId
    })

  } catch (error) {
    console.error('❌ Erreur dans l\'API de vérification admin:', error)
    return NextResponse.json(
      { isAdmin: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}