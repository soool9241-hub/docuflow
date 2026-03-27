'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  DocumentType,
  DOCUMENT_TYPE_LABELS,
  Contact,
  DocumentItem,
} from '@/types'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import ItemsEditor, { createEmptyItem } from '@/components/documents/ItemsEditor'
import DocumentPreview from '@/components/documents/DocumentPreview'
import ValidationBadge from '@/components/documents/ValidationBadge'

const STEPS = ['서류 종류 선택', '거래처 선택', '항목 입력', '추가 정보', '미리보기 & 저장']

const TYPE_ICONS: Record<DocumentType, string> = {
  quotation: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  transaction_statement: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  tax_invoice: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z',
  receipt: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
  contract: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  consent: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  purchase_order: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z',
  delivery_note: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
}

const TYPE_DESCRIPTIONS: Record<DocumentType, string> = {
  quotation: '거래 전 가격과 조건을 제시하는 문서',
  transaction_statement: '거래 내역을 기록하고 확인하는 문서',
  tax_invoice: '부가가치세 신고를 위한 법적 문서',
  receipt: '대금 수령을 증명하는 문서',
  contract: '거래 계약 조건을 명시하는 문서',
  consent: '특정 사항에 대한 동의를 확인하는 문서',
  purchase_order: '상품/서비스 구매를 요청하는 문서',
  delivery_note: '상품 배송/납품을 확인하는 문서',
}

