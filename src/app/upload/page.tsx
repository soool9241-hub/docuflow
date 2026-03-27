'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Upload,
  FileSpreadsheet,
  Camera,
  Image as ImageIcon,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Trash2,
  Eye,
  Clock,
  User,
  Users,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface OCRResult {
  fullText: string
  lines: string[]
  extractedInfo: Record<string, string>
  fieldCount: number
}

interface ParsedRow {
  [key: string]: string
}

interface UploadHistoryItem {
  id: string
  fileName: string
  fileType: string
  rowCount: number
  status: 'success' | 'error'
  createdAt: string
}

interface FieldMapping {
  source: string
  target: string
}

const CONTACT_FIELDS = [
  { key: 'company_name', label: '상호명' },
  { key: 'representative', label: '대표자' },
  { key: 'business_number', label: '사업자번호' },
  { key: 'email', label: '이메일' },
  { key: 'phone', label: '연락처' },
  { key: 'address', label: '주소' },
  { key: 'memo', label: '메모' },
  { key: '_skip', label: '(건너뛰기)' },
]

export default function UploadPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'file' | 'camera'>('file')
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<ParsedRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryItem[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [savingContact, setSavingContact] = useState(false)
  const [savingMyInfo, setSavingMyInfo] = useState(false)
  const [multiFiles, setMultiFiles] = useState<File[]>([])
  const [multiOcrResults, setMultiOcrResults] = useState<{ file: File; result: OCRResult | null; loading: boolean; saved?: 'contact' | 'myinfo' }[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    loadUploadHistory()
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const loadUploadHistory = async () => {
    try {
      const stored = localStorage.getItem('upload_history')
      if (stored) {
        setUploadHistory(JSON.parse(stored))
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  const saveToHistory = (entry: UploadHistoryItem) => {
    const updated = [entry, ...uploadHistory].slice(0, 20)
    setUploadHistory(updated)
    try {
      localStorage.setItem('upload_history', JSON.stringify(updated))
    } catch {
      // Ignore
    }
  }

  // --- OCR ---
  const runOCR = async (fileOrDataUrl: File | string) => {
    setOcrLoading(true)
    setOcrResult(null)
    setExtractedText(null)
    try {
      const formData = new FormData()
      if (typeof fileOrDataUrl === 'string') {
        formData.append('imageData', fileOrDataUrl)
      } else {
        formData.append('file', fileOrDataUrl)
      }

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setExtractedText(data.error || 'OCR 처리에 실패했습니다.')
        return
      }

      setOcrResult(data)
      setExtractedText(data.fullText)
      toast.success(`텍스트 ${data.fieldCount}개 항목 인식 완료!`)
    } catch (err) {
      console.error('OCR error:', err)
      setExtractedText('OCR 처리 중 오류가 발생했습니다.')
    } finally {
      setOcrLoading(false)
    }
  }

  const saveOcrAsContact = async () => {
    if (!ocrResult?.extractedInfo) return
    const info = ocrResult.extractedInfo

    if (!info.company_name && !info.representative) {
      toast.error('상호명 또는 대표자 정보를 인식하지 못했습니다.')
      return
    }

    setSavingContact(true)
    try {
      const { error } = await supabase.from('contacts').insert({
        company_name: info.company_name || '-',
        representative: info.representative || '-',
        business_number: info.business_number || '-',
        email: info.email || null,
        phone: info.phone || null,
        address: info.address || null,
        memo: info.business_type ? `업태: ${info.business_type}${info.business_category ? ` / 종목: ${info.business_category}` : ''}` : null,
        user_id: user?.id,
      })

      if (error) throw error
      toast.success('거래처로 등록되었습니다!')
    } catch (err) {
      console.error('Contact save error:', err)
      toast.error('거래처 저장에 실패했습니다.')
    } finally {
      setSavingContact(false)
    }
  }

  const saveOcrAsMyInfo = async () => {
    if (!ocrResult?.extractedInfo) return
    const info = ocrResult.extractedInfo

    setSavingMyInfo(true)
    try {
      const updateData: Record<string, string> = {}
      if (info.company_name) updateData.company_name = info.company_name
      if (info.representative) updateData.representative = info.representative
      if (info.business_number) updateData.business_number = info.business_number
      if (info.phone) updateData.phone = info.phone
      if (info.email) updateData.email = info.email
      if (info.address) updateData.address = info.address
      if (info.business_type) updateData.business_type = info.business_type
      if (info.business_category) updateData.business_category = info.business_category

      const { error } = await supabase
        .from('company_profiles')
        .update(updateData)
        .eq('user_id', user?.id)

      if (error) throw error
      toast.success('내 회사 정보가 저장되었습니다!')
    } catch (err) {
      console.error('My info save error:', err)
      toast.error('내 정보 저장에 실패했습니다.')
    } finally {
      setSavingMyInfo(false)
    }
  }

  // --- Multi File Upload ---
  const handleMultiFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase()
      return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '')
    })

    if (imageFiles.length === 0) {
      toast.error('이미지 파일을 선택해주세요.')
      return
    }

    setMultiFiles(imageFiles)
    const entries = imageFiles.map(f => ({ file: f, result: null as OCRResult | null, loading: true }))
    setMultiOcrResults(entries)

    // Run OCR on all files
    imageFiles.forEach(async (f, idx) => {
      try {
        const formData = new FormData()
        formData.append('file', f)
        const response = await fetch('/api/ocr', { method: 'POST', body: formData })
        const data = await response.json()

        setMultiOcrResults(prev => prev.map((item, i) =>
          i === idx ? { ...item, result: response.ok ? data : null, loading: false } : item
        ))
      } catch {
        setMultiOcrResults(prev => prev.map((item, i) =>
          i === idx ? { ...item, loading: false } : item
        ))
      }
    })
  }

  const saveMultiAsContact = async (idx: number) => {
    const item = multiOcrResults[idx]
    if (!item?.result?.extractedInfo) return
    const info = item.result.extractedInfo

    try {
      const { error } = await supabase.from('contacts').insert({
        company_name: info.company_name || '-',
        representative: info.representative || '-',
        business_number: info.business_number || '-',
        email: info.email || null,
        phone: info.phone || null,
        address: info.address || null,
        memo: info.business_type ? `업태: ${info.business_type}${info.business_category ? ` / 종목: ${info.business_category}` : ''}` : null,
        user_id: user?.id,
      })
      if (error) throw error
      setMultiOcrResults(prev => prev.map((item, i) => i === idx ? { ...item, saved: 'contact' } : item))
      toast.success('거래처로 등록되었습니다!')
    } catch {
      toast.error('저장에 실패했습니다.')
    }
  }

  const saveMultiAsMyInfo = async (idx: number) => {
    const item = multiOcrResults[idx]
    if (!item?.result?.extractedInfo) return
    const info = item.result.extractedInfo

    try {
      const updateData: Record<string, string> = {}
      if (info.company_name) updateData.company_name = info.company_name
      if (info.representative) updateData.representative = info.representative
      if (info.business_number) updateData.business_number = info.business_number
      if (info.phone) updateData.phone = info.phone
      if (info.email) updateData.email = info.email
      if (info.address) updateData.address = info.address

      const { error } = await supabase.from('company_profiles').update(updateData).eq('user_id', user?.id)
      if (error) throw error
      setMultiOcrResults(prev => prev.map((item, i) => i === idx ? { ...item, saved: 'myinfo' } : item))
      toast.success('내 회사 정보가 저장되었습니다!')
    } catch {
      toast.error('저장에 실패했습니다.')
    }
  }

  const saveAllMultiAsContact = async () => {
    const unsaved = multiOcrResults
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => !item.saved && item.result && Object.keys(item.result.extractedInfo).length > 0)

    if (unsaved.length === 0) {
      toast.error('저장할 항목이 없습니다.')
      return
    }

    let successCount = 0
    for (const { item, idx } of unsaved) {
      const info = item.result!.extractedInfo
      try {
        const { error } = await supabase.from('contacts').insert({
          company_name: info.company_name || '-',
          representative: info.representative || '-',
          business_number: info.business_number || '-',
          email: info.email || null,
          phone: info.phone || null,
          address: info.address || null,
          memo: info.business_type ? `업태: ${info.business_type}${info.business_category ? ` / 종목: ${info.business_category}` : ''}` : null,
          user_id: user?.id,
        })
        if (!error) {
          setMultiOcrResults(prev => prev.map((item, i) => i === idx ? { ...item, saved: 'contact' } : item))
          successCount++
        }
      } catch { /* skip */ }
    }
    toast.success(`${successCount}/${unsaved.length}건 거래처로 일괄 등록 완료!`)
  }

  // --- File Upload ---
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 1) {
      // Multi file - check if images
      const imageFiles = files.filter(f => {
        const ext = f.name.split('.').pop()?.toLowerCase()
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '')
      })
      if (imageFiles.length > 0) {
        setMultiFiles(imageFiles)
        const entries = imageFiles.map(f => ({ file: f, result: null as OCRResult | null, loading: true }))
        setMultiOcrResults(entries)
        imageFiles.forEach(async (f, idx) => {
          try {
            const formData = new FormData()
            formData.append('file', f)
            const response = await fetch('/api/ocr', { method: 'POST', body: formData })
            const data = await response.json()
            setMultiOcrResults(prev => prev.map((item, i) =>
              i === idx ? { ...item, result: response.ok ? data : null, loading: false } : item
            ))
          } catch {
            setMultiOcrResults(prev => prev.map((item, i) =>
              i === idx ? { ...item, loading: false } : item
            ))
          }
        })
        return
      }
    }
    if (files.length === 1) processFile(files[0])
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) processFile(selected)
  }

  const processFile = (f: File) => {
    setFile(f)
    setParsedData([])
    setHeaders([])
    setFieldMappings([])
    setImagePreview(null)
    setExtractedText(null)
    setShowPreview(false)

    const ext = f.name.split('.').pop()?.toLowerCase()

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '')) {
      // Image preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(f)
      // Run OCR
      runOCR(f)
    } else if (ext === 'csv') {
      // Parse CSV
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        parseCSV(text)
      }
      reader.readAsText(f, 'UTF-8')
    } else {
      toast.error('지원하지 않는 파일 형식입니다. CSV, 이미지 파일을 사용해주세요.')
      setFile(null)
    }
  }

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) {
      toast.error('CSV 파일에 데이터가 부족합니다.')
      return
    }

    const csvHeaders = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
    setHeaders(csvHeaders)

    const rows: ParsedRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
      const row: ParsedRow = {}
      csvHeaders.forEach((header, idx) => {
        row[header] = values[idx] || ''
      })
      rows.push(row)
    }
    setParsedData(rows)

    // Auto-map fields
    const autoMappings: FieldMapping[] = csvHeaders.map((header) => {
      const lowerHeader = header.toLowerCase()
      let target = '_skip'

      if (lowerHeader.includes('상호') || lowerHeader.includes('회사') || lowerHeader.includes('company')) {
        target = 'company_name'
      } else if (lowerHeader.includes('대표') || lowerHeader.includes('representative')) {
        target = 'representative'
      } else if (lowerHeader.includes('사업자') || lowerHeader.includes('business')) {
        target = 'business_number'
      } else if (lowerHeader.includes('이메일') || lowerHeader.includes('email')) {
        target = 'email'
      } else if (lowerHeader.includes('전화') || lowerHeader.includes('연락') || lowerHeader.includes('phone')) {
        target = 'phone'
      } else if (lowerHeader.includes('주소') || lowerHeader.includes('address')) {
        target = 'address'
      } else if (lowerHeader.includes('메모') || lowerHeader.includes('비고') || lowerHeader.includes('memo')) {
        target = 'memo'
      }

      return { source: header, target }
    })
    setFieldMappings(autoMappings)
    setShowPreview(true)
  }

  const updateMapping = (sourceHeader: string, target: string) => {
    setFieldMappings((prev) =>
      prev.map((m) => (m.source === sourceHeader ? { ...m, target } : m))
    )
  }

  const handleImport = async () => {
    if (parsedData.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const activeMappings = fieldMappings.filter((m) => m.target !== '_skip')
      if (activeMappings.length === 0) {
        toast.error('최소 하나의 필드를 매핑해주세요.')
        setIsUploading(false)
        return
      }

      // Check required fields
      const hasCompanyName = activeMappings.some((m) => m.target === 'company_name')
      if (!hasCompanyName) {
        toast.error('상호명 필드는 필수입니다.')
        setIsUploading(false)
        return
      }

      let successCount = 0
      const total = parsedData.length

      for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i]
        const contact: Record<string, string> = {}

        activeMappings.forEach((m) => {
          contact[m.target] = row[m.source] || ''
        })

        // Ensure required fields
        if (!contact.company_name) continue
        if (!contact.representative) contact.representative = '-'
        if (!contact.business_number) contact.business_number = '-'

        const { error } = await supabase.from('contacts').insert({
          company_name: contact.company_name,
          representative: contact.representative,
          business_number: contact.business_number,
          email: contact.email || null,
          phone: contact.phone || null,
          address: contact.address || null,
          memo: contact.memo || null,
          user_id: user?.id,
        })

        if (!error) successCount++

        setUploadProgress(Math.round(((i + 1) / total) * 100))
      }

      toast.success(`${successCount}/${total}건의 거래처가 등록되었습니다.`)

      saveToHistory({
        id: Date.now().toString(),
        fileName: file?.name || 'unknown',
        fileType: 'CSV',
        rowCount: successCount,
        status: 'success',
        createdAt: new Date().toISOString(),
      })

      // Reset
      setFile(null)
      setParsedData([])
      setHeaders([])
      setFieldMappings([])
      setShowPreview(false)
    } catch (err) {
      console.error('Import error:', err)
      toast.error('데이터 가져오기에 실패했습니다.')

      saveToHistory({
        id: Date.now().toString(),
        fileName: file?.name || 'unknown',
        fileType: 'CSV',
        rowCount: 0,
        status: 'error',
        createdAt: new Date().toISOString(),
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Also support uploading file via API
  const handleFileUploadToServer = async () => {
    if (!file) return
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('업로드 실패')

      const data = await response.json()

      if (data.headers && data.rows) {
        setHeaders(data.headers)
        setParsedData(data.rows)

        const autoMappings: FieldMapping[] = data.headers.map((header: string) => ({
          source: header,
          target: '_skip',
        }))
        setFieldMappings(autoMappings)
        setShowPreview(true)
      }

      setUploadProgress(100)
      toast.success('파일이 업로드되었습니다.')
    } catch (err) {
      console.error('Upload error:', err)
      toast.error('파일 업로드에 실패했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  // --- Camera ---
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      setCameraStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error('Camera error:', err)
      toast.error('카메라를 사용할 수 없습니다. 카메라 권한을 확인해주세요.')
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
      setCameraStream(null)
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
      setCapturedImage(dataUrl)
      stopCamera()
      // Run OCR on captured image
      runOCR(dataUrl)
    }
  }

  const resetUpload = () => {
    setFile(null)
    setImagePreview(null)
    setExtractedText(null)
    setParsedData([])
    setHeaders([])
    setFieldMappings([])
    setShowPreview(false)
    setCapturedImage(null)
    setOcrResult(null)
    setOcrLoading(false)
    setMultiFiles([])
    setMultiOcrResults([])
    stopCamera()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">데이터 업로드</h1>
          <p className="text-sm text-gray-500 mt-1">
            CSV 파일이나 이미지를 업로드하여 내 정보 또는 거래처를 등록할 수 있습니다. 여러 파일 동시 업로드 가능!
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-1 bg-gray-200 rounded-xl p-1 w-full sm:w-fit">
          <button
            onClick={() => { setActiveTab('file'); resetUpload() }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'file'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileSpreadsheet size={16} />
            파일 업로드
          </button>
          <button
            onClick={() => { setActiveTab('camera'); resetUpload() }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'camera'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Camera size={16} />
            카메라 촬영
          </button>
        </div>

        {/* File Upload Tab */}
        {activeTab === 'file' && (
          <div className="space-y-6">
            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                    : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.jpg,.jpeg,.png,.gif,.webp"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    if (files.length > 1) {
                      handleMultiFileSelect(e)
                    } else if (files.length === 1) {
                      processFile(files[0])
                    }
                  }}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                    isDragging ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Upload size={28} className={isDragging ? 'text-blue-600' : 'text-gray-400'} />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-700">
                      {isDragging ? '여기에 놓으세요' : '파일을 드래그하거나 클릭하여 업로드'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      CSV, JPG, PNG, GIF, WebP (최대 10MB) · 여러 파일 선택 가능
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* File Info Bar */}
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    {imagePreview ? (
                      <ImageIcon size={20} className="text-green-600" />
                    ) : (
                      <FileSpreadsheet size={20} className="text-blue-600" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{file.name}</p>
                      <p className="text-xs text-gray-400">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={resetUpload}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="제거"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Image Preview */}
                {imagePreview && (
                  <div className="p-6 space-y-4">
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 max-h-96 flex items-center justify-center bg-gray-100">
                      <img src={imagePreview} alt="미리보기" className="max-h-96 object-contain" />
                    </div>
                    {ocrLoading && (
                      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <Loader2 size={20} className="text-blue-600 animate-spin" />
                        <p className="text-sm text-blue-700">텍스트 인식 중...</p>
                      </div>
                    )}
                    {ocrResult && (
                      <div className="space-y-4">
                        {/* Extracted Info */}
                        {Object.keys(ocrResult.extractedInfo).length > 0 && (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <p className="text-sm font-semibold text-green-800 mb-3">인식된 정보</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {ocrResult.extractedInfo.company_name && (
                                <div className="flex gap-2">
                                  <span className="text-xs font-medium text-green-600 min-w-[60px]">상호명</span>
                                  <span className="text-sm text-green-900">{ocrResult.extractedInfo.company_name}</span>
                                </div>
                              )}
                              {ocrResult.extractedInfo.representative && (
                                <div className="flex gap-2">
                                  <span className="text-xs font-medium text-green-600 min-w-[60px]">대표자</span>
                                  <span className="text-sm text-green-900">{ocrResult.extractedInfo.representative}</span>
                                </div>
                              )}
                              {ocrResult.extractedInfo.business_number && (
                                <div className="flex gap-2">
                                  <span className="text-xs font-medium text-green-600 min-w-[60px]">사업자번호</span>
                                  <span className="text-sm text-green-900 font-mono">{ocrResult.extractedInfo.business_number}</span>
                                </div>
                              )}
                              {ocrResult.extractedInfo.phone && (
                                <div className="flex gap-2">
                                  <span className="text-xs font-medium text-green-600 min-w-[60px]">전화번호</span>
                                  <span className="text-sm text-green-900">{ocrResult.extractedInfo.phone}</span>
                                </div>
                              )}
                              {ocrResult.extractedInfo.email && (
                                <div className="flex gap-2">
                                  <span className="text-xs font-medium text-green-600 min-w-[60px]">이메일</span>
                                  <span className="text-sm text-green-900">{ocrResult.extractedInfo.email}</span>
                                </div>
                              )}
                              {ocrResult.extractedInfo.address && (
                                <div className="flex gap-2 sm:col-span-2">
                                  <span className="text-xs font-medium text-green-600 min-w-[60px]">주소</span>
                                  <span className="text-sm text-green-900">{ocrResult.extractedInfo.address}</span>
                                </div>
                              )}
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-2">
                              <button
                                onClick={saveOcrAsMyInfo}
                                disabled={savingMyInfo}
                                className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {savingMyInfo ? (
                                  <><Loader2 size={16} className="animate-spin" /> 저장 중...</>
                                ) : (
                                  <><User size={16} /> 내 정보로 저장</>
                                )}
                              </button>
                              <button
                                onClick={saveOcrAsContact}
                                disabled={savingContact}
                                className="px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {savingContact ? (
                                  <><Loader2 size={16} className="animate-spin" /> 저장 중...</>
                                ) : (
                                  <><Users size={16} /> 거래처로 등록</>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                        {/* Full Text */}
                        <details className="bg-gray-50 border border-gray-200 rounded-xl">
                          <summary className="px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 rounded-xl">
                            전체 인식 텍스트 보기 ({ocrResult.fieldCount}개 항목)
                          </summary>
                          <div className="px-4 pb-4">
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{ocrResult.fullText}</p>
                          </div>
                        </details>
                      </div>
                    )}
                    {extractedText && !ocrResult && !ocrLoading && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <p className="text-sm font-medium text-yellow-800 mb-2">알림</p>
                        <p className="text-sm text-yellow-700 whitespace-pre-wrap">{extractedText}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* CSV Preview Table */}
                {showPreview && parsedData.length > 0 && (
                  <div className="p-6 space-y-6">
                    {/* Field Mapping */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-3">필드 매핑</h3>
                      <p className="text-xs text-gray-500 mb-4">
                        CSV 열을 거래처 필드에 매핑하세요. 자동 감지된 매핑을 수정할 수 있습니다.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {fieldMappings.map((mapping) => (
                          <div
                            key={mapping.source}
                            className="flex items-center gap-2 bg-gray-50 rounded-lg p-3"
                          >
                            <span className="text-sm text-gray-700 font-medium min-w-[80px] truncate">
                              {mapping.source}
                            </span>
                            <ArrowRight size={14} className="text-gray-400 flex-shrink-0" />
                            <select
                              value={mapping.target}
                              onChange={(e) => updateMapping(mapping.source, e.target.value)}
                              className="flex-1 text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {CONTACT_FIELDS.map((field) => (
                                <option key={field.key} value={field.key}>
                                  {field.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Data Preview Table */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-800">
                          데이터 미리보기
                          <span className="ml-2 text-xs font-normal text-gray-400">
                            (총 {parsedData.length}건)
                          </span>
                        </h3>
                      </div>
                      <div className="border rounded-xl overflow-hidden overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 border-b">
                                #
                              </th>
                              {headers.map((h) => (
                                <th
                                  key={h}
                                  className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 border-b whitespace-nowrap"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {parsedData.slice(0, 10).map((row, idx) => (
                              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="px-4 py-2 text-gray-400 text-xs">{idx + 1}</td>
                                {headers.map((h) => (
                                  <td key={h} className="px-4 py-2 text-gray-700 whitespace-nowrap">
                                    {row[h]}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {parsedData.length > 10 && (
                          <div className="bg-gray-50 px-4 py-2 text-xs text-gray-400 text-center border-t">
                            ... 외 {parsedData.length - 10}건
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {isUploading && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">가져오는 중...</span>
                          <span className="text-blue-600 font-medium">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Import Button */}
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={resetUpload}
                        className="px-5 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleImport}
                        disabled={isUploading}
                        className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            가져오는 중...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={16} />
                            거래처로 가져오기 ({parsedData.length}건)
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Camera Tab */}
        {activeTab === 'camera' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {!cameraStream && !capturedImage ? (
                <div className="p-12 flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <Camera size={32} className="text-gray-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-700">카메라로 서류 촬영</p>
                    <p className="text-sm text-gray-400 mt-1">
                      명함, 서류, 영수증 등을 촬영하여 데이터를 추출합니다
                    </p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Camera size={18} />
                    카메라 열기
                  </button>
                </div>
              ) : cameraStream ? (
                <div className="relative fixed inset-0 z-50 sm:static sm:z-auto bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full sm:max-h-[500px] object-contain bg-black"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
                    <button
                      onClick={stopCamera}
                      className="w-12 h-12 rounded-full bg-white/80 backdrop-blur text-gray-600 flex items-center justify-center hover:bg-white transition-all"
                    >
                      <X size={20} />
                    </button>
                    <button
                      onClick={capturePhoto}
                      className="w-16 h-16 rounded-full bg-white border-4 border-blue-500 flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
                    >
                      <div className="w-12 h-12 bg-blue-500 rounded-full" />
                    </button>
                    <div className="w-12 h-12" /> {/* Spacer */}
                  </div>
                </div>
              ) : capturedImage ? (
                <div className="p-6 space-y-4">
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 max-h-96 flex items-center justify-center bg-gray-100">
                    <img src={capturedImage} alt="촬영된 이미지" className="max-h-96 object-contain" />
                  </div>
                  {ocrLoading && (
                    <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <Loader2 size={20} className="text-blue-600 animate-spin" />
                      <p className="text-sm text-blue-700">텍스트 인식 중...</p>
                    </div>
                  )}
                  {ocrResult && (
                    <div className="space-y-4">
                      {Object.keys(ocrResult.extractedInfo).length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                          <p className="text-sm font-semibold text-green-800 mb-3">인식된 정보</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {ocrResult.extractedInfo.company_name && (
                              <div className="flex gap-2">
                                <span className="text-xs font-medium text-green-600 min-w-[60px]">상호명</span>
                                <span className="text-sm text-green-900">{ocrResult.extractedInfo.company_name}</span>
                              </div>
                            )}
                            {ocrResult.extractedInfo.representative && (
                              <div className="flex gap-2">
                                <span className="text-xs font-medium text-green-600 min-w-[60px]">대표자</span>
                                <span className="text-sm text-green-900">{ocrResult.extractedInfo.representative}</span>
                              </div>
                            )}
                            {ocrResult.extractedInfo.business_number && (
                              <div className="flex gap-2">
                                <span className="text-xs font-medium text-green-600 min-w-[60px]">사업자번호</span>
                                <span className="text-sm text-green-900 font-mono">{ocrResult.extractedInfo.business_number}</span>
                              </div>
                            )}
                            {ocrResult.extractedInfo.phone && (
                              <div className="flex gap-2">
                                <span className="text-xs font-medium text-green-600 min-w-[60px]">전화번호</span>
                                <span className="text-sm text-green-900">{ocrResult.extractedInfo.phone}</span>
                              </div>
                            )}
                            {ocrResult.extractedInfo.email && (
                              <div className="flex gap-2">
                                <span className="text-xs font-medium text-green-600 min-w-[60px]">이메일</span>
                                <span className="text-sm text-green-900">{ocrResult.extractedInfo.email}</span>
                              </div>
                            )}
                            {ocrResult.extractedInfo.address && (
                              <div className="flex gap-2 sm:col-span-2">
                                <span className="text-xs font-medium text-green-600 min-w-[60px]">주소</span>
                                <span className="text-sm text-green-900">{ocrResult.extractedInfo.address}</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-2">
                            <button
                              onClick={saveOcrAsMyInfo}
                              disabled={savingMyInfo}
                              className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {savingMyInfo ? (
                                <><Loader2 size={16} className="animate-spin" /> 저장 중...</>
                              ) : (
                                <><User size={16} /> 내 정보로 저장</>
                              )}
                            </button>
                            <button
                              onClick={saveOcrAsContact}
                              disabled={savingContact}
                              className="px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {savingContact ? (
                                <><Loader2 size={16} className="animate-spin" /> 저장 중...</>
                              ) : (
                                <><Users size={16} /> 거래처로 등록</>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                      <details className="bg-gray-50 border border-gray-200 rounded-xl">
                        <summary className="px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 rounded-xl">
                          전체 인식 텍스트 보기 ({ocrResult.fieldCount}개 항목)
                        </summary>
                        <div className="px-4 pb-4">
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{ocrResult.fullText}</p>
                        </div>
                      </details>
                    </div>
                  )}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => { setCapturedImage(null); setOcrResult(null); setExtractedText(null); startCamera() }}
                      className="px-5 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      다시 촬영
                    </button>
                    <button
                      onClick={resetUpload}
                      className="px-5 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Multi File OCR Results */}
        {multiOcrResults.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon size={16} className="text-blue-600" />
                <h2 className="text-sm font-semibold text-gray-800">
                  다중 이미지 OCR 결과
                  <span className="ml-2 text-xs font-normal text-gray-400">({multiOcrResults.length}건)</span>
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={saveAllMultiAsContact}
                  disabled={multiOcrResults.some(i => i.loading)}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <Users size={12} /> 전체 거래처 등록
                </button>
                <button
                  onClick={() => { setMultiFiles([]); setMultiOcrResults([]) }}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  전체 삭제
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {multiOcrResults.map((item, idx) => (
                <div key={idx} className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{idx + 1}</span>
                    <span className="text-sm font-medium text-gray-700 truncate">{item.file.name}</span>
                    {item.loading && <Loader2 size={14} className="text-blue-600 animate-spin" />}
                    {item.saved === 'contact' && <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">거래처 저장됨</span>}
                    {item.saved === 'myinfo' && <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">내 정보 저장됨</span>}
                  </div>
                  {item.result && Object.keys(item.result.extractedInfo).length > 0 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-sm">
                        {item.result.extractedInfo.company_name && (
                          <div><span className="text-xs text-gray-400">상호명</span> <span className="font-medium">{item.result.extractedInfo.company_name}</span></div>
                        )}
                        {item.result.extractedInfo.representative && (
                          <div><span className="text-xs text-gray-400">대표자</span> <span className="font-medium">{item.result.extractedInfo.representative}</span></div>
                        )}
                        {item.result.extractedInfo.business_number && (
                          <div><span className="text-xs text-gray-400">사업자번호</span> <span className="font-medium font-mono">{item.result.extractedInfo.business_number}</span></div>
                        )}
                        {item.result.extractedInfo.phone && (
                          <div><span className="text-xs text-gray-400">전화</span> <span className="font-medium">{item.result.extractedInfo.phone}</span></div>
                        )}
                        {item.result.extractedInfo.email && (
                          <div><span className="text-xs text-gray-400">이메일</span> <span className="font-medium">{item.result.extractedInfo.email}</span></div>
                        )}
                        {item.result.extractedInfo.address && (
                          <div className="sm:col-span-3"><span className="text-xs text-gray-400">주소</span> <span className="font-medium">{item.result.extractedInfo.address}</span></div>
                        )}
                      </div>
                      {!item.saved && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveMultiAsMyInfo(idx)}
                            className="flex-1 px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                          >
                            <User size={14} /> 내 정보로 저장
                          </button>
                          <button
                            onClick={() => saveMultiAsContact(idx)}
                            className="flex-1 px-3 py-2 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                          >
                            <Users size={14} /> 거래처로 등록
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {item.result && Object.keys(item.result.extractedInfo).length === 0 && (
                    <p className="text-sm text-gray-400">인식된 정보가 없습니다.</p>
                  )}
                  {!item.loading && !item.result && (
                    <p className="text-sm text-red-400">OCR 처리에 실패했습니다.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload History */}
        {uploadHistory.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-800">업로드 기록</h2>
              </div>
              <button
                onClick={() => {
                  setUploadHistory([])
                  localStorage.removeItem('upload_history')
                }}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                기록 삭제
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {uploadHistory.map((item) => (
                <div key={item.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    {item.status === 'success' ? (
                      <CheckCircle2 size={16} className="text-green-500" />
                    ) : (
                      <AlertCircle size={16} className="text-red-500" />
                    )}
                    <div>
                      <p className="text-sm text-gray-800">{item.fileName}</p>
                      <p className="text-xs text-gray-400">
                        {item.fileType} / {item.rowCount}건
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {format(new Date(item.createdAt), 'yyyy-MM-dd HH:mm')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
