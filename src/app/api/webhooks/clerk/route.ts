import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { headers } from 'next/headers'
import { Webhook } from 'svix'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  
  const svixId = headersList.get('svix-id')
  const svixTimestamp = headersList.get('svix-timestamp')
  const svixSignature = headersList.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: 'Headers Svix manquants' },
      { status: 400 }
    )
  }

  const webhook = new Webhook(process.env.WEBHOOK_SECRET!)
  let event

  try {
    event = webhook.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    })
  } catch (error) {
    console.error('Erreur de vérification du webhook Clerk:', error)
    return NextResponse.json(
      { error: 'Signature webhook invalide' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'user.created': {
        const { id, email_addresses, first_name, last_name } = event.data
        console.log('User created:', id)

        const { error } = await supabaseAdmin
          .from('users')
          .insert({
            clerk_user_id: id,
            email: email_addresses[0]?.email_address,
            first_name: first_name || null,
            last_name: last_name || null,
            subscription_status: 'inactive',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (error) {
          console.error('Erreur lors de la création de l\'utilisateur:', error)
        } else {
          console.log('Utilisateur créé dans Supabase:', id)
        }
        break
      }

      case 'user.updated': {
        const { id, email_addresses, first_name, last_name } = event.data
        console.log('User updated:', id)

        const { error } = await supabaseAdmin
          .from('users')
          .update({
            email: email_addresses[0]?.email_address,
            first_name: first_name || null,
            last_name: last_name || null,
            updated_at: new Date().toISOString()
          })
          .eq('clerk_user_id', id)

        if (error) {
          console.error('Erreur lors de la mise à jour de l\'utilisateur:', error)
        } else {
          console.log('Utilisateur mis à jour dans Supabase:', id)
        }
        break
      }

      case 'user.deleted': {
        const { id } = event.data
        console.log('User deleted:', id)

        const { error } = await supabaseAdmin
          .from('users')
          .delete()
          .eq('clerk_user_id', id)

        if (error) {
          console.error('Erreur lors de la suppression de l\'utilisateur:', error)
        } else {
          console.log('Utilisateur supprimé de Supabase:', id)
        }
        break
      }

      default:
        console.log('Événement Clerk non géré:', event.type)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Erreur lors du traitement du webhook Clerk:', error)
    return NextResponse.json(
      { error: 'Erreur lors du traitement du webhook' },
      { status: 500 }
    )
  }
}