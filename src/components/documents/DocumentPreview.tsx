'use client'

import { DocumentType, DocumentItem, DOCUMENT_TYPE_LABELS } from '@/types'

interface DocumentPreviewData {
  document_number?: string
  type: DocumentType
  title?: string
  issuer_info: Record<string, any>
  receiver_info: Record<string, any>
  items: DocumentItem[]
  notes?: string | null
  created_at?: string
}

interface DocumentPreviewProps {
  document: DocumentPreviewData
  type: DocumentType
}

export default function DocumentPreview({ document, type }: DocumentPreviewProps) {
  const typeLabel = DOCUMENT_TYPE_LABELS[type]
  const items = document.items || []
  const supplyTotal = items.reduce((sum, item) => sum + (item.amount || 0), 0)
  const taxTotal = items.reduce((sum, item) => sum + (item.tax || 0), 0)
  const grandTotal = supplyTotal + taxTotal
  const issuer = document.issuer_info || {}
  const receiver = document.receiver_info || {}

  return (
    <div className="bg-white border border-gray-300 shadow-lg max-w-[800px] mx-auto print:shadow-none print:border-none text-xs sm:text-sm">
      {/* Document Header */}
      <div className="border-b-4 border-blue-800 px-4 sm:px-8 pt-6 sm:pt-8 pb-4">
        <h1 className="text-xl sm:text-3xl font-bold text-center text-blue-900 tracking-widest mb-2">
          {typeLabel}
        </h1>
        <div className="flex justify-between text-xs sm:text-sm text-gray-600 mt-4">
          <span>서류번호: {document.document_number || '-'}</span>
          <span>
            발행일:{' '}
            {document.created_at
              ? new Date(document.created_at).toLocaleDateString('ko-KR')
              : new Date().toLocaleDateString('ko-KR')}
          </span>
        </div>
      </div>

      {/* Issuer / Receiver Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border-b border-gray-300">
        {/* Issuer */}
        <div className="p-3 sm:p-6 border-b sm:border-b-0 sm:border-r border-gray-300">
          <h3 className="text-sm font-bold text-gray-500 mb-3 tracking-wider">
            공급자 (발행인)
          </h3>
          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-1 text-gray-500 w-20 sm:w-24">상호</td>
                <td className="py-1 font-medium">{issuer.company_name || '-'}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-500">대표자</td>
                <td className="py-1">{issuer.representative || '-'}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-500">사업자번호</td>
                <td className="py-1">{issuer.business_number || '-'}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-500">주소</td>
                <td className="py-1">{issuer.address || '-'}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-500">연락처</td>
                <td className="py-1">{issuer.phone || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Receiver */}
        <div className="p-3 sm:p-6">
          <h3 className="text-sm font-bold text-gray-500 mb-3 tracking-wider">
            공급받는자 (거래처)
          </h3>
          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-1 text-gray-500 w-20 sm:w-24">상호</td>
                <td className="py-1 font-medium">{receiver.company_name || '-'}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-500">대표자</td>
                <td className="py-1">{receiver.representative || '-'}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-500">사업자번호</td>
                <td className="py-1">{receiver.business_number || '-'}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-500">주소</td>
                <td className="py-1">{receiver.address || '-'}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-500">연락처</td>
                <td className="py-1">{receiver.phone || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Title */}
      {document.title && (
        <div className="px-4 sm:px-8 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
          <p className="text-center font-medium text-gray-800">
            건명: {document.title}
          </p>
        </div>
      )}

      {/* Total Summary */}
      <div className="px-4 sm:px-8 py-3 sm:py-4 border-b border-gray-300">
        <div className="flex items-center justify-center gap-4 sm:gap-12">
          <div className="text-center">
            <span className="text-gray-500">공급가액</span>
            <p className="font-bold text-sm sm:text-lg">{supplyTotal.toLocaleString()}원</p>
          </div>
          <div className="text-center">
            <span className="text-gray-500">세액</span>
            <p className="font-bold text-sm sm:text-lg">{taxTotal.toLocaleString()}원</p>
          </div>
          <div className="text-center">
            <span className="text-gray-500">합계금액</span>
            <p className="font-bold text-base sm:text-xl text-blue-900">
              {grandTotal.toLocaleString()}원
            </p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="px-2 sm:px-8 py-4 sm:py-6 overflow-x-auto">
        <table className="w-full border-collapse border border-gray-400 min-w-[600px]">
          <thead>
            <tr className="bg-blue-50">
              <th className="border border-gray-400 px-2 py-2 text-center w-10">번호</th>
              <th className="border border-gray-400 px-2 py-2 text-left">품목명</th>
              <th className="border border-gray-400 px-2 py-2 text-left w-20">규격</th>
              <th className="border border-gray-400 px-2 py-2 text-right w-16">수량</th>
              <th className="border border-gray-400 px-2 py-2 text-right w-24">단가</th>
              <th className="border border-gray-400 px-2 py-2 text-right w-24">공급가액</th>
              <th className="border border-gray-400 px-2 py-2 text-right w-20">세액</th>
              <th className="border border-gray-400 px-2 py-2 text-left w-20">비고</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="border border-gray-400 px-2 py-4 text-center text-gray-400">
                  항목이 없습니다.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-400 px-2 py-1.5 text-center">{index + 1}</td>
                  <td className="border border-gray-400 px-2 py-1.5">{item.name}</td>
                  <td className="border border-gray-400 px-2 py-1.5">{item.specification || ''}</td>
                  <td className="border border-gray-400 px-2 py-1.5 text-right">
                    {item.quantity.toLocaleString()}
                  </td>
                  <td className="border border-gray-400 px-2 py-1.5 text-right">
                    {item.unit_price.toLocaleString()}
                  </td>
                  <td className="border border-gray-400 px-2 py-1.5 text-right">
                    {item.amount.toLocaleString()}
                  </td>
                  <td className="border border-gray-400 px-2 py-1.5 text-right">
                    {(item.tax || 0).toLocaleString()}
                  </td>
                  <td className="border border-gray-400 px-2 py-1.5">{item.note || ''}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-bold">
              <td colSpan={5} className="border border-gray-400 px-2 py-2 text-center">
                합 계
              </td>
              <td className="border border-gray-400 px-2 py-2 text-right">
                {supplyTotal.toLocaleString()}
              </td>
              <td className="border border-gray-400 px-2 py-2 text-right">
                {taxTotal.toLocaleString()}
              </td>
              <td className="border border-gray-400 px-2 py-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Notes */}
      {document.notes && (
        <div className="px-4 sm:px-8 pb-4">
          <div className="bg-gray-50 rounded p-4 text-sm text-gray-600">
            <span className="font-medium text-gray-700">비고: </span>
            {document.notes}
          </div>
        </div>
      )}

      {/* Footer / Stamp area */}
      <div className="px-4 sm:px-8 py-4 sm:py-6 border-t border-gray-200">
        <div className="flex justify-end items-center gap-8">
          <div className="text-center">
            <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-xs">
              인감/도장
            </div>
            <p className="text-xs text-gray-500 mt-1">공급자</p>
          </div>
        </div>
      </div>
    </div>
  )
}
