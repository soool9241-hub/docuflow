-- User files table for storing uploaded documents (base64 encoded)
CREATE TABLE IF NOT EXISTS user_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_data TEXT NOT NULL,
  category TEXT DEFAULT '기타',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_files_user_id ON user_files(user_id);
ALTER TABLE user_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own files" ON user_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own files" ON user_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own files" ON user_files FOR DELETE USING (auth.uid() = user_id);
