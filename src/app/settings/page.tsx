'use client'

import { useState, useEffect } from 'react'
import {
  Building2,
  Database,
  MessageSquare,
  Mail,
  Brain,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface CompanyInfo {
  company_name: string
  representative: string
  business_number: string
  business_type: string
  business_category: string
  address: string
  phone: string
  email: string
}

interface SupabaseSettings {
  url: string
  anon_key: string
}

interface SolapiSettings {
  api_key: string
  api_secret: string
  sender_number: string
}

interface EmailSettings {
  smtp_host: string
  smtp_port: string
  smtp_user: string
  smtp_password: string
}

interface AISettings {
  api_key: string
  model: string
  api_base: string
}

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error'

const DEFAULT_COMPANY: CompanyInfo = {
  company_name: '',
  representative: '',
  business_number: '',
  business_type: '',
  business_category: '',
  address: '',
  phone: '',
  email: '',
}

const DEFAULT_SUPABASE: SupabaseSettings = { url: '', anon_key: '' }
const DEFAULT_SOLAPI: SolapiSettings = { api_key: '', api_secret: '', sender_number: '' }
const DEFAULT_EMAIL: EmailSettings = { smtp_host: '', smtp_port: '587', smtp_user: '', smtp_password: '' }
const DEFAULT_AI: AISettings = { api_key: '', model: 'gpt-4o-mini', api_base: 'https://api.openai.com/v1' }

const AI_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { value: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
]

export default function SettingsPage() {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(DEFAULT_COMPANY)
  const [supabaseSettings, setSupabaseSettings] = useState<SupabaseSettings>(DEFAULT_SUPABASE)
  const [solapiSettings, setSolapiSettings] = useState<SolapiSettings>(DEFAULT_SOLAPI)
  const [emailSettings, setEmailSettings] = useState<EmailSettings>(DEFAULT_EMAIL)
  const [aiSettings, setAiSettings] = useState<AISettings>(DEFAULT_AI)

  const [isSaving, setIsSaving] = useState<string | null>(null)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [connectionStatus, setConnectionStatus] = useState<Record<string, ConnectionStatus>>({})

  useEffect(() => {
    loadAllSettings()
  }, [])

  const loadAllSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')

      if (error) throw error

      if (data) {
        data.forEach((row) => {
          switch (row.key) {
            case 'company_info':
              setCompanyInfo({ ...DEFAULT_COMPANY, ...row.value })
              break
            case 'supabase':
              setSupabaseSettings({ ...DEFAULT_SUPABASE, ...row.value })
              break
            case 'solapi':
              setSolapiSettings({ ...DEFAULT_SOLAPI, ...row.value })
              break
            case 'email':
              setEmailSettings({ ...DEFAULT_EMAIL, ...row.value })
              break
            case 'ai':
              setAiSettings({ ...DEFAULT_AI, ...row.value })
              break
          }
        })
      }
    } catch (err) {
      console.error('설정 불러오기 실패:', err)
    }
  }

  const saveSetting = async (key: string, value: Record<string, any>) => {
    setIsSaving(key)
    try {
      // Upsert: try update, then insert
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('key', key)
        .single()

      if (existing) {
        const { error } = await supabase
          .from('settings')
          .update({ value, updated_at: new Date().toISOString() })
          .eq('key', key)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('settings')
          .insert({ key, value })
        if (error) throw error
      }

      toast.success('설정이 저장되었습니다.')
    } catch (err) {
      console.error('설정 저장 실패:', err)
      toast.error('설정 저장에 실패했습니다.')
    } finally {
      setIsSaving(null)
    }
  }

  const testConnection = async (service: string) => {
    setConnectionStatus((prev) => ({ ...prev, [service]: 'testing' }))

    try {
      switch (service) {
        case 'supabase': {
          // Test by querying settings table
          const { error } = await supabase.from('settings').select('id').limit(1)
          if (error) throw error
          setConnectionStatus((prev) => ({ ...prev, [service]: 'success' }))
          toast.success('Supabase 연결 성공!')
          break
        }
        case 'solapi': {
          if (!solapiSettings.api_key || !solapiSettings.api_secret) {
            throw new Error('API Key와 Secret을 입력해주세요.')
          }
          // Placeholder test
          setConnectionStatus((prev) => ({ ...prev, [service]: 'success' }))
          toast.success('Solapi 설정이 확인되었습니다. 실제 발송 시 검증됩니다.')
          break
        }
        case 'email': {
          if (!emailSettings.smtp_host || !emailSettings.smtp_user) {
            throw new Error('SMTP 호스트와 사용자를 입력해주세요.')
          }
          setConnectionStatus((prev) => ({ ...prev, [service]: 'success' }))
          toast.success('이메일 설정이 확인되었습니다. 실제 발송 시 검증됩니다.')
          break
        }
        case 'ai': {
          if (!aiSettings.api_key) {
            throw new Error('API Key를 입력해주세요.')
          }
          // Quick test with minimal request
          const testRes = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [{ role: 'user', content: '테스트' }] }),
          })
          if (testRes.ok) {
            setConnectionStatus((prev) => ({ ...prev, [service]: 'success' }))
            toast.success('AI API 연결 성공!')
          } else {
            throw new Error('AI API 연결 실패')
          }
          break
        }
      }
    } catch (err: any) {
      setConnectionStatus((prev) => ({ ...prev, [service]: 'error' }))
      toast.error(err.message || `${service} 연결 테스트 실패`)
    }

    // Reset status after 5 seconds
    setTimeout(() => {
      setConnectionStatus((prev) => ({ ...prev, [service]: 'idle' }))
    }, 5000)
  }

  const togglePassword = (field: string) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const StatusIcon = ({ service }: { service: string }) => {
    const status = connectionStatus[service]
    if (status === 'testing') return <Loader2 size={16} className="animate-spin text-blue-500" />
    if (status === 'success') return <CheckCircle2 size={16} className="text-green-500" />
    if (status === 'error') return <XCircle size={16} className="text-red-500" />
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">설정</h1>
          <p className="text-sm text-gray-500 mt-1">
            서비스 연동 및 회사 정보를 관리합니다.
          </p>
        </div>

        {/* 1. Company Info */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">회사 정보</h2>
              <p className="text-xs text-gray-400">서류에 표시될 발신자 정보입니다</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="상호"
                value={companyInfo.company_name}
                onChange={(v) => setCompanyInfo((p) => ({ ...p, company_name: v }))}
                placeholder="(주)서류자동화"
              />
              <InputField
                label="대표자"
                value={companyInfo.representative}
                onChange={(v) => setCompanyInfo((p) => ({ ...p, representative: v }))}
                placeholder="홍길동"
              />
              <InputField
                label="사업자번호"
                value={companyInfo.business_number}
                onChange={(v) => setCompanyInfo((p) => ({ ...p, business_number: v }))}
                placeholder="123-45-67890"
              />
              <InputField
                label="업태"
                value={companyInfo.business_type}
                onChange={(v) => setCompanyInfo((p) => ({ ...p, business_type: v }))}
                placeholder="서비스업"
              />
              <InputField
                label="종목"
                value={companyInfo.business_category}
                onChange={(v) => setCompanyInfo((p) => ({ ...p, business_category: v }))}
                placeholder="소프트웨어 개발"
              />
              <InputField
                label="연락처"
                value={companyInfo.phone}
                onChange={(v) => setCompanyInfo((p) => ({ ...p, phone: v }))}
                placeholder="02-1234-5678"
              />
              <InputField
                label="이메일"
                value={companyInfo.email}
                onChange={(v) => setCompanyInfo((p) => ({ ...p, email: v }))}
                placeholder="info@company.com"
              />
            </div>
            <InputField
              label="주소"
              value={companyInfo.address}
              onChange={(v) => setCompanyInfo((p) => ({ ...p, address: v }))}
              placeholder="서울특별시 강남구 테헤란로 123"
              fullWidth
            />
            <div className="flex justify-end">
              <SaveButton
                onClick={() => saveSetting('company_info', companyInfo)}
                loading={isSaving === 'company_info'}
              />
            </div>
          </div>
        </section>

        {/* 2. Supabase */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
                <Database size={18} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Supabase 연동</h2>
                <p className="text-xs text-gray-400">데이터베이스 및 스토리지</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon service="supabase" />
              <button
                onClick={() => testConnection('supabase')}
                disabled={connectionStatus.supabase === 'testing'}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <RefreshCw size={12} />
                연결 테스트
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <InputField
              label="Supabase URL"
              value={supabaseSettings.url}
              onChange={(v) => setSupabaseSettings((p) => ({ ...p, url: v }))}
              placeholder="https://xxxxx.supabase.co"
              fullWidth
            />
            <PasswordField
              label="Anon Key"
              value={supabaseSettings.anon_key}
              onChange={(v) => setSupabaseSettings((p) => ({ ...p, anon_key: v }))}
              show={showPasswords.supabase_key}
              onToggle={() => togglePassword('supabase_key')}
              placeholder="eyJhbGciOi..."
            />
            <div className="flex justify-end">
              <SaveButton
                onClick={() => saveSetting('supabase', supabaseSettings)}
                loading={isSaving === 'supabase'}
              />
            </div>
          </div>
        </section>

        {/* 3. Solapi */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                <MessageSquare size={18} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Solapi 연동</h2>
                <p className="text-xs text-gray-400">SMS / 알림톡 발송</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon service="solapi" />
              <button
                onClick={() => testConnection('solapi')}
                disabled={connectionStatus.solapi === 'testing'}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <RefreshCw size={12} />
                연결 테스트
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PasswordField
                label="API Key"
                value={solapiSettings.api_key}
                onChange={(v) => setSolapiSettings((p) => ({ ...p, api_key: v }))}
                show={showPasswords.solapi_key}
                onToggle={() => togglePassword('solapi_key')}
                placeholder="NCSXXXXXXXX"
              />
              <PasswordField
                label="API Secret"
                value={solapiSettings.api_secret}
                onChange={(v) => setSolapiSettings((p) => ({ ...p, api_secret: v }))}
                show={showPasswords.solapi_secret}
                onToggle={() => togglePassword('solapi_secret')}
                placeholder="XXXXXXXXXXXXXXXX"
              />
            </div>
            <InputField
              label="발신번호"
              value={solapiSettings.sender_number}
              onChange={(v) => setSolapiSettings((p) => ({ ...p, sender_number: v }))}
              placeholder="02-1234-5678"
              fullWidth
            />
            <div className="flex justify-end">
              <SaveButton
                onClick={() => saveSetting('solapi', solapiSettings)}
                loading={isSaving === 'solapi'}
              />
            </div>
          </div>
        </section>

        {/* 4. Email */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
                <Mail size={18} className="text-orange-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">이메일 설정</h2>
                <p className="text-xs text-gray-400">SMTP 서버를 통한 이메일 발송</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon service="email" />
              <button
                onClick={() => testConnection('email')}
                disabled={connectionStatus.email === 'testing'}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <RefreshCw size={12} />
                연결 테스트
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="SMTP 호스트"
                value={emailSettings.smtp_host}
                onChange={(v) => setEmailSettings((p) => ({ ...p, smtp_host: v }))}
                placeholder="smtp.gmail.com"
              />
              <InputField
                label="SMTP 포트"
                value={emailSettings.smtp_port}
                onChange={(v) => setEmailSettings((p) => ({ ...p, smtp_port: v }))}
                placeholder="587"
              />
              <InputField
                label="사용자 (이메일)"
                value={emailSettings.smtp_user}
                onChange={(v) => setEmailSettings((p) => ({ ...p, smtp_user: v }))}
                placeholder="user@gmail.com"
              />
              <PasswordField
                label="비밀번호 (앱 비밀번호)"
                value={emailSettings.smtp_password}
                onChange={(v) => setEmailSettings((p) => ({ ...p, smtp_password: v }))}
                show={showPasswords.email_password}
                onToggle={() => togglePassword('email_password')}
                placeholder="앱 비밀번호 입력"
              />
            </div>
            <div className="flex justify-end">
              <SaveButton
                onClick={() => saveSetting('email', emailSettings)}
                loading={isSaving === 'email'}
              />
            </div>
          </div>
        </section>

        {/* 5. AI Settings */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Brain size={18} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">AI 설정</h2>
                <p className="text-xs text-gray-400">AI 서류 작성 모델 설정</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon service="ai" />
              <button
                onClick={() => testConnection('ai')}
                disabled={connectionStatus.ai === 'testing'}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <RefreshCw size={12} />
                연결 테스트
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <PasswordField
              label="API Key"
              value={aiSettings.api_key}
              onChange={(v) => setAiSettings((p) => ({ ...p, api_key: v }))}
              show={showPasswords.ai_key}
              onToggle={() => togglePassword('ai_key')}
              placeholder="sk-..."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">모델</label>
                <select
                  value={aiSettings.model}
                  onChange={(e) => setAiSettings((p) => ({ ...p, model: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {AI_MODELS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <InputField
                label="API Base URL"
                value={aiSettings.api_base}
                onChange={(v) => setAiSettings((p) => ({ ...p, api_base: v }))}
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div className="flex justify-end">
              <SaveButton
                onClick={() => saveSetting('ai', aiSettings)}
                loading={isSaving === 'ai'}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

// --- Sub-components ---

function InputField({
  label,
  value,
  onChange,
  placeholder,
  fullWidth,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  fullWidth?: boolean
}) {
  return (
    <div className={`space-y-1 ${fullWidth ? 'sm:col-span-2' : ''}`}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
      />
    </div>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
  placeholder?: string
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  )
}

function SaveButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {loading ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          저장 중...
        </>
      ) : (
        <>
          <Save size={14} />
          저장
        </>
      )}
    </button>
  )
}
