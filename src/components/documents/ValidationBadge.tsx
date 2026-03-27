'use client'

import { useState } from 'react'

interface ValidationResult {
  valid: boolean
  score: number
  issues: string[]
  suggestions: string[]
}

interface ValidationBadgeProps {
  documentId: string
  document: any
  onValidate?: (result: ValidationResult) => void
}

export default function ValidationBadge({ documentId, document, onValidate }: ValidationBadgeProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const handleValidate = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: {
            type: document.type,
            title: document.title,
            items: document.items,
            total_amount: document.total_amount,
            tax_amount: document.tax_amount,
            notes: document.notes,
            contact: document.contacts || document.receiver_info || document.contact,
            receiver_info: document.receiver_info,
            issuer_info: document.issuer_info,
          },
        }),
      })

      if (!res.ok) {
        throw new Error('검증 요청에 실패했습니다.')
      }

      const data: ValidationResult = await res.json()
      setResult(data)
      setExpanded(true)
      onValidate?.(data)
    } catch (err: any) {
      setError(err.message || '검증 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700 border-green-200'
    if (score >= 50) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    return 'bg-red-100 text-red-700 border-red-200'
  }

  const getScoreBgBar = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      {/* Header / Button area */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* AI icon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-900">AI 문서 검토</span>
          {result && (
            <span className={`ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${getScoreColor(result.score)}`}>
              {result.score}점
            </span>
          )}
        </div>

        {/* Validate button or status */}
        {!result && !loading && (
          <button
            onClick={handleValidate}
            className="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            AI 검토
          </button>
        )}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent" />
            <span>검토 중...</span>
          </div>
        )}
        {result && !loading && (
          <div className="flex items-center gap-2">
            {result.valid ? (
              <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                검토 완료
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                수정 필요
              </span>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={handleValidate}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="다시 검토"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 pb-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Expanded details */}
      {result && expanded && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
          {/* Score bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>검증 점수</span>
              <span className="font-medium">{result.score}/100</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getScoreBgBar(result.score)}`}
                style={{ width: `${result.score}%` }}
              />
            </div>
          </div>

          {/* Issues */}
          {result.issues.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-red-600 mb-1.5 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                오류 ({result.issues.length}건)
              </h4>
              <ul className="space-y-1">
                {result.issues.map((issue, i) => (
                  <li key={i} className="text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2">
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-yellow-700 mb-1.5 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                제안 ({result.suggestions.length}건)
              </h4>
              <ul className="space-y-1">
                {result.suggestions.map((suggestion, i) => (
                  <li key={i} className="text-xs text-yellow-800 bg-yellow-50 rounded-lg px-3 py-2">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* All clear */}
          {result.issues.length === 0 && result.suggestions.length === 0 && (
            <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">
              검토 결과 문제가 발견되지 않았습니다.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
