-- Upload history table
CREATE TABLE IF NOT EXISTS upload_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  row_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_upload_history_user_id ON upload_history(user_id);
ALTER TABLE upload_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own upload history" ON upload_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own upload history" ON upload_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own upload history" ON upload_history FOR DELETE USING (auth.uid() = user_id);
