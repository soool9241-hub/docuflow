'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import toast from 'react-hot-toast'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  Loader2,
  AlertCircle,
  Building2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Contact } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'

interface ContactForm {
  company_name: string
  representative: string
  business_number: string
  email: string
  phone: string
  address: string
  memo: string
}

const EMPTY_FORM: ContactForm = {
  company_name: '',
  representative: '',
  business_number: '',
  email: '',
  phone: '',
  address: '',
  memo: '',
}

function formatBusinessNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
}

export default function ContactsPage() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [form, setForm] = useState<ContactForm>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ContactForm, string>>>({})
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setContacts(data ?? [])
    } catch (err) {
      console.error('Contacts fetch error:', err)
      setError('거래처 목록을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const filteredContacts = contacts.filter((contact) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      contact.company_name.toLowerCase().includes(q) ||
      contact.representative.toLowerCase().includes(q) ||
      contact.business_number.includes(q) ||
      (contact.email && contact.email.toLowerCase().includes(q)) ||
      (contact.phone && contact.phone.includes(q))
    )
  })

  function openAddModal() {
    setEditingContact(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setModalOpen(true)
  }

  function openEditModal(contact: Contact) {
    setEditingContact(contact)
    setForm({
      company_name: contact.company_name,
      representative: contact.representative,
      business_number: contact.business_number,
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      address: contact.address ?? '',
      memo: contact.memo ?? '',
    })
    setFormErrors({})
    setModalOpen(true)
  }

  function validateForm(): boolean {
    const errors: Partial<Record<keyof ContactForm, string>> = {}

    if (!form.company_name.trim()) {
      errors.company_name = '회사명을 입력해주세요.'
    }
    if (!form.representative.trim()) {
      errors.representative = '대표자를 입력해주세요.'
    }
    if (!form.business_number.trim()) {
      errors.business_number = '사업자번호를 입력해주세요.'
    } else if (!/^\d{3}-\d{2}-\d{5}$/.test(form.business_number)) {
      errors.business_number = '올바른 사업자번호 형식을 입력해주세요. (예: 123-45-67890)'
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = '올바른 이메일 형식을 입력해주세요.'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSave() {
    if (!validateForm()) return

    try {
      setSaving(true)

      const payload = {
        company_name: form.company_name.trim(),
        representative: form.representative.trim(),
        business_number: form.business_number.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        memo: form.memo.trim() || null,
      }

      if (editingContact) {
        const { error: updateError } = await supabase
          .from('contacts')
          .update(payload)
          .eq('id', editingContact.id)

        if (updateError) throw updateError
        toast.success('거래처가 수정되었습니다.')
      } else {
        const { error: insertError } = await supabase
          .from('contacts')
          .insert({ ...payload, user_id: user?.id })

        if (insertError) throw insertError
        toast.success('거래처가 추가되었습니다.')
      }

      setModalOpen(false)
      fetchContacts()
    } catch (err) {
      console.error('Save contact error:', err)
      toast.error('거래처 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(contact: Contact) {
    if (!confirm(`"${contact.company_name}" 거래처를 삭제하시겠습니까?`)) return

    try {
      setDeletingId(contact.id)

      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id)

      if (deleteError) throw deleteError
      toast.success('거래처가 삭제되었습니다.')
      fetchContacts()
    } catch (err) {
      console.error('Delete contact error:', err)
      toast.error('거래처 삭제 중 오류가 발생했습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  function updateForm(field: keyof ContactForm, value: string) {
    if (field === 'business_number') {
      value = formatBusinessNumber(value)
    }
    setForm((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-gray-500">거래처 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <p className="text-gray-700 font-medium">{error}</p>
          <Button variant="outline" onClick={fetchContacts}>
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">거래처 관리</h1>
          <p className="text-gray-500 mt-1">거래처 정보를 등록하고 관리하세요.</p>
        </div>
        <Button onClick={openAddModal} className="self-start sm:self-auto">
          <Plus size={16} />
          새 거래처 추가
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="회사명, 대표자, 사업자번호로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Table */}
      {filteredContacts.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <Building2 className="w-12 h-12 text-gray-300 mb-4" />
          {contacts.length === 0 ? (
            <>
              <p className="text-gray-500 font-medium mb-1">등록된 거래처가 없습니다</p>
              <p className="text-sm text-gray-400 mb-4">
                새 거래처를 추가하여 서류 작성을 시작하세요.
              </p>
              <Button onClick={openAddModal} size="sm">
                <Plus size={16} />
                첫 거래처 추가하기
              </Button>
            </>
          ) : (
            <>
              <p className="text-gray-500 font-medium mb-1">검색 결과가 없습니다</p>
              <p className="text-sm text-gray-400">다른 검색어로 시도해보세요.</p>
            </>
          )}
        </Card>
      ) : (
        <>
        {/* Mobile card layout */}
        <div className="md:hidden space-y-3">
          {filteredContacts.map((contact) => (
            <Card key={contact.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{contact.company_name}</p>
                    <p className="text-xs text-gray-500">{contact.representative}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1 text-xs text-gray-600 mt-3">
                <p className="font-mono">{contact.business_number}</p>
                {contact.phone && <p>{contact.phone}</p>}
                {contact.email && <p>{contact.email}</p>}
              </div>
              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => openEditModal(contact)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="수정"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleDelete(contact)}
                  disabled={deletingId === contact.id}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="삭제"
                >
                  {deletingId === contact.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            </Card>
          ))}
          <div className="px-2 py-2">
            <p className="text-xs text-gray-500">
              총 {filteredContacts.length}개의 거래처
              {searchQuery && ` (검색 결과)`}
            </p>
          </div>
        </div>

        {/* Desktop table layout */}
        <Card padding="none" className="overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    회사명
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    대표자
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    사업자번호
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    이메일
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    전화번호
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    등록일
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {contact.company_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{contact.representative}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {contact.business_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{contact.email ?? '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{contact.phone ?? '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {format(new Date(contact.created_at), 'yyyy.MM.dd', { locale: ko })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(contact)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(contact)}
                          disabled={deletingId === contact.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="삭제"
                        >
                          {deletingId === contact.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">
              총 {filteredContacts.length}개의 거래처
              {searchQuery && ` (검색 결과)`}
            </p>
          </div>
        </Card>
        </>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingContact ? '거래처 수정' : '새 거래처 추가'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="회사명 *"
              placeholder="주식회사 예시"
              value={form.company_name}
              onChange={(e) => updateForm('company_name', e.target.value)}
              error={formErrors.company_name}
            />
            <Input
              label="대표자 *"
              placeholder="홍길동"
              value={form.representative}
              onChange={(e) => updateForm('representative', e.target.value)}
              error={formErrors.representative}
            />
          </div>
          <Input
            label="사업자번호 *"
            placeholder="123-45-67890"
            value={form.business_number}
            onChange={(e) => updateForm('business_number', e.target.value)}
            error={formErrors.business_number}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="이메일"
              type="email"
              placeholder="example@company.com"
              value={form.email}
              onChange={(e) => updateForm('email', e.target.value)}
              error={formErrors.email}
            />
            <Input
              label="전화번호"
              placeholder="02-1234-5678"
              value={form.phone}
              onChange={(e) => updateForm('phone', e.target.value)}
            />
          </div>
          <Input
            label="주소"
            placeholder="서울특별시 강남구 ..."
            value={form.address}
            onChange={(e) => updateForm('address', e.target.value)}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">메모</label>
            <textarea
              placeholder="거래처에 대한 메모를 입력하세요..."
              value={form.memo}
              onChange={(e) => updateForm('memo', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 size={16} className="animate-spin" />}
            {editingContact ? '수정' : '추가'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
