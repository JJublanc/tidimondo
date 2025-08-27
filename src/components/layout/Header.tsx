'use client'

import Link from 'next/link'
import { UserButton, useUser } from '@clerk/nextjs'
import { ArrowLeft, MessageCircle } from 'lucide-react'

interface HeaderProps {
  title: string
  backLink?: string
  backText?: string
  showUser?: boolean
}

export function Header({ title, backLink, backText = "Retour", showUser = true }: HeaderProps) {
  const { user } = useUser()

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            {backLink && (
              <Link href={backLink} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5" />
                <span>{backText}</span>
              </Link>
            )}
            <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          </div>
          
          {showUser && user && (
            <div className="flex items-center space-x-6">
              {/* Navigation pour utilisateurs connectés */}
              <nav className="flex items-center space-x-4">
                <Link
                  href="/contact"
                  className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors duration-200"
                  title="Contactez-nous"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Contact</span>
                </Link>
              </nav>
              
              <div className="flex items-center space-x-4 border-l border-gray-200 pl-6">
                <span className="text-sm text-gray-600">
                  {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                </span>
                <UserButton />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}