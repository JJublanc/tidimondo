import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

// Client Supabase avec service role pour création d'utilisateur
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/users/me - Récupérer les informations de l'utilisateur actuel
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer les informations utilisateur depuis la base de données
    const { data: user, error } = await supabase
      .from('users')
      .select('id, clerk_user_id, email, subscription_status, is_admin, created_at')
      .eq('clerk_user_id', clerkUserId)
      .single()

    if (error && error.code === 'PGRST116') {
      // Utilisateur n'existe pas, le créer automatiquement
      console.log('Utilisateur non trouvé, création automatique pour:', clerkUserId)
      
      try {
        // Récupérer l'email depuis Clerk
        const client = await clerkClient()
        const clerkUser = await client.users.getUser(clerkUserId)
        const email = clerkUser.emailAddresses[0]?.emailAddress || `${clerkUserId}@unknown.com`
        
        // Créer l'utilisateur dans Supabase
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            clerk_user_id: clerkUserId,
            email: email,
            subscription_status: 'active', // Par défaut premium pour les tests
            is_admin: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (createError) {
          console.error('Erreur lors de la création de l\'utilisateur:', createError)
          return NextResponse.json(
            { error: 'Erreur lors de la création de l\'utilisateur' },
            { status: 500 }
          )
        }

        console.log('✅ Utilisateur créé avec succès:', newUser.id)
        return NextResponse.json(newUser)
        
      } catch (clerkError) {
        console.error('Erreur lors de la récupération des données Clerk:', clerkError)
        return NextResponse.json(
          { error: 'Erreur lors de la récupération des données utilisateur' },
          { status: 500 }
        )
      }
    }

    if (error || !user) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error)
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)

  } catch (error) {
    console.error('Erreur serveur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}