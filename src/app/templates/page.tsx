'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DocumentTemplate, DOCUMENT_TYPE_LABELS, DocumentType } from '@/types'

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates((data || []) as DocumentTemplate[])
    } catch (err) {
      console.error('템플릿 목록 조회 실패:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 템플릿을 삭제하시겠습니까?`)) return

    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('삭제 실패')
      setTemplates((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      console.error('템플릿 삭제 실패:', err)
      alert('템플릿 삭제에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-3 text-gray-500">템플릿을 불러오는 중...</span>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">템플릿 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            자주 사용하는 서류를 템플릿으로 저장하고 빠르게 새 서류를 만들 수 있습니다.
          </p>
        </div>
      </div>

      {/* Template Grid */}
      {templates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            저장된 템플릿이 없습니다
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            서류 상세 페이지에서 &quot;템플릿으로 저장&quot; 버튼을 눌러 템플릿을 만들어 보세요.
          </p>
          <button
            onClick={() => router.push('/documents')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            서류 목록으로 이동
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {template.name}
                  </h3>
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                    {DOCUMENT_TYPE_LABELS[template.type as DocumentType] || template.type}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(template.id, template.name)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  title="템플릿 삭제"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {template.notes && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                  {template.notes}
                </p>
              )}

              <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {template.created_at
                    ? new Date(template.created_at).toLocaleDateString('ko-KR')
                    : ''}
                </span>
                <button
                  onClick={() => router.push(`/documents/new?template=${template.id}`)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  새 서류 만들기
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
