import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Check, Star, Users, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-bold text-gray-900">TidiMondo</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
              Fonctionnalités
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
              Tarifs
            </Link>
            <Link href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">
              À propos
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Link href="/sign-in">
              <Button variant="ghost">Se connecter</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Commencer</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Transformez vos idées en 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> SaaS</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Une plateforme moderne et flexible pour développer, déployer et monétiser vos applications SaaS rapidement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="text-lg px-8 py-6">
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Voir la démo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Une suite complète d&apos;outils pour créer et gérer votre SaaS
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Déploiement rapide</h3>
              <p className="text-gray-600">
                Lancez votre SaaS en quelques minutes avec notre infrastructure prête à l&apos;emploi.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Gestion utilisateurs</h3>
              <p className="text-gray-600">
                Authentification sécurisée et gestion complète des utilisateurs intégrée.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Paiements intégrés</h3>
              <p className="text-gray-600">
                Monétisez votre SaaS avec Stripe intégré et gestion des abonnements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tarification simple
            </h2>
            <p className="text-xl text-gray-600">
              Un seul plan, toutes les fonctionnalités
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-blue-200">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan Pro</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  29€<span className="text-lg text-gray-600">/mois</span>
                </div>
                <p className="text-gray-600">Tout inclus pour votre SaaS</p>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  'Utilisateurs illimités',
                  'Authentification sécurisée',
                  'Paiements Stripe',
                  'Support prioritaire',
                  'API complète',
                  'Analytics avancées'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href="/sign-up" className="block">
                <Button className="w-full" size="lg">
                  Commencer maintenant
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-xl font-bold">TidiMondo</span>
            </div>
            
            <div className="flex space-x-6 text-gray-400">
              <Link href="#" className="hover:text-white transition-colors">
                Conditions
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Confidentialité
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 TidiMondo. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}