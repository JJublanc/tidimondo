'use client'

import { supabase } from './supabase-client'

let isAuthInitialized = false

export async function initSupabaseAuth(clerkToken: string) {
  if (isAuthInitialized) return
  
  try {
    console.log('🔑 Initialisation auth Supabase avec token Clerk')
    
    const { error } = await supabase.auth.setSession({
      access_token: clerkToken,
      refresh_token: ''
    })
    
    if (error) {
      console.error('❌ Erreur auth Supabase:', error)
      throw error
    }
    
    isAuthInitialized = true
    console.log('✅ Auth Supabase initialisée')
  } catch (err) {
    console.error('❌ Erreur initialisation auth:', err)
    throw err
  }
}

export function resetSupabaseAuth() {
  isAuthInitialized = false
  supabase.auth.signOut()
  console.log('🚪 Auth Supabase reset')
}