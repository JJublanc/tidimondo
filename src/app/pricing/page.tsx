import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check, ArrowLeft, Crown, Calendar, FileText, Download, Smartphone, HeadphonesIcon, Shield } from 'lucide-react'

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
              <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">TidiMondo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choisissez votre plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Débloquez toutes les fonctionnalités de TidiMondo pour planifier vos séjours culinaires sans limites
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
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
                { icon: Calendar, text: '1 séjour maximum' },
                { icon: FileText, text: '5 recettes du catalogue' },
                { icon: FileText, text: '5 recettes personnelles' },
                { icon: null, text: 'Gestion ingrédients/ustensiles' },
                { icon: null, text: 'Support communautaire' }
              ].map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <div className="flex items-center">
                    {feature.icon && <feature.icon className="h-4 w-4 text-gray-500 mr-2" />}
                    <span className="text-gray-700">{feature.text}</span>
                  </div>
                </li>
              ))}
            </ul>

            <Button variant="outline" className="w-full" size="lg" disabled>
              Plan actuel
            </Button>
          </div>

          {/* Plan Pro */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-green-500 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                Recommandé
              </span>
            </div>
            
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-2">
                <Crown className="h-6 w-6 text-green-600 mr-2" />
                <h3 className="text-2xl font-bold text-gray-900">Plan Pro</h3>
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                9,99€<span className="text-lg text-gray-600">/mois</span>
              </div>
              <p className="text-gray-600">Pour les passionnés de cuisine</p>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                { icon: Calendar, text: 'Séjours illimités', highlight: true },
                { icon: FileText, text: 'Recettes illimitées', highlight: true },
                { icon: Download, text: 'Export PDF des listes de courses', highlight: true },
                { icon: Calendar, text: 'Planification avancée des repas' },
                { icon: Smartphone, text: 'Synchronisation multi-appareils' },
                { icon: HeadphonesIcon, text: 'Support prioritaire 24/7' },
                { icon: Shield, text: 'Sauvegardes automatiques' },
                { icon: Crown, text: 'Accès anticipé aux nouveautés' }
              ].map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <div className="flex items-center">
                    <feature.icon className="h-4 w-4 text-green-600 mr-2" />
                    <span className={`text-gray-700 ${feature.highlight ? 'font-semibold' : ''}`}>
                      {feature.text}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <form action="/api/create-checkout-session" method="POST">
              <input type="hidden" name="priceId" value={process.env.NEXT_PUBLIC_STRIPE_PRICE_ID} />
              <input type="hidden" name="userId" value={user.id} />
              <input type="hidden" name="userEmail" value={user.emailAddresses[0]?.emailAddress} />
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" size="lg">
                Commencer mon essai Pro
              </Button>
            </form>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mt-16 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Comparaison détaillée</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fonctionnalités
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gratuit
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[
                  { feature: 'Nombre de séjours', free: '1', pro: 'Illimité' },
                  { feature: 'Recettes du catalogue', free: '5', pro: 'Toutes' },
                  { feature: 'Recettes personnelles', free: '5', pro: 'Illimitées' },
                  { feature: 'Gestion ingrédients/ustensiles', free: '✓', pro: '✓' },
                  { feature: 'Listes de courses', free: '✓', pro: '✓' },
                  { feature: 'Export PDF', free: '✗', pro: '✓' },
                  { feature: 'Planification avancée', free: '✗', pro: '✓' },
                  { feature: 'Synchronisation multi-appareils', free: '✗', pro: '✓' },
                  { feature: 'Support prioritaire', free: '✗', pro: '✓' },
                  { feature: 'Sauvegardes automatiques', free: '✗', pro: '✓' }
                ].map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.feature}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                      {row.free}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={row.pro === '✓' ? 'text-green-600 font-semibold' : 'text-gray-900 font-semibold'}>
                        {row.pro}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Questions fréquentes
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-semibold text-gray-900 mb-2">
                Puis-je annuler à tout moment ?
              </h3>
              <p className="text-gray-600">
                Oui, vous pouvez annuler votre abonnement à tout moment. Votre accès restera actif jusqu&apos;à la fin de votre période de facturation.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-semibold text-gray-900 mb-2">
                Y a-t-il une période d&apos;essai ?
              </h3>
              <p className="text-gray-600">
                Le plan gratuit vous permet de tester les fonctionnalités de base. Vous pouvez passer au plan Pro à tout moment pour débloquer toutes les fonctionnalités.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-semibold text-gray-900 mb-2">
                Comment fonctionne la facturation ?
              </h3>
              <p className="text-gray-600">
                La facturation est mensuelle et automatique à 9,99€/mois. Vous recevrez une facture par email à chaque renouvellement.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-semibold text-gray-900 mb-2">
                Que se passe-t-il si je dépasse les limites gratuites ?
              </h3>
              <p className="text-gray-600">
                Vous serez invité à passer au plan Pro pour continuer à créer des séjours et recettes. Vos données existantes restent accessibles.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-semibold text-gray-900 mb-2">
                Mes données sont-elles sécurisées ?
              </h3>
              <p className="text-gray-600">
                Absolument. Toutes vos données sont chiffrées et sauvegardées automatiquement. Les utilisateurs Pro bénéficient de sauvegardes renforcées.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-semibold text-gray-900 mb-2">
                Puis-je utiliser TidiMondo sur plusieurs appareils ?
              </h3>
              <p className="text-gray-600">
                Oui ! Avec le plan Pro, vos données se synchronisent automatiquement entre tous vos appareils (smartphone, tablette, ordinateur).
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">
            Prêt à planifier vos séjours culinaires ?
          </h3>
          <p className="text-green-100 mb-6 max-w-2xl mx-auto">
            Rejoignez les passionnés de cuisine qui utilisent TidiMondo pour organiser leurs séjours et créer des souvenirs culinaires inoubliables.
          </p>
          <form action="/api/create-checkout-session" method="POST" className="inline-block">
            <input type="hidden" name="priceId" value={process.env.NEXT_PUBLIC_STRIPE_PRICE_ID} />
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="userEmail" value={user.emailAddresses[0]?.emailAddress} />
            <Button type="submit" size="lg" className="bg-white text-green-600 hover:bg-gray-100">
              <Crown className="h-5 w-5 mr-2" />
              Commencer avec Pro - 9,99€/mois
            </Button>
          </form>
        </div>

      </main>
    </div>
  )
}