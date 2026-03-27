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
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

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
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) processFile(droppedFile)
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
        // Placeholder OCR
        setExtractedText('이미지에서 텍스트를 추출하려면 OCR 서비스 연동이 필요합니다.\n\n현재는 미리보기만 지원됩니다.')
      }
      reader.readAsDataURL(f)
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
      setExtractedText('촬영한 이미지에서 텍스트를 추출하려면 OCR 서비스 연동이 필요합니다.\n\n현재는 미리보기만 지원됩니다.')
      stopCamera()
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
            CSV 파일이나 이미지를 업로드하여 거래처 정보를 한 번에 등록할 수 있습니다.
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
                  onChange={handleFileSelect}
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
                      CSV, JPG, PNG, GIF, WebP (최대 10MB)
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
                    {extractedText && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <p className="text-sm font-medium text-yellow-800 mb-2">OCR 텍스트 추출</p>
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
                  {extractedText && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <p className="text-sm font-medium text-yellow-800 mb-2">OCR 텍스트 추출</p>
                      <p className="text-sm text-yellow-700 whitespace-pre-wrap">{extractedText}</p>
                    </div>
                  )}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => { setCapturedImage(null); setExtractedText(null); startCamera() }}
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
