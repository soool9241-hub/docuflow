'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { Loader2 } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
)

function translateError(msg: string): string {
  const map: Record<string, string> = {
    'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
    'Email not confirmed': '이메일 인증이 필요합니다.',
    'Invalid email or password': '이메일 또는 비밀번호가 올바르지 않습니다.',
    'Too many requests': '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    'Email rate limit exceeded': '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    'For security purposes, you can only request this once every 60 seconds': '보안을 위해 60초에 한 번만 요청할 수 있습니다.',
    'User not found': '가입되지 않은 이메일입니다.',
  }
  if (map[msg]) return map[msg]
  if (msg.toLowerCase().includes('invalid')) return '이메일 또는 비밀번호가 올바르지 않습니다.'
  if (msg.toLowerCase().includes('rate') || msg.toLowerCase().includes('limit')) return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
  if (msg.toLowerCase().includes('confirm') || msg.toLowerCase().includes('verified')) return '이메일 인증이 필요합니다.'
  return '로그인에 실패했습니다. 다시 시도해주세요.'
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error('Login error:', signInError)
        setError(translateError(signInError.message))
        setLoading(false)
        return
      }

      if (data?.session) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError('로그인에 실패했습니다. 다시 시도해주세요.')
        setLoading(false)
      }
    } catch (err) {
      console.error('Login catch:', err)
      setError('로그인 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / App Name */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">문</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">문서친구</h1>
          <p className="text-sm text-gray-500 mt-1">서류 자동화 시스템</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">로그인</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                이메일
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm
                           placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500
                           focus:border-transparent focus:bg-white transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm
                           placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500
                           focus:border-transparent focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white
                         text-sm font-semibold rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2
                         focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  로그인 중...
                </>
              ) : (
                '로그인'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              계정이 없으신가요?{' '}
              <Link
                href="/signup"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
