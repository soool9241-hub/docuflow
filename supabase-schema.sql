-- DocuFlow 서류 자동화 시스템 - Supabase 스키마
-- Supabase SQL Editor에서 실행하세요

-- 1. 거래처 테이블
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  representative TEXT NOT NULL,
  business_number TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 서류 테이블
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN (
    'quotation', 'transaction_statement', 'tax_invoice', 'receipt',
    'contract', 'consent', 'purchase_order', 'delivery_note'
  )),
  title TEXT NOT NULL,
  document_number TEXT NOT NULL UNIQUE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  issuer_info JSONB DEFAULT '{}',
  receiver_info JSONB DEFAULT '{}',
  items JSONB DEFAULT '[]',
  total_amount NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed')),
  sent_via TEXT CHECK (sent_via IN ('sms', 'email')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AI 대화 기록 테이블
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 설정 테이블
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_contact_id ON documents(contact_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_document_number ON documents(document_number);
CREATE INDEX IF NOT EXISTS idx_contacts_company_name ON contacts(company_name);
CREATE INDEX IF NOT EXISTS idx_contacts_business_number ON contacts(business_number);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- 6. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 7. RLS (Row Level Security) 정책
-- 필요에 따라 활성화하세요. 기본은 비활성화 상태입니다.
-- ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 8. 초기 회사 설정 데이터 (선택)
INSERT INTO settings (key, value) VALUES
  ('company_info', '{
    "company_name": "",
    "representative": "",
    "business_number": "",
    "business_type": "",
    "business_category": "",
    "address": "",
    "phone": "",
    "email": ""
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 9. 사용자 인증 마이그레이션 (User Authentication Migration)
-- ============================================================

-- 9-1. 기존 테이블에 user_id 컬럼 추가
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE chat_history ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- 9-2. user_id 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);

-- 9-3. 기존 unique 제약조건을 사용자별 unique로 변경
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_document_number_key;
ALTER TABLE documents ADD CONSTRAINT documents_user_document_number_key UNIQUE (user_id, document_number);

ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_key_key;
ALTER TABLE settings ADD CONSTRAINT settings_user_key_key UNIQUE (user_id, key);

ALTER TABLE contacts ADD CONSTRAINT contacts_user_business_number_key UNIQUE (user_id, business_number);

-- 9-4. RLS 활성화
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 9-5. contacts RLS 정책
CREATE POLICY "contacts_select_own" ON contacts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "contacts_insert_own" ON contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contacts_update_own" ON contacts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contacts_delete_own" ON contacts
  FOR DELETE USING (auth.uid() = user_id);

-- 9-6. documents RLS 정책
CREATE POLICY "documents_select_own" ON documents
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "documents_insert_own" ON documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "documents_update_own" ON documents
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "documents_delete_own" ON documents
  FOR DELETE USING (auth.uid() = user_id);

-- 9-7. chat_history RLS 정책
CREATE POLICY "chat_history_select_own" ON chat_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "chat_history_insert_own" ON chat_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_history_update_own" ON chat_history
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_history_delete_own" ON chat_history
  FOR DELETE USING (auth.uid() = user_id);

-- 9-8. settings RLS 정책
CREATE POLICY "settings_select_own" ON settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "settings_insert_own" ON settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "settings_update_own" ON settings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "settings_delete_own" ON settings
  FOR DELETE USING (auth.uid() = user_id);

-- 9-9. company_profiles 테이블 생성
CREATE TABLE IF NOT EXISTS company_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  representative TEXT,
  business_number TEXT,
  business_type TEXT,
  business_category TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_profiles_user_id ON company_profiles(user_id);

-- company_profiles updated_at 트리거
CREATE OR REPLACE TRIGGER company_profiles_updated_at
  BEFORE UPDATE ON company_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- company_profiles RLS
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_profiles_select_own" ON company_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "company_profiles_insert_own" ON company_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "company_profiles_update_own" ON company_profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "company_profiles_delete_own" ON company_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- 9-10. 사용자 가입 시 company_profiles 자동 생성 트리거
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.company_profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 10. 문서 템플릿 테이블 (Document Templates)
-- ============================================================

CREATE TABLE IF NOT EXISTS document_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  items JSONB DEFAULT '[]',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_user_id ON document_templates(user_id);

CREATE OR REPLACE TRIGGER document_templates_updated_at
  BEFORE UPDATE ON document_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates" ON document_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own templates" ON document_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON document_templates FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON document_templates FOR DELETE USING (auth.uid() = user_id);
