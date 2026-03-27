# DocuFlow - 서류 처리 자동화 시스템 지침서

## 1. 시스템 개요

DocuFlow는 한국 비즈니스 서류(견적서, 거래명세서, 세금계산서 등)를 자동으로 작성하고 발송하는 Next.js 기반 웹 애플리케이션입니다.

### 지원 서류 유형
| 유형 | 코드 | 서류번호 접두사 |
|------|------|----------------|
| 견적서 | quotation | QT |
| 거래명세서 | transaction_statement | TS |
| 세금계산서 | tax_invoice | TI |
| 영수증 | receipt | RC |
| 계약서 | contract | CT |
| 동의서 | consent | CS |
| 발주서 | purchase_order | PO |
| 납품서 | delivery_note | DN |

### 핵심 기능
- **서류 작성**: 단계별 폼으로 8종 서류 작성
- **AI 대화 작성**: AI와 대화하며 요구사항을 말하면 자동 서류 생성
- **거래처 관리**: 거래처 정보 CRUD
- **데이터 업로드**: CSV 파일/사진으로 거래처 데이터 일괄 등록
- **문자 발송**: Solapi 연동으로 SMS 발송
- **이메일 발송**: SMTP 연동으로 이메일 발송
- **PDF 미리보기**: 한국식 비즈니스 서류 양식으로 미리보기

---

## 2. 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS 4 |
| 데이터베이스 | Supabase (PostgreSQL) |
| SMS | Solapi |
| 이메일 | Nodemailer (SMTP) |
| AI | OpenAI API (호환 API 가능) |
| 아이콘 | Lucide React |
| 상태관리 | React useState + Zustand |
| 날짜 | date-fns |
| 알림 | react-hot-toast |

---

## 3. 프로젝트 구조

```
docuflow/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # 루트 레이아웃 (Sidebar + Header)
│   │   ├── page.tsx                # / → /dashboard 리다이렉트
│   │   ├── globals.css             # Tailwind + 커스텀 스타일
│   │   ├── dashboard/page.tsx      # 대시보드 (통계, 최근 서류)
│   │   ├── contacts/
│   │   │   ├── page.tsx            # 거래처 관리 (CRUD)
│   │   │   └── loading.tsx         # 로딩 스켈레톤
│   │   ├── documents/
│   │   │   ├── page.tsx            # 서류 목록 (필터, 검색, 페이지네이션)
│   │   │   ├── new/page.tsx        # 새 서류 작성 (5단계 위저드)
│   │   │   └── [id]/page.tsx       # 서류 상세보기 + 발송
│   │   ├── chat/page.tsx           # AI 대화 서류 작성
│   │   ├── upload/page.tsx         # 데이터 업로드 (CSV/카메라)
│   │   ├── settings/page.tsx       # 설정 (회사정보, API키 등)
│   │   └── api/
│   │       ├── documents/
│   │       │   ├── route.ts        # GET(목록), POST(생성)
│   │       │   └── [id]/route.ts   # GET/PUT/DELETE (단일 서류)
│   │       ├── contacts/
│   │       │   ├── route.ts        # GET(목록), POST(생성)
│   │       │   └── [id]/route.ts   # GET/PUT/DELETE (단일 거래처)
│   │       ├── chat/route.ts       # AI 대화 API
│   │       ├── send/
│   │       │   ├── route.ts        # 서류 발송 (SMS/Email)
│   │       │   ├── sms/route.ts    # 직접 SMS 발송
│   │       │   └── email/route.ts  # 직접 이메일 발송
│   │       └── upload/route.ts     # 파일 업로드
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx         # 좌측 네비게이션
│   │   │   └── Header.tsx          # 상단 헤더
│   │   ├── ui/
│   │   │   ├── Button.tsx          # 버튼 (primary/secondary/danger/success)
│   │   │   ├── Input.tsx           # 입력 필드
│   │   │   ├── Select.tsx          # 셀렉트 드롭다운
│   │   │   ├── Modal.tsx           # 모달 다이얼로그
│   │   │   ├── Card.tsx            # 카드
│   │   │   ├── Badge.tsx           # 뱃지 (상태, 서류유형)
│   │   │   └── Table.tsx           # 테이블
│   │   ├── documents/
│   │   │   ├── DocumentPreview.tsx  # 서류 미리보기 (한국식 양식)
│   │   │   └── ItemsEditor.tsx      # 품목 편집기
│   │   └── chat/
│   │       ├── ChatMessage.tsx     # 채팅 메시지 버블
│   │       └── ChatInput.tsx       # 채팅 입력
│   ├── lib/
│   │   ├── supabase.ts             # Supabase 클라이언트
│   │   ├── solapi.ts               # Solapi SMS 클라이언트
│   │   └── email.ts                # Nodemailer 이메일 클라이언트
│   ├── templates/
│   │   └── document-html.ts        # HTML 서류 템플릿 (이메일용)
│   └── types/
│       ├── index.ts                # 타입 정의 + 상수
│       └── database.ts             # Supabase DB 타입
├── .env.local                      # 환경변수 (API키 등)
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
└── package.json
```

