import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client pour les opérations côté serveur avec service role
// ⚠️ ATTENTION: Ce client ne doit être utilisé que côté serveur (API routes, Server Components)
// Il ne doit JAMAIS être importé dans des composants clients ou des hooks
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)