'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, FileText, AlertTriangle, BarChart3, Info, Check } from 'lucide-react'
import type { Notification } from '@/types'

function getRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`
  return date.toLocaleDateString('ko-KR')
}

function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'unsent':
      return <AlertTriangle className="w-4 h-4 text-orange-500" />
    case 'expiring':
      return <AlertTriangle className="w-4 h-4 text-red-500" />
    case 'summary':
      return <BarChart3 className="w-4 h-4 text-blue-500" />
    case 'info':
      return <Info className="w-4 h-4 text-green-500" />
    default:
      return <FileText className="w-4 h-4 text-gray-500" />
  }
}

export default function NotificationBell() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
  }, [])

  const checkNotifications = useCallback(async () => {
    try {
      await fetch('/api/notifications/check', { method: 'POST' })
      await fetchNotifications()
    } catch (err) {
      console.error('Failed to check notifications:', err)
    }
  }, [fetchNotifications])

  const markAllAsRead = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/notifications', { method: 'PATCH' })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      }
    } catch (err) {
      console.error('Failed to mark notifications as read:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (notification.document_id) {
      router.push(`/documents/${notification.document_id}`)
      setIsOpen(false)
    }
  }

  // Auto-check on mount
  useEffect(() => {
    checkNotifications()
  }, [checkNotifications])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="알림"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4.5 h-4.5 min-w-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-[480px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">알림</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
              >
                <Check className="w-3 h-3" />
                모두 읽음
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                알림이 없습니다.
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 transition-colors ${
                    notification.document_id
                      ? 'cursor-pointer hover:bg-gray-50'
                      : ''
                  } ${!notification.is_read ? 'bg-indigo-50/50' : ''}`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        !notification.is_read
                          ? 'font-semibold text-gray-900'
                          : 'font-medium text-gray-700'
                      }`}
                    >
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    {notification.created_at && (
                      <p className="text-[11px] text-gray-400 mt-1">
                        {getRelativeTime(notification.created_at)}
                      </p>
                    )}
                  </div>
                  {!notification.is_read && (
                    <div className="flex-shrink-0 mt-1.5">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
