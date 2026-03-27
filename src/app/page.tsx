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
  Clock,
  TrendingDown,
  Timer,
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

const TIME_COMPARISONS = [
  { task: '견적서 1건 작성', before: '30분', after: '2분', saved: '93%' },
  { task: '거래처 10곳 등록', before: '1시간', after: '3분', saved: '95%' },
  { task: '세금계산서 발송', before: '20분', after: '30초', saved: '97%' },
  { task: '명함 정보 입력', before: '5분', after: '10초', saved: '97%' },
]

export default function LandingPage() {
  const { user } = useAuth()

  const ctaButton = (size: 'lg' | 'xl' = 'lg') => (
    <Link
      href={user ? '/dashboard' : '/signup'}
      className={`group relative inline-flex items-center justify-center gap-2 font-bold text-white rounded-2xl transition-all duration-300 ${
        size === 'xl'
          ? 'px-12 py-5 text-xl'
          : 'px-8 py-4 text-base'
      } bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 hover:from-blue-700 hover:via-blue-600 hover:to-purple-700 shadow-xl shadow-blue-300/50 hover:shadow-2xl hover:shadow-blue-400/60 hover:scale-105 active:scale-100`}
    >
      <span className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <span className="relative flex items-center gap-2">
        {user ? '대시보드로 이동' : '지금 무료로 시작하기'}
        <ArrowRight size={size === 'xl' ? 22 : 18} className="group-hover:translate-x-1 transition-transform duration-300" />
      </span>
    </Link>
  )

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <FileText size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">문서친구</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all"
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
                  className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all hover:scale-105"
                >
                  무료 시작
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 sm:pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-100/40 to-purple-100/40 rounded-full blur-3xl -z-10" />

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-full text-sm font-medium mb-6 border border-blue-100">
            <Sparkles size={16} className="text-purple-500" />
            AI 기반 문서 자동화 시스템
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            서류 업무 시간을
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              90% 줄여드립니다
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-4 leading-relaxed">
            견적서 30분 → 2분. 세금계산서 발송 20분 → 30초.
            <br className="hidden sm:block" />
            AI가 서류를 작성하고, 원클릭으로 발송합니다.
          </p>

          {/* Time saving highlight */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-50 border border-green-200 rounded-full text-green-700 font-semibold text-sm mb-10">
            <Timer size={16} className="text-green-600" />
            월 평균 40시간 절약
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            {ctaButton('xl')}
          </div>
          <p className="text-sm text-gray-400">가입 즉시 사용 가능 &middot; 설치 불필요 &middot; 모바일 완벽 지원</p>
        </div>
      </section>

      {/* Time Saving Comparison - NEW SECTION */}
      <section className="py-16 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-sm font-bold mb-4">
              <Clock size={16} />
              이 시간, 아직도 낭비하고 계신가요?
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
              Before vs After
            </h2>
            <p className="text-gray-500">문서친구 도입 전후 실제 업무 시간 비교</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TIME_COMPARISONS.map((item) => (
              <div key={item.task} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all">
                <p className="text-sm font-bold text-gray-800 mb-4">{item.task}</p>
                <div className="space-y-3">
                  {/* Before */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-red-500 w-14 flex-shrink-0">Before</span>
                    <div className="flex-1 relative">
                      <div className="h-8 bg-red-100 rounded-lg w-full flex items-center px-3">
                        <span className="text-sm font-bold text-red-600">{item.before}</span>
                      </div>
                    </div>
                  </div>
                  {/* After */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-blue-500 w-14 flex-shrink-0">After</span>
                    <div className="flex-1 relative">
                      <div className="h-8 bg-blue-100 rounded-lg flex items-center px-3" style={{ width: `${100 - parseInt(item.saved)}%`, minWidth: '60px' }}>
                        <span className="text-sm font-bold text-blue-600">{item.after}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end gap-1">
                  <TrendingDown size={14} className="text-green-600" />
                  <span className="text-sm font-extrabold text-green-600">{item.saved} 절감</span>
                </div>
              </div>
            ))}
          </div>

          {/* CTA after comparison */}
          <div className="mt-10 text-center">
            <p className="text-gray-500 mb-4 font-medium">아직도 수작업으로 서류를 만드시나요?</p>
            {ctaButton()}
          </div>
        </div>
      </section>

      {/* Document Types Banner */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-center text-sm font-medium text-gray-400 mb-6">지원하는 서류 8종</p>
          <div className="flex flex-wrap justify-center gap-3">
            {DOCUMENT_TYPES.map((type) => (
              <span
                key={type}
                className="px-5 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-full text-sm font-bold text-gray-700 shadow-sm hover:shadow-md hover:border-blue-200 hover:text-blue-600 transition-all cursor-default"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 bg-gray-50">
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
                className="p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-xl hover:border-blue-100 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color} group-hover:scale-110 transition-transform duration-300`}>
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
      <section className="py-20 px-4 sm:px-6 bg-white">
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
                <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center h-full hover:shadow-lg hover:border-blue-100 transition-all duration-300">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200/50">
                    <span className="text-white font-extrabold text-lg">{s.step}</span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500">{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ArrowRight size={18} className="text-blue-300" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA after steps */}
          <div className="mt-12 text-center">
            {ctaButton()}
          </div>
        </div>
      </section>

      {/* Big Time Saving Banner */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl mb-6">
              <Clock size={40} className="text-white" />
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-4">
              매달 <span className="text-yellow-300">40시간</span>을 돌려받으세요
            </h2>
            <p className="text-xl text-blue-100 mb-2">서류 1건당 평균 28분 절약</p>
            <p className="text-blue-200">하루 10건이면 하루 4.5시간, 한 달이면 40시간입니다</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {[
              { num: '2분', label: '견적서 작성', sub: '기존 30분' },
              { num: '30초', label: '서류 발송', sub: '기존 20분' },
              { num: '10초', label: '명함 등록', sub: '기존 5분' },
              { num: '3분', label: '거래처 10곳', sub: '기존 1시간' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <p className="text-2xl sm:text-3xl font-extrabold text-yellow-300 mb-1">{stat.num}</p>
                <p className="text-sm font-bold text-white mb-0.5">{stat.label}</p>
                <p className="text-xs text-blue-200 line-through">{stat.sub}</p>
              </div>
            ))}
          </div>

          <Link
            href={user ? '/dashboard' : '/signup'}
            className="group relative inline-flex items-center justify-center gap-3 px-12 py-5 text-xl font-extrabold rounded-2xl transition-all duration-300 bg-white text-blue-700 hover:bg-yellow-300 hover:text-blue-800 shadow-2xl shadow-black/20 hover:shadow-yellow-300/30 hover:scale-105 active:scale-100"
          >
            <span className="relative flex items-center gap-2">
              {user ? '대시보드로 이동' : '40시간 돌려받기'}
              <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform duration-300" />
            </span>
          </Link>
          <p className="mt-4 text-sm text-blue-200">무료로 시작하세요. 카드 등록 없음.</p>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">왜 문서친구인가요?</h2>
            <p className="text-gray-500 text-base">소규모 사업자를 위한 최적의 솔루션</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { text: '모바일에서도 완벽하게 작동', highlight: true },
              { text: 'AI가 대화형으로 서류 작성 도우미', highlight: true },
              { text: '카메라로 명함 촬영 즉시 등록', highlight: false },
              { text: 'SMS/이메일 원클릭 발송', highlight: false },
              { text: '사용자별 데이터 완전 분리', highlight: false },
              { text: '8종 한국 비즈니스 서류 지원', highlight: false },
              { text: 'AI가 서류 오류 자동 검토', highlight: true },
              { text: '자주 쓰는 서류 템플릿 저장', highlight: false },
            ].map((item) => (
              <div key={item.text} className={`flex items-center gap-3 p-4 rounded-xl transition-all ${item.highlight ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'}`}>
                <CheckCircle2 size={20} className={`flex-shrink-0 ${item.highlight ? 'text-blue-600' : 'text-green-500'}`} />
                <span className={`text-sm sm:text-base font-medium ${item.highlight ? 'text-blue-800' : 'text-gray-700'}`}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 sm:px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="p-4">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Zap size={22} className="text-yellow-500" />
                <span className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">8</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-500">지원 서류 종류</p>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-center gap-1 mb-2">
                <TrendingDown size={22} className="text-green-500" />
                <span className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">93%</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-500">업무 시간 절감</p>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Shield size={22} className="text-blue-500" />
                <span className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">100%</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-500">데이터 보안</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            서류 업무에 쓰는 시간,
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">이제 그만 낭비하세요</span>
          </h2>
          <p className="text-lg text-gray-500 mb-10">
            30초 가입이면 충분합니다. 지금 바로 시작하세요.
          </p>
          {ctaButton('xl')}
          <p className="mt-4 text-sm text-gray-400">설치 불필요 &middot; 모바일 지원 &middot; 무료</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 sm:px-6 border-t border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
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
