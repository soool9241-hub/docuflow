'use client'

import { useRef, useEffect, KeyboardEvent } from 'react'
import { Send } from 'lucide-react'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
  placeholder?: string
}

export default function ChatInput({ value, onChange, onSend, disabled = false, placeholder = '메시지를 입력하세요...' }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-grow textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    const newHeight = Math.min(textarea.scrollHeight, 160)
    textarea.style.height = `${newHeight}px`
  }, [value])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled) {
        onSend()
      }
    }
  }

  const canSend = value.trim().length > 0 && !disabled

  return (
    <div className="border-t border-gray-200 bg-white p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="flex items-end gap-2 sm:gap-3 max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            rows={1}
            className="w-full resize-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all placeholder:text-gray-400"
            style={{ minHeight: '44px', maxHeight: '160px' }}
          />
        </div>
        <button
          onClick={onSend}
          disabled={!canSend}
          className={`flex-shrink-0 w-12 h-12 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
            canSend
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg active:scale-95'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title="전송 (Enter)"
        >
          <Send size={18} className={canSend ? 'translate-x-0.5' : ''} />
        </button>
      </div>
      <p className="text-[10px] text-gray-400 text-center mt-2">
        Enter로 전송 · Shift + Enter로 줄바꿈
      </p>
    </div>
  )
}
