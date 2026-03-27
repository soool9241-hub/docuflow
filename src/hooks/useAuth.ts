import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from '@/components/providers/AuthProvider'

/**
 * Hook that provides the current authentication state and helpers.
 *
 * Must be used inside an `<AuthProvider>`.
 *
 * @returns `{ user, session, loading, signOut, supabase }`
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an <AuthProvider>')
  }

  return context
}