---

## 4. 설치 및 실행

### 4.1 사전 요구사항
- Node.js 18+
- Supabase 프로젝트 (https://supabase.com)
- Solapi 계정 (https://solapi.com) - SMS용
- Gmail 앱 비밀번호 (이메일용)
- OpenAI API 키 (AI 대화용)

### 4.2 설치
```bash
cd docuflow
npm install
```

### 4.3 환경변수 설정
`.env.local` 파일을 수정하세요:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Solapi (SMS)
SOLAPI_API_KEY=your_api_key
SOLAPI_API_SECRET=your_api_secret
SOLAPI_SENDER_PHONE=01012345678

# SMTP (이메일)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# AI (OpenAI 호환)
OPENAI_API_KEY=sk-...
```

### 4.4 Supabase 테이블 생성
Supabase SQL Editor에서 `supabase-schema.sql` 파일의 내용을 실행하세요.

### 4.5 개발 서버 실행
```bash
npm run dev
```
http://localhost:3000 에서 접속

### 4.6 프로덕션 빌드
```bash
npm run build
npm start
```

---

## 5. 사용 가이드

### 5.1 초기 설정
1. `/settings`에서 회사 정보 입력 (상호, 대표자, 사업자번호 등)
2. API 키 설정 확인

### 5.2 거래처 등록
- `/contacts`에서 수동 등록
- `/upload`에서 CSV 파일로 일괄 등록
- CSV 형식: 상호명, 대표자, 사업자번호, 이메일, 전화번호, 주소

### 5.3 서류 작성 (수동)
1. `/documents/new`로 이동
2. 서류 종류 선택 (견적서, 거래명세서 등)
3. 거래처 선택 또는 직접 입력
4. 품목 입력 (품목명, 규격, 수량, 단가 → 자동 계산)
5. 추가 정보 입력 (제목, 비고)
6. 미리보기 확인 후 저장

### 5.4 AI 대화로 서류 작성
1. `/chat`으로 이동
2. 자연어로 요구사항 입력
   - 예: "ABC전자에 노트북 10대, 대당 120만원으로 견적서 작성해줘"
   - 예: "지난번 거래처한테 세금계산서 발행해줘"
3. AI가 추가 질문 → 답변
4. 서류 미리보기 확인 후 저장

### 5.5 서류 발송
1. `/documents`에서 서류 선택
2. "문자 발송" 또는 "이메일 발송" 클릭
3. 수신자 정보 입력
4. 발송 완료 → 상태 자동 업데이트

---

## 6. API 엔드포인트

### 서류 API
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/documents | 서류 목록 (type, status, search, page, limit) |
| POST | /api/documents | 새 서류 생성 |
| GET | /api/documents/:id | 서류 상세 |
| PUT | /api/documents/:id | 서류 수정 |
| DELETE | /api/documents/:id | 서류 삭제 |

### 거래처 API
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/contacts | 거래처 목록 (search) |
| POST | /api/contacts | 새 거래처 생성 |
| GET | /api/contacts/:id | 거래처 상세 |
| PUT | /api/contacts/:id | 거래처 수정 |
| DELETE | /api/contacts/:id | 거래처 삭제 |

### 발송 API
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /api/send | 서류 발송 (document_id, method, recipient) |
| POST | /api/send/sms | 직접 SMS 발송 (to, message) |
| POST | /api/send/email | 직접 이메일 발송 (to, subject, html) |

### 기타 API
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /api/chat | AI 대화 |
| POST | /api/upload | 파일 업로드 |

---

## 7. 서류번호 체계

자동 생성 형식: `{타입코드}-{날짜}-{순번}`

예시:
- `QT-20260327-001` (견적서 2026년 3월 27일 첫 번째)
- `TS-20260327-002` (거래명세서)
- `TI-20260327-001` (세금계산서)

---

## 8. Supabase 테이블 구조

### contacts (거래처)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 고유 ID |
| company_name | text | 회사명 |
| representative | text | 대표자 |
| business_number | text | 사업자번호 |
| email | text | 이메일 |
| phone | text | 전화번호 |
| address | text | 주소 |
| memo | text | 메모 |
| created_at | timestamptz | 생성일 |
| updated_at | timestamptz | 수정일 |

### documents (서류)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 고유 ID |
| type | text | 서류 유형 |
| title | text | 제목 |
| document_number | text | 서류번호 |
| contact_id | uuid (FK) | 거래처 ID |
| issuer_info | jsonb | 발행인 정보 |
| receiver_info | jsonb | 수신인 정보 |
| items | jsonb | 품목 목록 |
| total_amount | numeric | 총 금액 |
| tax_amount | numeric | 세액 |
| notes | text | 비고 |
| status | text | 상태 (draft/sent/confirmed) |
| sent_via | text | 발송 수단 (sms/email) |
| sent_at | timestamptz | 발송 시각 |
| created_at | timestamptz | 생성일 |
| updated_at | timestamptz | 수정일 |

### chat_history (AI 대화 기록)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 고유 ID |
| role | text | 역할 (user/assistant) |
| content | text | 메시지 내용 |
| document_id | uuid (FK) | 관련 서류 ID |
| created_at | timestamptz | 생성일 |

### settings (설정)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 고유 ID |
| key | text (unique) | 설정 키 |
| value | jsonb | 설정 값 |
| updated_at | timestamptz | 수정일 |

---

## 9. 트러블슈팅

### Supabase 연결 오류
- `.env.local`의 URL과 Key가 올바른지 확인
- Supabase 대시보드 → Settings → API에서 확인

### SMS 발송 실패
- Solapi 대시보드에서 API 키 확인
- 발신번호가 등록되어 있는지 확인 (사전 등록 필수)

### 이메일 발송 실패
- Gmail 사용 시 "앱 비밀번호" 필요 (2단계 인증 활성화 후 생성)
- SMTP 포트 587 확인

### AI 대화 오류
- OpenAI API 키 확인
- API 키 없으면 데모 모드로 작동

---

## 10. 확장 가이드

### 새 서류 유형 추가
1. `src/types/index.ts`의 `DocumentType`에 추가
2. `DOCUMENT_TYPE_LABELS`에 한글 라벨 추가
3. `src/app/api/documents/route.ts`의 `TYPE_PREFIXES`에 접두사 추가
4. `src/templates/document-html.ts`에 양식 추가

### 외부 서비스 연동
- 카카오 알림톡: Solapi에서 카카오 채널 연동 가능
- 전자세금계산서: 국세청 홈택스 API 연동 필요
- OCR: Google Vision API 또는 Naver Clova OCR 연동
