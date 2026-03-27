'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format, formatDistanceToNow, subMonths, startOfMonth } from 'date-fns'
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
  Clock,
  DollarSign,
  FileWarning,
  Building2,
  Activity,
  ChevronRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Document } from '@/types'
import { DOCUMENT_TYPE_LABELS } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface DashboardStats {
  totalDocuments: number
  monthlyDocuments: number
  sentDocuments: number
  totalContacts: number
  draftDocuments: number
  monthlySentDocuments: number
  totalAmount: number
}

interface MonthlyData {
  month: string
  label: string
  draft: number
  sent: number
  confirmed: number
  total: number
}

interface ContactStat {
  company_name: string
  count: number
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
  draft: '초안',
  sent: '발송완료',
  confirmed: '완료',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
}

function formatCurrency(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return '방금'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay === 1) return '어제'
  if (diffDay < 7) return `${diffDay}일 전`
  return format(date, 'MM.dd', { locale: ko })
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    monthlyDocuments: 0,
    sentDocuments: 0,
    totalContacts: 0,
    draftDocuments: 0,
    monthlySentDocuments: 0,
    totalAmount: 0,
  })
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [pipelineCounts, setPipelineCounts] = useState({ draft: 0, sent: 0, confirmed: 0 })
  const [topContacts, setTopContacts] = useState<ContactStat[]>([])
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
      const sixMonthsAgo = startOfMonth(subMonths(now, 5)).toISOString()

      // Fetch company profile
      const companyPromise = supabase
        .from('company_profiles')
        .select('company_name')
        .single()

      const [
        { count: totalDocuments },
        { count: monthlyDocuments },
        { count: sentDocuments },
        { count: totalContacts },
        { count: draftDocuments },
        { count: monthlySentDocuments },
        { data: documents, error: docError },
        { data: allDocs },
        { data: companyData },
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
          .select('*', { count: 'exact', head: true })
          .eq('status', 'draft'),
        supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'sent')
          .gte('created_at', firstDayOfMonth),
        supabase
          .from('documents')
          .select('*, contact:contacts(company_name)')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('documents')
          .select('created_at, status, total_amount, contact:contacts(company_name)')
          .gte('created_at', sixMonthsAgo)
          .order('created_at', { ascending: true }),
        companyPromise,
      ])

      if (docError) throw docError

      // Set company name
      if (companyData?.company_name) {
        setCompanyName(companyData.company_name)
      }

      // Calculate total amount from all documents
      let totalAmount = 0
      if (allDocs) {
        totalAmount = allDocs.reduce((sum: number, doc: any) => sum + (doc.total_amount || 0), 0)
      }

      // Build monthly data for bar chart (last 6 months)
      const monthlyMap = new Map<string, MonthlyData>()
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i)
        const key = format(d, 'yyyy-MM')
        const label = format(d, 'M월', { locale: ko })
        monthlyMap.set(key, { month: key, label, draft: 0, sent: 0, confirmed: 0, total: 0 })
      }
      if (allDocs) {
        for (const doc of allDocs) {
          const key = (doc.created_at as string).slice(0, 7)
          const entry = monthlyMap.get(key)
          if (entry) {
            entry.total++
            if (doc.status === 'draft') entry.draft++
            else if (doc.status === 'sent') entry.sent++
            else if (doc.status === 'confirmed') entry.confirmed++
          }
        }
      }
      setMonthlyData(Array.from(monthlyMap.values()))

      // Pipeline counts
      let pDraft = 0, pSent = 0, pConfirmed = 0
      if (allDocs) {
        for (const doc of allDocs) {
          if (doc.status === 'draft') pDraft++
          else if (doc.status === 'sent') pSent++
          else if (doc.status === 'confirmed') pConfirmed++
        }
      }
      // Also add counts from documents outside the 6-month window
      setPipelineCounts({
        draft: draftDocuments ?? 0,
        sent: sentDocuments ?? 0,
        confirmed: (totalDocuments ?? 0) - (draftDocuments ?? 0) - (sentDocuments ?? 0),
      })

      // Top contacts by document count
      const contactMap = new Map<string, number>()
      if (allDocs) {
        for (const doc of allDocs) {
          const name = (doc.contact as any)?.company_name
          if (name) {
            contactMap.set(name, (contactMap.get(name) || 0) + 1)
          }
        }
      }
      const sortedContacts = Array.from(contactMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([company_name, count]) => ({ company_name, count }))
      setTopContacts(sortedContacts)

      setStats({
        totalDocuments: totalDocuments ?? 0,
        monthlyDocuments: monthlyDocuments ?? 0,
        sentDocuments: sentDocuments ?? 0,
        totalContacts: totalContacts ?? 0,
        draftDocuments: draftDocuments ?? 0,
        monthlySentDocuments: monthlySentDocuments ?? 0,
        totalAmount,
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

  const maxMonthly = Math.max(...monthlyData.map((m) => m.total), 1)
  const maxContactCount = topContacts.length > 0 ? topContacts[0].count : 1

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
      label: '이번 달 발송',
      value: stats.monthlySentDocuments,
      icon: Send,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: '미발송 서류',
      value: stats.draftDocuments,
      icon: FileWarning,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: '거래처 수',
      value: stats.totalContacts,
      icon: Users,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: '총 거래 금액',
      value: formatCurrency(stats.totalAmount),
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      isText: true,
    },
  ]

  const pipelineStages = [
    {
      key: 'draft',
      label: '초안',
      count: pipelineCounts.draft,
      color: 'bg-gray-500',
      ring: 'ring-gray-200',
      bg: 'bg-gray-50',
      textColor: 'text-gray-700',
    },
    {
      key: 'sent',
      label: '발송완료',
      count: pipelineCounts.sent,
      color: 'bg-blue-500',
      ring: 'ring-blue-200',
      bg: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      key: 'confirmed',
      label: '완료',
      count: pipelineCounts.confirmed,
      color: 'bg-green-500',
      ring: 'ring-green-200',
      bg: 'bg-green-50',
      textColor: 'text-green-700',
    },
  ]

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {companyName ? `안녕하세요, ${companyName}님!` : '대시보드'}
        </h1>
        <p className="text-gray-500 mt-1">서류 및 거래처 현황을 한눈에 확인하세요.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl ${stat.bg}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">{stat.label}</p>
                <p
                  className={`font-bold text-gray-900 ${
                    (stat as any).isText ? 'text-sm lg:text-base' : 'text-xl lg:text-2xl'
                  }`}
                >
                  {(stat as any).isText ? stat.value : stat.value}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pipeline View */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-5">
          <Activity className="w-5 h-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900">서류 상태 파이프라인</h2>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-0">
          {pipelineStages.map((stage, idx) => (
            <div key={stage.key} className="flex items-center w-full sm:w-auto sm:flex-1">
              <div className={`flex-1 flex items-center gap-4 rounded-2xl ${stage.bg} px-5 py-4 sm:py-5`}>
                <div
                  className={`w-12 h-12 rounded-full ${stage.color} flex items-center justify-center ring-4 ${stage.ring} shrink-0`}
                >
                  <span className="text-white font-bold text-lg">{stage.count}</span>
                </div>
                <div>
                  <p className={`font-semibold ${stage.textColor}`}>{stage.label}</p>
                  <p className="text-xs text-gray-500">
                    {stats.totalDocuments > 0
                      ? `${Math.round((stage.count / stats.totalDocuments) * 100)}%`
                      : '0%'}
                  </p>
                </div>
              </div>
              {idx < pipelineStages.length - 1 && (
                <div className="hidden sm:flex items-center px-2">
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              )}
              {idx < pipelineStages.length - 1 && (
                <div className="flex sm:hidden items-center py-1">
                  <ChevronRight className="w-5 h-5 text-gray-300 rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">월별 서류 통계</h2>
          </div>
          <div className="flex items-end gap-2 sm:gap-3 h-48">
            {monthlyData.map((m) => {
              const height = m.total > 0 ? (m.total / maxMonthly) * 100 : 0
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-gray-600">{m.total}</span>
                  <div className="w-full flex flex-col justify-end" style={{ height: '160px' }}>
                    {m.total > 0 ? (
                      <div
                        className="w-full rounded-t-lg flex flex-col justify-end overflow-hidden transition-all duration-500"
                        style={{ height: `${Math.max(height, 8)}%` }}
                      >
                        {m.confirmed > 0 && (
                          <div
                            className="w-full bg-green-400"
                            style={{ height: `${(m.confirmed / m.total) * 100}%` }}
                          />
                        )}
                        {m.sent > 0 && (
                          <div
                            className="w-full bg-blue-400"
                            style={{ height: `${(m.sent / m.total) * 100}%` }}
                          />
                        )}
                        {m.draft > 0 && (
                          <div
                            className="w-full bg-gray-300"
                            style={{ height: `${(m.draft / m.total) * 100}%` }}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-full bg-gray-100 rounded-t-lg" style={{ height: '4px' }} />
                    )}
                  </div>
                  <span className="text-xs text-gray-500 mt-1">{m.label}</span>
                </div>
              )
            })}
          </div>
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-gray-300" />
              <span className="text-xs text-gray-500">초안</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-blue-400" />
              <span className="text-xs text-gray-500">발송완료</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-green-400" />
              <span className="text-xs text-gray-500">완료</span>
            </div>
          </div>
        </div>

        {/* Top Contacts */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">거래처별 거래 현황</h2>
          </div>
          {topContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Users className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">거래 데이터가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topContacts.map((contact, idx) => (
                <div key={contact.company_name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-400 w-4">{idx + 1}</span>
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {contact.company_name}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">{contact.count}건</span>
                  </div>
                  <div className="ml-6 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${(contact.count / maxContactCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Timeline */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-900">최근 활동</h2>
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
                {recentDocuments.map((doc, idx) => (
                  <Link
                    key={doc.id}
                    href={`/documents/${doc.id}`}
                    className="flex items-start gap-3 px-4 sm:px-6 py-3.5 hover:bg-gray-50 transition-colors group"
                  >
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center pt-1.5 shrink-0">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          doc.status === 'confirmed'
                            ? 'bg-green-500'
                            : doc.status === 'sent'
                            ? 'bg-blue-500'
                            : 'bg-gray-300'
                        }`}
                      />
                      {idx < recentDocuments.length - 1 && (
                        <div className="w-px h-full bg-gray-200 mt-1" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0 ${
                              TYPE_COLORS[doc.type] || 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {DOCUMENT_TYPE_LABELS[doc.type] || doc.type}
                          </span>
                          <span className="text-sm text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {doc.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 pl-0 sm:pl-4">
                          <span className="text-xs sm:text-sm font-medium text-gray-700">
                            {formatCurrency(doc.total_amount)}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              STATUS_COLORS[doc.status] || 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {STATUS_LABELS[doc.status] || doc.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatRelativeTime(doc.created_at)}
                        {(doc as any).contact?.company_name &&
                          ` · ${(doc as any).contact.company_name}`}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
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
          </div>
        </div>
      </div>
    </div>
  )
}