export default function NewDocumentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [templateLoaded, setTemplateLoaded] = useState(false)

  // Step 1: Document type
  const [docType, setDocType] = useState<DocumentType | null>(null)

  // Step 2: Contact
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContactId, setSelectedContactId] = useState<string | ''>('')
  const [useManualContact, setUseManualContact] = useState(false)
  const [manualContact, setManualContact] = useState({
    company_name: '',
    representative: '',
    business_number: '',
    address: '',
    phone: '',
    email: '',
  })

  // Step 3: Items
  const [items, setItems] = useState<DocumentItem[]>([createEmptyItem()])

  // Step 4: Additional info
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [issuerInfo, setIssuerInfo] = useState({
    company_name: '',
    representative: '',
    business_number: '',
    address: '',
    phone: '',
    email: '',
  })

  // Fetch contacts
  useEffect(() => {
    const fetchContacts = async () => {
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .order('company_name')
      if (data) setContacts(data as Contact[])
    }
    fetchContacts()
  }, [])

  // Load template if template query param is present
  useEffect(() => {
    const templateId = searchParams.get('template')
    if (!templateId || templateLoaded) return

    const loadTemplate = async () => {
      try {
        const res = await fetch(`/api/templates/${templateId}`)
        if (!res.ok) throw new Error('템플릿 로드 실패')
        const template = await res.json()

        if (template.type) {
          setDocType(template.type as DocumentType)
        }
        if (template.contact_id) {
          setSelectedContactId(template.contact_id)
        }
        if (template.items && Array.isArray(template.items) && template.items.length > 0) {
          setItems(template.items)
        }
        if (template.notes) {
          setNotes(template.notes)
        }
        setTemplateLoaded(true)
      } catch (err) {
        console.error('템플릿 로드 실패:', err)
      }
    }
    loadTemplate()
  }, [searchParams, templateLoaded])

  const selectedContact = contacts.find((c) => c.id === selectedContactId)
  const receiverInfo = useManualContact
    ? manualContact
    : selectedContact
      ? {
          company_name: selectedContact.company_name,
          representative: selectedContact.representative,
          business_number: selectedContact.business_number,
          address: selectedContact.address || '',
          phone: selectedContact.phone || '',
          email: selectedContact.email || '',
        }
      : { company_name: '', representative: '', business_number: '', address: '', phone: '', email: '' }

  const supplyTotal = items.reduce((sum, item) => sum + item.amount, 0)
  const taxTotal = items.reduce((sum, item) => sum + item.tax, 0)

  const canProceed = () => {
    switch (currentStep) {
      case 0: return docType !== null
      case 1: return useManualContact ? manualContact.company_name.trim() !== '' : selectedContactId !== ''
      case 2: return items.some((item) => item.name.trim() !== '')
      case 3: return title.trim() !== ''
      case 4: return true
      default: return false
    }
  }

  const generateDocNumber = () => {
    const prefix: Record<DocumentType, string> = {
      quotation: 'QT',
      transaction_statement: 'TS',
      tax_invoice: 'TI',
      receipt: 'RC',
      contract: 'CT',
      consent: 'CS',
      purchase_order: 'PO',
      delivery_note: 'DN',
    }
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
    return `${prefix[docType!]}-${dateStr}-${rand}`
  }

  const handleSave = async () => {
    if (!docType) return
    setSaving(true)

    try {
      const docNumber = generateDocNumber()
      const payload = {
        type: docType,
        title,
        document_number: docNumber,
        contact_id: useManualContact ? null : selectedContactId || null,
        issuer_info: issuerInfo,
        receiver_info: receiverInfo,
        items,
        total_amount: supplyTotal,
        tax_amount: taxTotal,
        notes: notes || null,
        status: 'draft' as const,
        user_id: user?.id,
      }

      const { data, error } = await supabase
        .from('documents')
        .insert(payload)
        .select()
        .single()

      if (error) throw error

      alert('서류가 저장되었습니다.')
      router.push(`/documents/${data.id}`)
    } catch (err) {
      console.error('저장 실패:', err)
      alert('서류 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/documents')}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">새 서류 작성</h1>
      </div>

      {/* Progress Indicator - Mobile: current step only, Desktop: full */}
      <div className="sm:hidden flex items-center justify-center gap-3 py-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-blue-600 text-white ring-4 ring-blue-100"
        >
          {currentStep + 1}
        </div>
        <div>
          <span className="text-sm text-blue-600 font-medium">{STEPS[currentStep]}</span>
          <p className="text-xs text-gray-400">단계 {currentStep + 1} / {STEPS.length}</p>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-2">
        {STEPS.map((step, index) => (
          <div key={step} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  index < currentStep
                    ? 'bg-blue-600 text-white'
                    : index === currentStep
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index < currentStep ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`text-xs whitespace-nowrap ${
                  index <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-400'
                }`}
              >
                {step}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 min-w-[20px] ${
                  index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card padding="lg">
        {/* Step 1: Document Type */}
        {currentStep === 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">서류 종류를 선택하세요</h2>
            <p className="text-sm text-gray-500 mb-6">작성할 서류의 유형을 선택합니다.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(Object.entries(DOCUMENT_TYPE_LABELS) as [DocumentType, string][]).map(
                ([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setDocType(key)}
                    className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                      docType === key
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                        docType === key ? 'bg-blue-100' : 'bg-gray-100'
                      }`}
                    >
                      <svg
                        className={`w-5 h-5 ${docType === key ? 'text-blue-600' : 'text-gray-500'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d={TYPE_ICONS[key]}
                        />
                      </svg>
                    </div>
                    <p className="font-medium text-gray-900 text-sm">{label}</p>
                    <p className="text-xs text-gray-500 mt-1">{TYPE_DESCRIPTIONS[key]}</p>
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Step 2: Contact Selection */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">거래처를 선택하세요</h2>
            <p className="text-sm text-gray-500 mb-6">
              기존 거래처를 선택하거나 직접 입력할 수 있습니다.
            </p>

            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setUseManualContact(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !useManualContact
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                기존 거래처 선택
              </button>
              <button
                onClick={() => setUseManualContact(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  useManualContact
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                직접 입력
              </button>
            </div>

            {!useManualContact ? (
              <div>
                <select
                  value={selectedContactId}
                  onChange={(e) => setSelectedContactId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">거래처를 선택하세요</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.company_name} ({contact.representative})
                    </option>
                  ))}
                </select>
                {selectedContact && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm space-y-1">
                    <p><span className="text-gray-500">상호:</span> <span className="font-medium">{selectedContact.company_name}</span></p>
                    <p><span className="text-gray-500">대표자:</span> {selectedContact.representative}</p>
                    <p><span className="text-gray-500">사업자번호:</span> {selectedContact.business_number}</p>
                    <p><span className="text-gray-500">주소:</span> {selectedContact.address || '-'}</p>
                    <p><span className="text-gray-500">연락처:</span> {selectedContact.phone || '-'}</p>
                    <p><span className="text-gray-500">이메일:</span> {selectedContact.email || '-'}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'company_name', label: '상호 (회사명)', required: true },
                  { key: 'representative', label: '대표자' },
                  { key: 'business_number', label: '사업자번호' },
                  { key: 'phone', label: '연락처' },
                  { key: 'email', label: '이메일' },
                  { key: 'address', label: '주소' },
                ].map(({ key, label, required }) => (
                  <div key={key} className={key === 'address' ? 'sm:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {label} {required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={(manualContact as any)[key]}
                      onChange={(e) =>
                        setManualContact((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Items */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">항목을 입력하세요</h2>
            <p className="text-sm text-gray-500 mb-6">
              품목명, 수량, 단가를 입력하면 금액이 자동 계산됩니다.
            </p>
            <ItemsEditor items={items} onChange={setItems} />
          </div>
        )}

        {/* Step 4: Additional Info */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">추가 정보를 입력하세요</h2>
            <p className="text-sm text-gray-500 mb-6">서류 제목과 발행인 정보를 입력합니다.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  서류 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 2026년 3월 홈페이지 제작 견적"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비고 / 특이사항
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="추가 참고사항을 입력하세요"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                  발행인 정보
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'company_name', label: '회사명' },
                    { key: 'representative', label: '대표자' },
                    { key: 'business_number', label: '사업자번호' },
                    { key: 'phone', label: '연락처' },
                    { key: 'email', label: '이메일' },
                    { key: 'address', label: '주소' },
                  ].map(({ key, label }) => (
                    <div key={key} className={key === 'address' ? 'sm:col-span-2' : ''}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                      </label>
                      <input
                        type="text"
                        value={(issuerInfo as any)[key]}
                        onChange={(e) =>
                          setIssuerInfo((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Preview & Save */}
        {currentStep === 4 && docType && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">미리보기</h2>
            <p className="text-sm text-gray-500 mb-6">
              서류 내용을 확인하고 저장하세요.
            </p>
            {/* AI Validation */}
            <div className="mb-6">
              <ValidationBadge
                documentId="new"
                document={{
                  type: docType,
                  title,
                  issuer_info: issuerInfo,
                  receiver_info: receiverInfo,
                  items,
                  total_amount: supplyTotal,
                  tax_amount: taxTotal,
                  notes,
                }}
              />
            </div>

            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <DocumentPreview
                document={{
                  type: docType,
                  title,
                  issuer_info: issuerInfo,
                  receiver_info: receiverInfo,
                  items,
                  notes,
                }}
                type={docType}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          disabled={currentStep === 0}
        >
          이전
        </Button>

        <div className="flex gap-2">
          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={() => setCurrentStep((s) => s + 1)}
              disabled={!canProceed()}
            >
              다음
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : '서류 저장'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
