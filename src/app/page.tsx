import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { ArrowRight, Check, Calendar, FileText, ShoppingCart, Package, ChefHat, Clock, Users, BookOpen, TrendingUp } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-bold text-gray-900">TidiMondo</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
              Fonctionnalités
            </Link>
            <Link href="/blog" className="text-gray-600 hover:text-gray-900 transition-colors">
              Blog
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
              Tarifs
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <SignedOut>
              <Link href="/sign-in">
                <Button variant="ghost">Se connecter</Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-green-600 hover:bg-green-700">Commencer</Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Planifiez vos séjours culinaires
              <span className="bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent"> en toute sérénité</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              TidiMondo transforme la planification de vos séjours en une expérience simple et organisée. 
              Créez vos recettes, planifiez vos repas, générez vos listes de courses automatiquement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignedOut>
                <Link href="/sign-up">
                  <Button size="lg" className="text-lg px-8 py-6 bg-green-600 hover:bg-green-700">
                    Commencer gratuitement
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <Button size="lg" className="text-lg px-8 py-6 bg-green-600 hover:bg-green-700">
                    Accéder au Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </SignedIn>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-green-200 hover:bg-green-50">
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
              Tout pour vos séjours culinaires
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Une suite complète d&apos;outils pour planifier, organiser et profiter de vos aventures culinaires
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Planification de Séjours</h3>
              <p className="text-gray-600">
                Organisez tous vos repas par jour. Visualisez clairement votre planning culinaire pour des séjours réussis.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Gestion de Recettes</h3>
              <p className="text-gray-600">
                Créez et stockez vos recettes favorites. Accédez à un catalogue complet avec ingrédients et ustensiles liés.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-8 w-8 text-sky-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Listes de Courses</h3>
              <p className="text-gray-600">
                Génération automatique à partir de vos menus. Export PDF pour impression et optimisation par catégories.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Inventaire Complet</h3>
              <p className="text-gray-600">
                Gérez vos ingrédients et ustensiles. Base de données complète et recherchable pour une organisation parfaite.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Découvrez notre blog
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Conseils d'experts, astuces pratiques et guides pour réussir vos séjours culinaires
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Conseils d'organisation</h3>
              <p className="text-gray-600 mb-4">
                Découvrez nos meilleures techniques pour planifier vos séjours culinaires de A à Z.
              </p>
              <Link href="/blog?category=organisation-sejours" className="text-purple-600 hover:text-purple-700 font-medium">
                Lire les articles →
              </Link>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Astuces pratiques</h3>
              <p className="text-gray-600 mb-4">
                Des tips concrets pour optimiser vos courses, votre temps et votre budget.
              </p>
              <Link href="/blog?category=astuces-pratiques" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Découvrir les astuces →
              </Link>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Témoignages</h3>
              <p className="text-gray-600 mb-4">
                Retours d'expérience et histoires inspirantes de notre communauté.
              </p>
              <Link href="/blog?category=temoignages" className="text-green-600 hover:text-green-700 font-medium">
                Lire les témoignages →
              </Link>
            </div>
          </div>

          <div className="text-center">
            <Link href="/blog">
              <Button size="lg" variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                Voir tous les articles
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-green-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Pourquoi choisir TidiMondo ?
            </h2>
            <p className="text-xl text-gray-600">
              La solution complète pour des séjours culinaires sans stress
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Gain de temps</h3>
              <p className="text-gray-600">
                Fini les heures passées à planifier. TidiMondo automatise la création de vos listes de courses et optimise votre organisation.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <ChefHat className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cuisine simplifiée</h3>
              <p className="text-gray-600">
                Concentrez-vous sur l&apos;essentiel : cuisiner et partager. Nous nous occupons de toute la logistique.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Séjours réussis</h3>
              <p className="text-gray-600">
                Des vacances, week-ends ou événements parfaitement organisés. Vos invités se souviendront de vos repas !
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
              Tarification simple et transparente
            </h2>
            <p className="text-xl text-gray-600">
              Commencez gratuitement, passez au Pro quand vous êtes prêt
            </p>
          </div>

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
                  '1 séjour maximum',
                  '5 recettes du catalogue',
                  '5 recettes personnelles',
                  'Gestion ingrédients/ustensiles',
                  'Support communautaire'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <SignedOut>
                <Link href="/sign-up" className="block">
                  <Button variant="outline" className="w-full" size="lg">
                    Commencer gratuitement
                  </Button>
                </Link>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard" className="block">
                  <Button variant="outline" className="w-full" size="lg">
                    Accéder au Dashboard
                  </Button>
                </Link>
              </SignedIn>
            </div>

            {/* Plan Pro */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-green-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                  Recommandé
                </span>
              </div>
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan Pro</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  9,99€<span className="text-lg text-gray-600">/mois</span>
                </div>
                <p className="text-gray-600">Pour les passionnés de cuisine</p>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  'Séjours illimités',
                  'Recettes illimitées',
                  'Export PDF des listes',
                  'Planification avancée',
                  'Synchronisation multi-appareils',
                  'Support prioritaire',
                  'Sauvegardes automatiques'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <SignedOut>
                <Link href="/sign-up" className="block">
                  <Button className="w-full bg-green-600 hover:bg-green-700" size="lg">
                    Commencer mon essai Pro
                  </Button>
                </Link>
              </SignedOut>
              <SignedIn>
                <Link href="/pricing" className="block">
                  <Button className="w-full bg-green-600 hover:bg-green-700" size="lg">
                    Passer au Pro
                  </Button>
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-500 rounded-lg flex items-center justify-center">
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
