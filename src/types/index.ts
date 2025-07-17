export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  createdAt: string
  updatedAt: string
  stripeCustomerId?: string
  subscriptionStatus: 'active' | 'inactive' | 'canceled' | 'past_due'
  subscriptionId?: string
  currentPeriodEnd?: string
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