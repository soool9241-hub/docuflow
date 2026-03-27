'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import {
  FileText,
  MessageSquare,
  Camera,
  Send,
  Users,
  BarChart3,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

const FEATURES = [
  {
    icon: FileText,
    title: '8종 서류 자동 생성',
    desc: '견적서, 거래명세서, 세금계산서, 영수증, 계약서, 동의서, 발주서, 납품서를 한 번에',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: MessageSquare,
    title: 'AI 채팅으로 서류 작성',
    desc: '대화하듯 정보를 입력하면 AI가 자동으로 서류를 완성해드립니다',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: Camera,
    title: 'OCR 명함/서류 인식',
    desc: '사진 한 장으로 거래처 정보를 자동 추출하고 등록합니다',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: Send,
    title: 'SMS/이메일 발송',
    desc: '작성한 서류를 SMS나 이메일로 바로 거래처에 전송합니다',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    icon: Users,
    title: '거래처 관리',
    desc: 'CSV 업로드, OCR, 수동 입력으로 거래처를 쉽게 관리합니다',
    color: 'bg-pink-100 text-pink-600',
  },
  {
    icon: Shield,
    title: '개별 계정 데이터 보호',
    desc: '로그인 기반으로 내 데이터는 나만 볼 수 있습니다',
    color: 'bg-indigo-100 text-indigo-600',
  },
]

const DOCUMENT_TYPES = [
  '견적서', '거래명세서', '세금계산서', '영수증',
  '계약서', '동의서', '발주서', '납품서',
]

const STEPS = [
  { step: '01', title: '회원가입', desc: '이메일로 간편하게 가입하세요' },
  { step: '02', title: '거래처 등록', desc: 'CSV, OCR, 직접 입력 모두 가능' },
  { step: '03', title: '서류 작성', desc: 'AI 채팅 또는 직접 작성' },
  { step: '04', title: '발송', desc: 'SMS/이메일로 바로 전송' },
]

export default function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <FileText size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">문서친구</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
              >
                대시보드
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  무료 시작
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6">
            <Sparkles size={16} />
            AI 기반 문서 자동화 시스템
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            비즈니스 서류,
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              문서친구
            </span>
            에게 맡기세요
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            견적서부터 세금계산서까지 8종 서류를 AI 채팅으로 작성하고,
            <br className="hidden sm:block" />
            SMS/이메일로 바로 발송하세요. 모바일에서도 완벽하게.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={user ? '/dashboard' : '/signup'}
              className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-blue-600 rounded-2xl hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-200 flex items-center justify-center gap-2"
            >
              {user ? '대시보드로 이동' : '무료로 시작하기'}
              <ArrowRight size={18} />
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto px-8 py-4 text-base font-medium text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors text-center"
            >
              기능 둘러보기
            </Link>
          </div>
        </div>
      </section>

      {/* Document Types Banner */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-center text-sm font-medium text-gray-400 mb-6">지원하는 서류</p>
          <div className="flex flex-wrap justify-center gap-3">
            {DOCUMENT_TYPES.map((type) => (
              <span
                key={type}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              올인원 문서 자동화
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              서류 작성부터 발송까지, 모든 과정을 하나의 플랫폼에서
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-lg hover:border-gray-200 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon size={22} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {f.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              4단계로 끝내는 서류 업무
            </h2>
            <p className="text-lg text-gray-500">복잡한 서류 업무, 이제 간단하게</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.step} className="relative">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center h-full">
                  <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-extrabold text-lg">{s.step}</span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500">{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ArrowRight size={18} className="text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-8 sm:p-12 text-white">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">왜 문서친구인가요?</h2>
              <p className="text-blue-100 text-base">소규모 사업자를 위한 최적의 솔루션</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                '모바일에서도 완벽하게 작동',
                'AI가 대화형으로 서류 작성 도우미',
                '카메라로 명함 촬영 즉시 등록',
                'SMS/이메일 원클릭 발송',
                '사용자별 데이터 완전 분리',
                '8종 한국 비즈니스 서류 지원',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-green-300 flex-shrink-0" />
                  <span className="text-sm sm:text-base">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 sm:px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap size={20} className="text-blue-600" />
                <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">8</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500">지원 서류 종류</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <BarChart3 size={20} className="text-blue-600" />
                <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">90%</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500">업무 시간 절감</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Shield size={20} className="text-blue-600" />
                <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">100%</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500">데이터 보안</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-lg text-gray-500 mb-8">
            복잡한 서류 업무에서 벗어나, 문서친구와 함께 스마트하게 일하세요
          </p>
          <Link
            href={user ? '/dashboard' : '/signup'}
            className="inline-flex items-center gap-2 px-10 py-4 text-lg font-semibold text-white bg-blue-600 rounded-2xl hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-200"
          >
            {user ? '대시보드로 이동' : '무료로 시작하기'}
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 sm:px-6 border-t border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-gray-700">문서친구</span>
          </div>
          <p className="text-xs text-gray-400">
            문서처리 올인원 자동화 시스템
          </p>
        </div>
      </footer>
    </div>
  )
}
