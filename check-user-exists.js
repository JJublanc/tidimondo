// Script pour vérifier si l'utilisateur existe dans Supabase
const { createClient } = require('@supabase/supabase-js')

// Remplacez par vos valeurs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const clerkUserId = 'user_30XBCRUE4XxpnDhB38XNCUrY5vb' // Remplacez par l'ID Clerk de l'utilisateur

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Veuillez définir NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUserExists() {
  console.log(`🔍 Vérification de l'utilisateur Clerk ID: ${clerkUserId}`)

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single() // Utilisez single() pour obtenir un seul résultat

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ Utilisateur NOT FOUND dans Supabase (table vide)')
      } else {
        console.error('❌ Erreur lors de la recherche de l\'utilisateur:', error)
      }
    } else {
      console.log('✅ Utilisateur trouvé:', data)
    }
  } catch (err) {
    console.error('❌ Erreur inattendue:', err)
  }
}

checkUserExists()