import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  const where =
    import.meta.env.PROD
      ? ' Add them in Vercel: Project → Settings → Environment Variables (Production + Preview), then Redeploy. Names must be exactly VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
      : ' Copy frontend/.env.example to frontend/.env and set the values.'
  throw new Error(`Missing Supabase env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.${where}`)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
