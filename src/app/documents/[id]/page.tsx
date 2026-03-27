'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  DocumentType,
  DOCUMENT_TYPE_LABELS,
  Document,
} from '@/types'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import DocumentPreview from '@/components/documents/DocumentPreview'
import { generateDocumentHTML } from '@/templates/document-html'

const STATUS_LABELS: Record<string, string> = {
  draft: '임시저장',
  sent: '발송완료',
  confirmed: '확인됨',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
}

export default function DocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = params.id as string

  const [document, setDocument] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showSendModal, setShowSendModal] = useState(false)
  const [sendMethod, setSendMethod] = useState<'sms' | 'email'>('email')
  const [sendTo, setSendTo] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const fetchDocument = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*, contacts(*)')
          .eq('id', id)
          .single()

        if (error) throw error
        setDocument(data)

        // Pre-fill send info
        if (data.contacts) {
          if (data.contacts.email) setSendTo(data.contacts.email)
        }
      } catch (err) {
        console.error('서류 조회 실패:', err)
        alert('서류를 찾을 수 없습니다.')
        router.push('/documents')
      } finally {
        setLoading(false)
      }
    }
    fetchDocument()
  }, [id, router])

  // Open send modal if action=send in URL
  useEffect(() => {
    if (searchParams.get('action') === 'send' && document) {
      setShowSendModal(true)
    }
  }, [searchParams, document])

  const handlePDFDownload = () => {
    if (!document) return
    const html = generateDocumentHTML(document as Document, document.type as DocumentType)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = `${document.document_number || 'document'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSend = async () => {
    if (!sendTo.trim()) {
      alert(sendMethod === 'email' ? '이메일 주소를 입력하세요.' : '전화번호를 입력하세요.')
      return
    }
    setSending(true)

    try {
      // Update document status
      await supabase
        .from('documents')
        .update({
          status: 'sent',
          sent_via: sendMethod,
          sent_at: new Date().toISOString(),
        })
        .eq('id', id)

      alert(
        sendMethod === 'email'
          ? `${sendTo}로 이메일이 발송되었습니다.`
          : `${sendTo}로 문자가 발송되었습니다.`
      )

      setShowSendModal(false)
      // Refresh document
      const { data } = await supabase
        .from('documents')
        .select('*, contacts(*)')
        .eq('id', id)
        .single()
      if (data) setDocument(data)
    } catch (err) {
      console.error('발송 실패:', err)
      alert('발송에 실패했습니다.')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-3 text-gray-500">서류를 불러오는 중...</span>
      </div>
    )
  }

  if (!document) return null

  const docType = document.type as DocumentType
  const contact = document.contacts || document.receiver_info || {}

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/documents')}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{document.title || '(제목 없음)'}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-500 font-mono">
                {document.document_number}
              </span>
              <span className="text-sm text-gray-400">|</span>
              <span className="text-sm text-gray-500">
                {DOCUMENT_TYPE_LABELS[docType] || docType}
              </span>
              <span
                className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                  STATUS_COLORS[document.status] || 'bg-gray-100 text-gray-600'
                }`}
              >
                {STATUS_LABELS[document.status] || document.status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/documents/new`)}>
            수정
          </Button>
          <Button variant="outline" size="sm" onClick={handlePDFDownload}>
            PDF 다운로드
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSendMethod('sms')
              setShowSendModal(true)
            }}
          >
            문자 발송
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setSendMethod('email')
              setShowSendModal(true)
            }}
          >
            이메일 발송
          </Button>
        </div>
      </div>

      {/* Document Info Summary */}
      <Card padding="md">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">거래처</span>
            <p className="font-medium mt-0.5">
              {contact.company_name || '-'}
            </p>
          </div>
          <div>
            <span className="text-gray-500">합계 금액</span>
            <p className="font-bold text-lg text-blue-900 mt-0.5">
              {((document.total_amount || 0) + (document.tax_amount || 0)).toLocaleString()}원
            </p>
          </div>
          <div>
            <span className="text-gray-500">작성일</span>
            <p className="font-medium mt-0.5">
              {new Date(document.created_at).toLocaleDateString('ko-KR')}
            </p>
          </div>
          <div>
            <span className="text-gray-500">발송</span>
            <p className="font-medium mt-0.5">
              {document.sent_at
                ? `${document.sent_via === 'email' ? '이메일' : '문자'} (${new Date(
                    document.sent_at
                  ).toLocaleDateString('ko-KR')})`
                : '미발송'}
            </p>
          </div>
        </div>
      </Card>

      {/* Document Preview */}
      <DocumentPreview
        document={{
          ...document,
          receiver_info: document.receiver_info || contact,
        }}
        type={docType}
      />

      {/* Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card padding="lg" className="w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {sendMethod === 'email' ? '이메일 발송' : '문자 발송'}
            </h2>

            <div className="space-y-4">
              {/* Send method toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSendMethod('email')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sendMethod === 'email'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  이메일
                </button>
                <button
                  onClick={() => setSendMethod('sms')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sendMethod === 'sms'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  문자 (SMS)
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {sendMethod === 'email' ? '수신 이메일 주소' : '수신 전화번호'}
                </label>
                <input
                  type={sendMethod === 'email' ? 'email' : 'tel'}
                  value={sendTo}
                  onChange={(e) => setSendTo(e.target.value)}
                  placeholder={
                    sendMethod === 'email'
                      ? 'example@company.com'
                      : '010-1234-5678'
                  }
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                <p className="font-medium text-gray-700 mb-1">발송 내용:</p>
                <p>
                  {DOCUMENT_TYPE_LABELS[docType]} - {document.title}
                </p>
                <p>합계: {((document.total_amount || 0) + (document.tax_amount || 0)).toLocaleString()}원</p>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSendModal(false)}
                  disabled={sending}
                >
                  취소
                </Button>
                <Button onClick={handleSend} disabled={sending}>
                  {sending ? '발송 중...' : '발송하기'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
