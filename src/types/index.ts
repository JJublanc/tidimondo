// =====================================================
// TYPES EXISTANTS (Auth, Paiement, Utilisateurs)
// =====================================================

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  createdAt: string
  updatedAt: string
  stripeCustomerId?: string
  subscriptionStatus: 'active' | 'inactive' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
  subscriptionId?: string
  currentPeriodEnd?: string
  // Champs de la base de données
  clerk_user_id: string
  first_name?: string
  last_name?: string
  stripe_customer_id?: string
  subscription_status: 'active' | 'inactive' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
  subscription_id?: string
  current_period_end?: string
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  userId: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  stripePriceId: string
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid'
  currentPeriodStart: string
  currentPeriodEnd: string
  createdAt: string
  updatedAt: string
  // Champs de la base de données
  user_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  stripe_price_id: string
  current_period_start: string
  current_period_end: string
  created_at: string
  updated_at: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  interval: 'month' | 'year'
  stripePriceId: string
  features: string[]
}

// =====================================================
// EXPORT DES NOUVEAUX TYPES MÉTIER
// =====================================================

// Réexporter tous les types TidiMondo
export * from './tidimondo'

// Types utilitaires pour la compatibilité
export type DatabaseUser = User
export type DatabaseSubscription = Subscription