'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageSquarePlus, Sparkles, Loader2, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { DOCUMENT_TYPE_LABELS } from '@/types'
import ChatMessage from '@/components/chat/ChatMessage'
import ChatInput from '@/components/chat/ChatInput'
import toast from 'react-hot-toast'

interface DocumentData {
  type: string
  title: string
  receiver_info?: Record<string, string>
  items?: { name: string; spec?: string; qty: number; unit_price: number }[]
  notes?: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  documentData?: DocumentData | null
}

const SUGGESTIONS = [
  { label: '견적서 작성', icon: '📋' },
  { label: '거래명세서 작성', icon: '📄' },
  { label: '세금계산서 발행', icon: '🧾' },
  { label: '계약서 작성', icon: '📝' },
]

const GREETING_MESSAGE: Message = {
  id: 'greeting',
  role: 'assistant',
  content: '안녕하세요! 서류 작성을 도와드리겠습니다. 어떤 서류를 작성하시겠어요?',
  timestamp: new Date().toISOString(),
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([GREETING_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [latestDocumentData, setLatestDocumentData] = useState<DocumentData | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory()
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error

      if (data && data.length > 0) {
        const loadedMessages: Message[] = [GREETING_MESSAGE]
        data.forEach((row) => {
          let documentData: DocumentData | null = null
          try {
            const parsed = JSON.parse(row.content)
            if (parsed._documentData) {
              documentData = parsed._documentData
            }
          } catch {
            // Not JSON, regular message
          }

          loadedMessages.push({
            id: row.id,
            role: row.role,
            content: documentData
              ? JSON.parse(row.content)._message || row.content
              : row.content,
            timestamp: row.created_at,
            documentData,
          })
        })
        setMessages(loadedMessages)

        // Find latest document data
        const lastDoc = loadedMessages.filter((m) => m.documentData).pop()
        if (lastDoc?.documentData) setLatestDocumentData(lastDoc.documentData)
      }
    } catch (err) {
      console.error('채팅 기록 불러오기 실패:', err)
    }
  }

  const saveChatMessage = async (role: 'user' | 'assistant', content: string, documentData?: DocumentData | null) => {
    try {
      const saveContent = documentData
        ? JSON.stringify({ _message: content, _documentData: documentData })
        : content

      await supabase.from('chat_history').insert({
        role,
        content: saveContent,
      })
    } catch (err) {
      console.error('채팅 메시지 저장 실패:', err)
    }
  }

  const sendMessage = useCallback(async (messageText?: string) => {
    const text = messageText || input.trim()
    if (!text || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Save user message
    saveChatMessage('user', text)

    try {
      const chatMessages = messages
        .filter((m) => m.id !== 'greeting')
        .map((m) => ({ role: m.role, content: m.content }))
      chatMessages.push({ role: 'user', content: text })

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatMessages }),
      })

      if (!response.ok) throw new Error('API 요청 실패')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullMessage = ''
      let docData: DocumentData | null = null

      const assistantId = `assistant-${Date.now()}`

      // Add placeholder assistant message
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
        },
      ])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue

              try {
                const parsed = JSON.parse(data)
                if (parsed.document_data) {
                  docData = parsed.document_data
                  setLatestDocumentData(parsed.document_data)
                }
                if (parsed.content) {
                  fullMessage += parsed.content
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: fullMessage, documentData: docData }
                        : m
                    )
                  )
                }
                if (parsed.message) {
                  fullMessage = parsed.message
                  if (parsed.document_data) docData = parsed.document_data
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: fullMessage, documentData: docData }
                        : m
                    )
                  )
                }
              } catch {
                // Skip unparseable lines
              }
            }
          }
        }
      }

      // Save assistant message
      saveChatMessage('assistant', fullMessage, docData)
    } catch (err) {
      console.error('메시지 전송 실패:', err)
      toast.error('메시지 전송에 실패했습니다. 다시 시도해주세요.')
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.',
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages])

  const handleSaveDocument = async () => {
    if (!latestDocumentData) return

    try {
      // Get settings for issuer info
      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'company_info')
        .single()

      const issuerInfo = settingsData?.value || {
        company_name: '',
        representative: '',
        business_number: '',
        address: '',
        phone: '',
        email: '',
      }

      const items = (latestDocumentData.items || []).map((item, idx) => ({
        name: item.name,
        specification: item.spec || '',
        quantity: item.qty,
        unit_price: item.unit_price,
        amount: item.qty * item.unit_price,
        tax: Math.round(item.qty * item.unit_price * 0.1),
        sort_order: idx,
      }))

      const totalAmount = items.reduce((sum, it) => sum + it.amount, 0)
      const taxAmount = items.reduce((sum, it) => sum + it.tax, 0)

      // Generate document number
      const now = new Date()
      const prefix = latestDocumentData.type.slice(0, 3).toUpperCase()
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
      const seq = String(Math.floor(Math.random() * 9999)).padStart(4, '0')
      const documentNumber = `${prefix}-${dateStr}-${seq}`

      const { error } = await supabase.from('documents').insert({
        type: latestDocumentData.type as any,
        title: latestDocumentData.title,
        document_number: documentNumber,
        issuer_info: issuerInfo,
        receiver_info: latestDocumentData.receiver_info || {},
        items,
        total_amount: totalAmount,
        tax_amount: taxAmount,
        notes: latestDocumentData.notes || null,
        status: 'draft',
      })

      if (error) throw error

      toast.success('서류가 저장되었습니다!')
      setLatestDocumentData(null)
    } catch (err) {
      console.error('서류 저장 실패:', err)
      toast.error('서류 저장에 실패했습니다.')
    }
  }

  const handleNewChat = async () => {
    setMessages([{ ...GREETING_MESSAGE, timestamp: new Date().toISOString() }])
    setInput('')
    setLatestDocumentData(null)
    toast.success('새로운 대화를 시작합니다.')
  }

  const handleClearHistory = async () => {
    try {
      await supabase.from('chat_history').delete().neq('id', '')
      setMessages([{ ...GREETING_MESSAGE, timestamp: new Date().toISOString() }])
      setLatestDocumentData(null)
      toast.success('대화 기록이 삭제되었습니다.')
    } catch {
      toast.error('대화 기록 삭제에 실패했습니다.')
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
      {/* Chat Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">AI 서류 작성</h1>
              <p className="text-xs text-gray-500">대화로 간편하게 서류를 작성하세요</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="새 대화"
            >
              <MessageSquarePlus size={16} />
              <span className="hidden sm:inline">새 대화</span>
            </button>
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="기록 삭제"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">기록 삭제</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              role={msg.role}
              content={msg.content}
              timestamp={msg.timestamp}
              documentData={msg.documentData}
              onSaveDocument={msg.documentData ? handleSaveDocument : undefined}
            />
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <Loader2 size={16} className="text-gray-500 animate-spin" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Quick Suggestions (show only when just greeting) */}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 justify-center mt-8 animate-fade-in">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => sendMessage(s.label)}
                  className="px-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                  <span className="mr-1.5">{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={() => sendMessage()}
        disabled={isLoading}
      />
    </div>
  )
}
