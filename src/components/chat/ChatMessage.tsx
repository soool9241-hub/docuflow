'use client'

import { format } from 'date-fns'
import { User, Bot, FileText } from 'lucide-react'
import { DOCUMENT_TYPE_LABELS } from '@/types'

interface DocumentData {
  type: string
  title: string
  receiver_info?: Record<string, string>
  items?: { name: string; spec?: string; qty: number; unit_price: number }[]
  notes?: string
}

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  documentData?: DocumentData | null
  onSaveDocument?: () => void
}

function formatText(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    // Bold
    let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Bullet points
    if (processed.startsWith('- ') || processed.startsWith('• ')) {
      processed = `<span class="ml-2">•</span> ${processed.slice(2)}`
    }
    return (
      <span key={i} className="block" dangerouslySetInnerHTML={{ __html: processed }} />
    )
  })
}

function formatAmount(n: number) {
  return n.toLocaleString('ko-KR')
}

export default function ChatMessage({ role, content, timestamp, documentData, onSaveDocument }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div className={`flex gap-3 animate-fade-in ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Message Content */}
      <div className={`max-w-[75%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-md'
              : 'bg-gray-100 text-gray-800 rounded-tl-md'
          }`}
        >
          <div className="space-y-1">{formatText(content)}</div>
        </div>

        {/* Document Preview Card */}
        {documentData && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex items-center gap-2">
              <FileText size={16} className="text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">
                {DOCUMENT_TYPE_LABELS[documentData.type as keyof typeof DOCUMENT_TYPE_LABELS] || documentData.type} 미리보기
              </span>
            </div>
            <div className="p-4 space-y-3">
              <h4 className="font-semibold text-gray-900">{documentData.title}</h4>

              {documentData.receiver_info && (
                <div className="text-xs text-gray-500 space-y-0.5">
                  {documentData.receiver_info.company_name && (
                    <p>수신: {documentData.receiver_info.company_name}</p>
                  )}
                  {documentData.receiver_info.representative && (
                    <p>담당: {documentData.receiver_info.representative}</p>
                  )}
                </div>
              )}

              {documentData.items && documentData.items.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600">
                        <th className="px-3 py-1.5 text-left font-medium">품목</th>
                        <th className="px-3 py-1.5 text-center font-medium">수량</th>
                        <th className="px-3 py-1.5 text-right font-medium">단가</th>
                        <th className="px-3 py-1.5 text-right font-medium">금액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documentData.items.map((item, idx) => (
                        <tr key={idx} className="border-t border-gray-100">
                          <td className="px-3 py-1.5 text-left text-gray-800">
                            {item.name}
                            {item.spec && <span className="text-gray-400 ml-1">({item.spec})</span>}
                          </td>
                          <td className="px-3 py-1.5 text-center text-gray-600">{item.qty}</td>
                          <td className="px-3 py-1.5 text-right text-gray-600">{formatAmount(item.unit_price)}원</td>
                          <td className="px-3 py-1.5 text-right font-medium text-gray-800">
                            {formatAmount(item.qty * item.unit_price)}원
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-blue-50 border-t-2 border-gray-300">
                        <td colSpan={3} className="px-3 py-2 text-right font-semibold text-gray-700">
                          합계
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-blue-700">
                          {formatAmount(
                            documentData.items.reduce((sum, it) => sum + it.qty * it.unit_price, 0)
                          )}
                          원
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {documentData.notes && (
                <p className="text-xs text-gray-500 italic">비고: {documentData.notes}</p>
              )}

              {onSaveDocument && (
                <button
                  onClick={onSaveDocument}
                  className="w-full mt-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FileText size={14} />
                  서류 저장
                </button>
              )}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <p className={`text-[10px] text-gray-400 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {format(new Date(timestamp), 'HH:mm')}
        </p>
      </div>
    </div>
  )
}
