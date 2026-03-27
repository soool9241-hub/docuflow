'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  FileText,
  Send,
  Users,
  Plus,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Calendar,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Document } from '@/types'
import { DOCUMENT_TYPE_LABELS } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface DashboardStats {
  totalDocuments: number
  monthlyDocuments: number
  sentDocuments: number
  totalContacts: number
}

const TYPE_COLORS: Record<string, string> = {
  quotation: 'bg-blue-100 text-blue-700',
  transaction_statement: 'bg-indigo-100 text-indigo-700',
  tax_invoice: 'bg-purple-100 text-purple-700',
  receipt: 'bg-green-100 text-green-700',
  contract: 'bg-teal-100 text-teal-700',
  consent: 'bg-cyan-100 text-cyan-700',
  purchase_order: 'bg-amber-100 text-amber-700',
  delivery_note: 'bg-orange-100 text-orange-700',
}

const STATUS_LABELS: Record<string, string> = {
  draft: '작성 중',
  sent: '발송 완료',
  confirmed: '확인됨',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
}

function formatCurrency(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    monthlyDocuments: 0,
    sentDocuments: 0,
    totalContacts: 0,
  })
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      setError(null)

      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const [
        { count: totalDocuments },
        { count: monthlyDocuments },
        { count: sentDocuments },
        { count: totalContacts },
        { data: documents, error: docError },
      ] = await Promise.all([
        supabase.from('documents').select('*', { count: 'exact', head: true }),
        supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', firstDayOfMonth),
        supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'sent'),
        supabase.from('contacts').select('*', { count: 'exact', head: true }),
        supabase
          .from('documents')
          .select('*, contact:contacts(company_name)')
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      if (docError) throw docError

      setStats({
        totalDocuments: totalDocuments ?? 0,
        monthlyDocuments: monthlyDocuments ?? 0,
        sentDocuments: sentDocuments ?? 0,
        totalContacts: totalContacts ?? 0,
      })
      setRecentDocuments((documents as unknown as Document[]) ?? [])
    } catch (err) {
      console.error('Dashboard data fetch error:', err)
      setError('데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-gray-500">대시보드를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <p className="text-gray-700 font-medium">{error}</p>
          <Button variant="outline" onClick={fetchDashboardData}>
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      label: '총 서류 수',
      value: stats.totalDocuments,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: '이번 달 발행',
      value: stats.monthlyDocuments,
      icon: Calendar,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: '발송 완료',
      value: stats.sentDocuments,
      icon: Send,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: '거래처 수',
      value: stats.totalContacts,
      icon: Users,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-500 mt-1">서류 및 거래처 현황을 한눈에 확인하세요.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Documents */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-900">최근 서류</h2>
              </div>
              <Link
                href="/documents"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                전체 보기 <ArrowRight size={14} />
              </Link>
            </div>

            {recentDocuments.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">아직 작성된 서류가 없습니다.</p>
                <Link href="/documents">
                  <Button variant="outline" size="sm" className="mt-4">
                    <Plus size={16} />
                    첫 서류 작성하기
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentDocuments.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/documents/${doc.id}`}
                    className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0 ${
                          TYPE_COLORS[doc.type] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {DOCUMENT_TYPE_LABELS[doc.type] || doc.type}
                      </span>
                      <span className="text-sm text-gray-900 truncate">{doc.title}</span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 ml-4">
                      <span className="text-sm font-medium text-gray-700">
                        {formatCurrency(doc.total_amount)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {format(new Date(doc.created_at), 'MM.dd', { locale: ko })}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          STATUS_COLORS[doc.status] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {STATUS_LABELS[doc.status] || doc.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card padding="none">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">빠른 작업</h2>
            </div>
            <div className="p-4 space-y-2">
              <Link href="/documents/new?type=quotation" className="block">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-blue-50 transition-colors group">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">새 견적서 작성</p>
                    <p className="text-xs text-gray-500">견적서를 직접 작성합니다</p>
                  </div>
                  <ArrowRight size={16} className="ml-auto text-gray-300 group-hover:text-blue-500" />
                </button>
              </Link>

              <Link href="/chat" className="block">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-purple-50 transition-colors group">
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">AI 서류 작성</p>
                    <p className="text-xs text-gray-500">AI가 서류를 자동으로 작성합니다</p>
                  </div>
                  <ArrowRight size={16} className="ml-auto text-gray-300 group-hover:text-purple-500" />
                </button>
              </Link>

              <Link href="/contacts" className="block">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-amber-50 transition-colors group">
                  <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                    <Users className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">거래처 추가</p>
                    <p className="text-xs text-gray-500">새 거래처 정보를 등록합니다</p>
                  </div>
                  <ArrowRight size={16} className="ml-auto text-gray-300 group-hover:text-amber-500" />
                </button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
