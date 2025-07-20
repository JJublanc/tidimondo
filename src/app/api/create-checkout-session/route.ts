import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { currentUser } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const priceId = formData.get('priceId') as string
    const userId = formData.get('userId') as string
    const userEmail = formData.get('userEmail') as string

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID manquant' },
        { status: 400 }
      )
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
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
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