'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Building2,
  Lock,
  BarChart3,
  Shield,
  Save,
  Loader2,
  LogOut,
  AlertTriangle,
  FileText,
  Users,
  Send,
  Layout,
  Eye,
  EyeOff,
  Calendar,
  Mail,
  Clock,
  FolderOpen,
  Upload,
  Download,
  Trash2,
  X,
  Image as ImageIcon,
  File as FileIcon,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

interface UserFile {
  id: string
  file_name: string
  file_type: string
  file_size: number
  category: string
  created_at: string
}

const FILE_CATEGORIES = [
  '사업자등록증',
  '통장사본',
  '인감증명서',
  '신분증사본',
  '기타',
] as const

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  '사업자등록증': { bg: 'bg-blue-100', text: 'text-blue-700' },
  '통장사본': { bg: 'bg-green-100', text: 'text-green-700' },
  '인감증명서': { bg: 'bg-purple-100', text: 'text-purple-700' },
  '신분증사본': { bg: 'bg-orange-100', text: 'text-orange-700' },
  '기타': { bg: 'bg-gray-100', text: 'text-gray-700' },
}

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

interface ActivityStats {
  totalDocuments: number
  totalContacts: number
  totalSent: number
  totalTemplates: number
}

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

export default function MyPage() {
  const { user, signOut, loading: authLoading } = useAuth()
  const router = useRouter()

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(DEFAULT_COMPANY)
  const [stats, setStats] = useState<ActivityStats>({
    totalDocuments: 0,
    totalContacts: 0,
    totalSent: 0,
    totalTemplates: 0,
  })

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isSavingCompany, setIsSavingCompany] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // File upload state
  const [files, setFiles] = useState<UserFile[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadCategory, setUploadCategory] = useState<string>('기타')
  const [isDragOver, setIsDragOver] = useState(false)
  const [previewFile, setPreviewFile] = useState<{ data: string; name: string; type: string } | null>(null)
  const [previewZoom, setPreviewZoom] = useState(1)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authLoading && user) {
      loadData()
      loadFiles()
    }
  }, [authLoading, user])

  const loadData = async () => {
    setIsLoadingData(true)
    try {
      await Promise.all([loadCompanyInfo(), loadStats()])
    } catch (err) {
      console.error('데이터 불러오기 실패:', err)
    } finally {
      setIsLoadingData(false)
    }
  }

  const loadCompanyInfo = async () => {
    const { data, error } = await supabase
      .from('company_profiles')
      .select('*')
      .single()

    if (!error && data) {
      setCompanyInfo({
        company_name: data.company_name || '',
        representative: data.representative || '',
        business_number: data.business_number || '',
        business_type: data.business_type || '',
        business_category: data.business_category || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
      })
    }
  }

  const loadStats = async () => {
    const [docRes, contactRes, sentRes, templateRes] = await Promise.all([
      supabase.from('documents').select('id', { count: 'exact', head: true }),
      supabase.from('contacts').select('id', { count: 'exact', head: true }),
      supabase.from('documents').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
      supabase.from('document_templates').select('id', { count: 'exact', head: true }),
    ])

    setStats({
      totalDocuments: docRes.count ?? 0,
      totalContacts: contactRes.count ?? 0,
      totalSent: sentRes.count ?? 0,
      totalTemplates: templateRes.count ?? 0,
    })
  }

  const saveCompanyInfo = async () => {
    setIsSavingCompany(true)
    try {
      const { data: existing } = await supabase
        .from('company_profiles')
        .select('id')
        .single()

      if (existing) {
        const { error } = await supabase
          .from('company_profiles')
          .update({
            ...companyInfo,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('company_profiles')
          .insert({
            ...companyInfo,
            user_id: user?.id,
          })
        if (error) throw error
      }

      toast.success('회사 정보가 저장되었습니다.')
    } catch (err) {
      console.error('회사 정보 저장 실패:', err)
      toast.error('회사 정보 저장에 실패했습니다.')
    } finally {
      setIsSavingCompany(false)
    }
  }

  const changePassword = async () => {
    if (!newPassword) {
      toast.error('새 비밀번호를 입력해주세요.')
      return
    }
    if (newPassword.length < 6) {
      toast.error('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.')
      return
    }

    setIsChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      toast.success('비밀번호가 성공적으로 변경되었습니다.')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      console.error('비밀번호 변경 실패:', err)
      toast.error(err.message || '비밀번호 변경에 실패했습니다.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // --- File management functions ---

  const loadFiles = async () => {
    setIsLoadingFiles(true)
    try {
      const res = await fetch('/api/files')
      if (!res.ok) throw new Error('Failed to load files')
      const data = await res.json()
      setFiles(data.files || [])
    } catch (err) {
      console.error('파일 목록 불러오기 실패:', err)
    } finally {
      setIsLoadingFiles(false)
    }
  }

  const uploadFiles = async (fileList: FileList | File[]) => {
    const filesToUpload = Array.from(fileList)
    if (filesToUpload.length === 0) return

    setIsUploading(true)
    let successCount = 0
    let failCount = 0

    for (const file of filesToUpload) {
      try {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name}: 파일 크기는 5MB 이하여야 합니다.`)
          failCount++
          continue
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('category', uploadCategory)

        const res = await fetch('/api/files', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Upload failed')
        }

        successCount++
      } catch (err: any) {
        toast.error(`${file.name}: ${err.message || '업로드 실패'}`)
        failCount++
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount}개 파일 업로드 완료`)
      loadFiles()
    }
    setIsUploading(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files)
      e.target.value = ''
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        uploadFiles(e.dataTransfer.files)
      }
    },
    [uploadCategory]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handlePreview = async (file: UserFile) => {
    try {
      const res = await fetch(`/api/files/${file.id}`)
      if (!res.ok) throw new Error('Failed to load file')
      const data = await res.json()
      setPreviewFile({ data: data.file_data, name: data.file_name, type: data.file_type })
      setPreviewZoom(1)
    } catch (err) {
      toast.error('파일 미리보기를 불러올 수 없습니다.')
    }
  }

  const handleDownload = async (file: UserFile) => {
    try {
      const res = await fetch(`/api/files/${file.id}`)
      if (!res.ok) throw new Error('Failed to load file')
      const data = await res.json()

      // Convert base64 data URL to blob
      const response = await fetch(data.file_data)
      const blob = await response.blob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error('파일 다운로드에 실패했습니다.')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/files/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('파일이 삭제되었습니다.')
      setFiles((prev) => prev.filter((f) => f.id !== id))
      setDeleteConfirmId(null)
    } catch (err) {
      toast.error('파일 삭제에 실패했습니다.')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const isImageType = (type: string) =>
    type.startsWith('image/')

  const emailInitial = user?.email ? user.email.charAt(0).toUpperCase() : '?'

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">마이페이지</h1>
          <p className="text-sm text-gray-500 mt-1">
            프로필 및 계정 정보를 관리합니다.
          </p>
        </div>

        {/* 1. Profile Info */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">프로필 정보</h2>
              <p className="text-xs text-gray-400">계정 기본 정보입니다</p>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-3xl font-bold text-white">{emailInitial}</span>
              </div>
              {/* Info */}
              <div className="flex-1 space-y-3 w-full">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">이메일</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.email || '-'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">가입일</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(user?.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Clock size={16} className="text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">마지막 로그인</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(user?.last_sign_in_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Company Info */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center gap-3">
            <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 size={18} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">내 회사 정보</h2>
              <p className="text-xs text-gray-400">서류에 표시될 발신자 정보입니다</p>
            </div>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            {isLoadingData ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="회사명"
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
                    label="전화번호"
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
                  <button
                    onClick={saveCompanyInfo}
                    disabled={isSavingCompany}
                    className="w-full sm:w-auto px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSavingCompany ? (
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
                </div>
              </>
            )}
          </div>
        </section>

        {/* 3. Change Password */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center gap-3">
            <div className="w-9 h-9 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Lock size={18} className="text-yellow-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">비밀번호 변경</h2>
              <p className="text-xs text-gray-400">계정 비밀번호를 변경합니다</p>
            </div>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">새 비밀번호</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="최소 6자 이상"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">새 비밀번호 확인</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호를 다시 입력하세요"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>
            )}
            <div className="flex justify-end">
              <button
                onClick={changePassword}
                disabled={isChangingPassword || !newPassword || !confirmPassword}
                className="w-full sm:w-auto px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    변경 중...
                  </>
                ) : (
                  <>
                    <Lock size={14} />
                    비밀번호 변경
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* 4. Activity Summary */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <BarChart3 size={18} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">내 활동 요약</h2>
              <p className="text-xs text-gray-400">서비스 이용 현황입니다</p>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {isLoadingData ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                  icon={FileText}
                  label="생성 서류"
                  value={stats.totalDocuments}
                  color="blue"
                />
                <StatCard
                  icon={Users}
                  label="거래처"
                  value={stats.totalContacts}
                  color="green"
                />
                <StatCard
                  icon={Send}
                  label="발송 서류"
                  value={stats.totalSent}
                  color="orange"
                />
                <StatCard
                  icon={Layout}
                  label="저장 템플릿"
                  value={stats.totalTemplates}
                  color="purple"
                />
              </div>
            )}
          </div>
        </section>

        {/* 5. My Document Box */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FolderOpen size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">내 서류함</h2>
              <p className="text-xs text-gray-400">사업자등록증, 통장사본 등 서류를 관리합니다</p>
            </div>
          </div>
          <div className="p-4 sm:p-6 space-y-5">
            {/* Upload area */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">서류 분류</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {FILE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-colors ${
                  isDragOver
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={32} className="animate-spin text-blue-500" />
                    <p className="text-sm text-gray-600">업로드 중...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload size={32} className="text-gray-400" />
                    <p className="text-sm text-gray-600">
                      파일을 드래그하거나 클릭하여 업로드
                    </p>
                    <p className="text-xs text-gray-400">
                      JPG, PNG, GIF, WebP, PDF (최대 5MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* File list */}
            {isLoadingFiles ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-gray-400" />
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">업로드된 서류가 없습니다</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {files.map((file) => {
                  const catColor = CATEGORY_COLORS[file.category] || CATEGORY_COLORS['기타']
                  return (
                    <div
                      key={file.id}
                      className="border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-shadow group"
                    >
                      {/* File icon / thumbnail area */}
                      <div
                        className="w-full h-24 bg-gray-50 rounded-xl flex items-center justify-center mb-3 cursor-pointer"
                        onClick={() => handlePreview(file)}
                      >
                        {isImageType(file.file_type) ? (
                          <ImageIcon size={32} className="text-blue-400" />
                        ) : (
                          <FileIcon size={32} className="text-red-400" />
                        )}
                      </div>

                      {/* File info */}
                      <p
                        className="text-sm font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600"
                        title={file.file_name}
                        onClick={() => handlePreview(file)}
                      >
                        {file.file_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${catColor.bg} ${catColor.text}`}
                        >
                          {file.category}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatFileSize(file.file_size)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(file.created_at).toLocaleDateString('ko-KR')}
                      </p>

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleDownload(file)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Download size={13} />
                          다운로드
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(file.id)}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Delete confirmation */}
                      {deleteConfirmId === file.id && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs text-red-700 mb-2">정말 삭제하시겠습니까?</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDelete(file.id)}
                              className="flex-1 px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                            >
                              삭제
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="flex-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Preview Modal */}
        {previewFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              {/* Modal header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-200 flex-shrink-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate pr-4">
                  {previewFile.name}
                </h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isImageType(previewFile.type) && (
                    <>
                      <button
                        onClick={() => setPreviewZoom((z) => Math.max(0.25, z - 0.25))}
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="축소"
                      >
                        <ZoomOut size={18} />
                      </button>
                      <span className="text-xs text-gray-500 min-w-[3rem] text-center">
                        {Math.round(previewZoom * 100)}%
                      </span>
                      <button
                        onClick={() => setPreviewZoom((z) => Math.min(3, z + 0.25))}
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="확대"
                      >
                        <ZoomIn size={18} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setPreviewFile(null)}
                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              {/* Modal body */}
              <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-gray-50">
                {isImageType(previewFile.type) ? (
                  <img
                    src={previewFile.data}
                    alt={previewFile.name}
                    style={{ transform: `scale(${previewZoom})`, transformOrigin: 'center' }}
                    className="max-w-full max-h-full object-contain transition-transform"
                  />
                ) : previewFile.type === 'application/pdf' ? (
                  <iframe
                    src={previewFile.data}
                    title={previewFile.name}
                    className="w-full h-[70vh] border-0 rounded-lg"
                  />
                ) : (
                  <p className="text-sm text-gray-500">미리보기를 지원하지 않는 형식입니다.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 6. Account Management */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center gap-3">
            <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield size={18} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">계정 관리</h2>
              <p className="text-xs text-gray-400">로그아웃 및 계정 관리</p>
            </div>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            {/* Logout */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900">로그아웃</p>
                <p className="text-xs text-gray-400 mt-0.5">현재 기기에서 로그아웃합니다</p>
              </div>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                <LogOut size={14} />
                로그아웃
              </button>
            </div>

            {/* Delete Account */}
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
              <div>
                <p className="text-sm font-medium text-red-700">회원탈퇴</p>
                <p className="text-xs text-red-400 mt-0.5">계정과 모든 데이터가 삭제됩니다</p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <AlertTriangle size={14} />
                회원탈퇴
              </button>
            </div>

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={20} className="text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">회원탈퇴</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    회원탈퇴를 원하시면 관리자에게 문의해주세요.
                  </p>
                  <p className="text-xs text-gray-400">
                    이메일: admin@docuflow.com
                  </p>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      확인
                    </button>
                  </div>
                </div>
              </div>
            )}
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

const STAT_COLORS: Record<string, { bg: string; icon: string; text: string }> = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-500', text: 'text-blue-700' },
  green: { bg: 'bg-green-50', icon: 'text-green-500', text: 'text-green-700' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-500', text: 'text-orange-700' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-500', text: 'text-purple-700' },
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: number
  color: string
}) {
  const colors = STAT_COLORS[color] || STAT_COLORS.blue

  return (
    <div className={`${colors.bg} rounded-xl p-4 text-center space-y-2`}>
      <div className="flex justify-center">
        <Icon size={20} className={colors.icon} />
      </div>
      <p className={`text-2xl font-bold ${colors.text}`}>{value.toLocaleString()}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}
