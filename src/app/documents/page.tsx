'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  DocumentType,
  DocumentStatus,
  DOCUMENT_TYPE_LABELS,
  Document,
} from '@/types'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: '임시저장',
  sent: '발송완료',
  confirmed: '확인됨',
}

const STATUS_COLORS: Record<DocumentStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
}

const TYPE_COLORS: Record<DocumentType, string> = {
  quotation: 'bg-indigo-100 text-indigo-700',
  transaction_statement: 'bg-emerald-100 text-emerald-700',
  tax_invoice: 'bg-orange-100 text-orange-700',
  receipt: 'bg-pink-100 text-pink-700',
  contract: 'bg-purple-100 text-purple-700',
  consent: 'bg-cyan-100 text-cyan-700',
  purchase_order: 'bg-amber-100 text-amber-700',
  delivery_note: 'bg-teal-100 text-teal-700',
}

const PAGE_SIZE = 20

export default function DocumentsPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('documents')
        .select('*, contacts(*)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter)
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }
      if (search) {
        query = query.or(`title.ilike.%${search}%,document_number.ilike.%${search}%`)
      }

      const { data, count, error } = await query

      if (error) throw error

      setDocuments(data || [])
      setTotalCount(count || 0)
    } catch (err) {
      console.error('서류 목록 조회 실패:', err)
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter, statusFilter, search])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 서류를 삭제하시겠습니까?')) return
    try {
      const { error } = await supabase.from('documents').delete().eq('id', id)
      if (error) throw error
      fetchDocuments()
    } catch (err) {
      console.error('삭제 실패:', err)
      alert('서류 삭제에 실패했습니다.')
    }
  }

  const handleSend = async (id: string) => {
    router.push(`/documents/${id}?action=send`)
  }

  const documentTypes = Object.entries(DOCUMENT_TYPE_LABELS) as [DocumentType, string][]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">서류 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            총 {totalCount}건의 서류
          </p>
        </div>
        <Button onClick={() => router.push('/documents/new')} className="w-full sm:w-auto">
          + 새 서류 작성
        </Button>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="space-y-4">
          {/* Type filter tabs */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">서류 종류</label>
            <div className="flex flex-nowrap gap-2 overflow-x-auto -mx-3 px-3 pb-2">
              <button
                onClick={() => { setTypeFilter('all'); setPage(1) }}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap flex-shrink-0 ${
                  typeFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                전체
              </button>
              {documentTypes.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { setTypeFilter(key); setPage(1) }}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap flex-shrink-0 ${
                    typeFilter === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Status filter + Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">상태</label>
              <div className="flex gap-2">
                <button
                  onClick={() => { setStatusFilter('all'); setPage(1) }}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  전체
                </button>
                {(Object.entries(STATUS_LABELS) as [DocumentStatus, string][]).map(
                  ([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { setStatusFilter(key); setPage(1) }}
                      className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                        statusFilter === key
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="hidden sm:block flex-1" />

            <div className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="제목 또는 서류번호 검색"
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
              />
              <Button variant="secondary" size="md" onClick={handleSearch}>
                검색
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Documents Table */}
      <Card padding="none">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span className="ml-3 text-gray-500">불러오는 중...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-20">
            <svg
              className="mx-auto h-12 w-12 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-3 text-sm font-medium text-gray-900">서류가 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">
              새 서류를 작성하여 시작하세요.
            </p>
            <div className="mt-4">
              <Button size="sm" onClick={() => router.push('/documents/new')}>
                + 새 서류 작성
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="md:hidden divide-y divide-gray-100">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                        TYPE_COLORS[doc.type as DocumentType] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {DOCUMENT_TYPE_LABELS[doc.type as DocumentType] || doc.type}
                    </span>
                    <span className="font-medium text-gray-900 text-sm truncate">
                      {doc.title || '(제목 없음)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="font-mono">{doc.document_number || '-'}</span>
                    <span>{new Date(doc.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      {((doc.total_amount || 0) + (doc.tax_amount || 0)).toLocaleString()}원
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                        STATUS_COLORS[doc.status as DocumentStatus] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {STATUS_LABELS[doc.status as DocumentStatus] || doc.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => router.push(`/documents/${doc.id}`)}
                      className="flex-1 px-3 py-2 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-center"
                    >
                      보기
                    </button>
                    <button
                      onClick={() => handleSend(doc.id)}
                      className="flex-1 px-3 py-2 text-xs text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-center"
                    >
                      발송
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="flex-1 px-3 py-2 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-center"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-600">서류번호</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">종류</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">제목</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">거래처</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">금액</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">상태</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">작성일</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {doc.document_number || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                            TYPE_COLORS[doc.type as DocumentType] || 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {DOCUMENT_TYPE_LABELS[doc.type as DocumentType] || doc.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                        {doc.title || '(제목 없음)'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {doc.contacts?.company_name || doc.receiver_info?.company_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {((doc.total_amount || 0) + (doc.tax_amount || 0)).toLocaleString()}원
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                            STATUS_COLORS[doc.status as DocumentStatus] || 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {STATUS_LABELS[doc.status as DocumentStatus] || doc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(doc.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => router.push(`/documents/${doc.id}`)}
                            className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            보기
                          </button>
                          <button
                            onClick={() => handleSend(doc.id)}
                            className="px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded transition-colors"
                          >
                            발송
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-xs sm:text-sm text-gray-500">
              {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, totalCount)}건 / 총{' '}
              {totalCount}건
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                이전
              </button>
              <span className="sm:hidden px-2 py-1.5 text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <div className="hidden sm:flex gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1.5 text-sm rounded transition-colors ${
                        page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
