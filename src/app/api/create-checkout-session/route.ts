import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { currentUser } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Début de la création de session checkout')
    
    const user = await currentUser()
    console.log('👤 Utilisateur récupéré:', user ? 'OK' : 'NON TROUVÉ')
    
    if (!user) {
      console.log('❌ Utilisateur non autorisé')
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const priceId = formData.get('priceId') as string
    const userId = formData.get('userId') as string
    const userEmail = formData.get('userEmail') as string

    console.log('📋 Données reçues:', {
      priceId,
      userId,
      userEmail,
      appUrl: process.env.NEXT_PUBLIC_APP_URL
    })

    if (!priceId) {
      console.log('❌ Price ID manquant')
      return NextResponse.json(
        { error: 'Price ID manquant' },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tidimondo.com'
    
    console.log('🌐 URL de l\'application:', {
      envVar: process.env.NEXT_PUBLIC_APP_URL,
      finalUrl: appUrl
    })

    if (!appUrl.startsWith('http')) {
      console.log('❌ URL invalide, ajout du protocole https')
      const correctedUrl = `https://${appUrl}`
      console.log('✅ URL corrigée:', correctedUrl)
    }

    // Créer ou récupérer le client Stripe
    let customer
    try {
      // Chercher si le client existe déjà
      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1
      })

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0]
      } else {
        // Créer un nouveau client
        customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            clerk_user_id: userId
          }
        })
      }
    } catch (error) {
      console.error('Erreur lors de la création/récupération du client:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la création du client' },
        { status: 500 }
      )
    }

    // Créer la session de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${appUrl}/dashboard?success=true`,
      cancel_url: `${appUrl}/pricing?canceled=true`,
      metadata: {
        clerk_user_id: userId,
      },
      subscription_data: {
        metadata: {
          clerk_user_id: userId,
        },
      },
    })

    if (!session.url) {
      return NextResponse.json(
        { error: 'Erreur lors de la création de la session' },
        { status: 500 }
      )
    }

    // Rediriger vers Stripe Checkout
    return NextResponse.redirect(session.url, 303)

  } catch (error) {
    console.error('Erreur lors de la création de la session de checkout:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}