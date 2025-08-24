import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { targetEmail } = await request.json()

    if (!targetEmail) {
      return NextResponse.json(
        { error: 'Email cible requis' },
        { status: 400 }
      )
    }

    console.log('🔧 Promotion admin demandée:', { adminUserId: userId, targetEmail })

    // Utiliser la fonction sécurisée de promotion
    const { data, error } = await supabaseAdmin
      .rpc('promote_user_to_admin', {
        p_target_email: targetEmail,
        p_admin_clerk_user_id: userId
      })

    if (error) {
      console.error('❌ Erreur lors de la promotion:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.log('✅ Utilisateur promu avec succès:', targetEmail)

    return NextResponse.json({
      success: true,
      message: `Utilisateur ${targetEmail} promu administrateur avec succès`
    })

  } catch (error) {
    console.error('❌ Erreur dans l\'API de promotion:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { targetEmail } = await request.json()

    if (!targetEmail) {
      return NextResponse.json(
        { error: 'Email cible requis' },
        { status: 400 }
      )
    }

    console.log('🔧 Révocation admin demandée:', { adminUserId: userId, targetEmail })

    // Utiliser la fonction sécurisée de révocation
    const { data, error } = await supabaseAdmin
      .rpc('revoke_admin_rights', {
        p_target_email: targetEmail,
        p_admin_clerk_user_id: userId
      })

    if (error) {
      console.error('❌ Erreur lors de la révocation:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.log('✅ Droits admin révoqués avec succès:', targetEmail)

    return NextResponse.json({
      success: true,
      message: `Droits administrateur révoqués pour ${targetEmail}`
    })

  } catch (error) {
    console.error('❌ Erreur dans l\'API de révocation:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}