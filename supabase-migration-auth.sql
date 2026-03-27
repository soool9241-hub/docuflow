-- DocuFlow 사용자 인증 마이그레이션 (User Authentication Migration)
-- 기존 스키마에 사용자 인증을 추가하는 마이그레이션입니다.
-- Supabase SQL Editor에서 실행하세요.

-- 1. 기존 테이블에 user_id 컬럼 추가
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE chat_history ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. user_id 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);

-- 3. 기존 unique 제약조건을 사용자별 unique로 변경
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_document_number_key;
ALTER TABLE documents ADD CONSTRAINT documents_user_document_number_key UNIQUE (user_id, document_number);

ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_key_key;
ALTER TABLE settings ADD CONSTRAINT settings_user_key_key UNIQUE (user_id, key);

ALTER TABLE contacts ADD CONSTRAINT contacts_user_business_number_key UNIQUE (user_id, business_number);

-- 4. RLS 활성화
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 5. contacts RLS 정책
CREATE POLICY "contacts_select_own" ON contacts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "contacts_insert_own" ON contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contacts_update_own" ON contacts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contacts_delete_own" ON contacts
  FOR DELETE USING (auth.uid() = user_id);

-- 6. documents RLS 정책
CREATE POLICY "documents_select_own" ON documents
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "documents_insert_own" ON documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "documents_update_own" ON documents
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "documents_delete_own" ON documents
  FOR DELETE USING (auth.uid() = user_id);

-- 7. chat_history RLS 정책
CREATE POLICY "chat_history_select_own" ON chat_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "chat_history_insert_own" ON chat_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_history_update_own" ON chat_history
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_history_delete_own" ON chat_history
  FOR DELETE USING (auth.uid() = user_id);

-- 8. settings RLS 정책
CREATE POLICY "settings_select_own" ON settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "settings_insert_own" ON settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "settings_update_own" ON settings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "settings_delete_own" ON settings
  FOR DELETE USING (auth.uid() = user_id);

-- 9. company_profiles 테이블 생성
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

-- 10. 사용자 가입 시 company_profiles 자동 생성 트리거
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
