import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check, ArrowLeft } from 'lucide-react'

export default async function PricingPage() {
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
              <span>Retour au dashboard</span>
            </Link>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">TidiMondo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choisissez votre plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Débloquez toutes les fonctionnalités de TidiMondo avec notre plan Pro
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Plan Gratuit */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan Gratuit</h3>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                0€<span className="text-lg text-gray-600">/mois</span>
              </div>
              <p className="text-gray-600">Pour découvrir TidiMondo</p>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                'Accès limité aux fonctionnalités',
                'Support communautaire',
                '1 projet maximum',
                'Stockage limité'
              ].map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <Button variant="outline" className="w-full" size="lg" disabled>
              Plan actuel
            </Button>
          </div>

          {/* Plan Pro */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-blue-500 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                Recommandé
              </span>
            </div>
            
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan Pro</h3>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                29€<span className="text-lg text-gray-600">/mois</span>
              </div>
              <p className="text-gray-600">Pour les professionnels</p>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                'Accès complet à toutes les fonctionnalités',
                'Support prioritaire 24/7',
                'Projets illimités',
                'Stockage illimité',
                'API complète',
                'Analytics avancées',
                'Intégrations premium',
                'Sauvegardes automatiques'
              ].map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <form action="/api/create-checkout-session" method="POST">
              <input type="hidden" name="priceId" value={process.env.NEXT_PUBLIC_STRIPE_PRICE_ID} />
              <input type="hidden" name="userId" value={user.id} />
              <input type="hidden" name="userEmail" value={user.emailAddresses[0]?.emailAddress} />
              <Button type="submit" className="w-full" size="lg">
                S'abonner maintenant
              </Button>
            </form>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Questions fréquentes
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Puis-je annuler à tout moment ?
              </h3>
              <p className="text-gray-600">
                Oui, vous pouvez annuler votre abonnement à tout moment. Votre accès restera actif jusqu'à la fin de votre période de facturation.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Y a-t-il une période d'essai ?
              </h3>
              <p className="text-gray-600">
                Le plan gratuit vous permet de tester les fonctionnalités de base. Vous pouvez passer au plan Pro à tout moment.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Comment fonctionne la facturation ?
              </h3>
              <p className="text-gray-600">
                La facturation est mensuelle et automatique. Vous recevrez une facture par email à chaque renouvellement.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Puis-je changer de plan ?
              </h3>
              <p className="text-gray-600">
                Vous pouvez passer du plan gratuit au plan Pro à tout moment. Les changements prennent effet immédiatement.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}