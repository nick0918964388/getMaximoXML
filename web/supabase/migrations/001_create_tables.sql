-- Migration 001: Create all tables for Supabase migration
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- =============================================
-- Table: projects (replaces SQLite)
-- =============================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  fields JSONB DEFAULT '[]',
  detail_table_configs JSONB DEFAULT '[]',
  dialog_templates JSONB DEFAULT '[]',
  sub_tab_configs JSONB DEFAULT '[]',
  main_detail_labels JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Table: drafts (replaces maximo-xml-generator-draft localStorage)
-- =============================================
CREATE TABLE drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  fields JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  detail_table_configs JSONB DEFAULT '[]',
  dialog_templates JSONB DEFAULT '[]',
  sub_tab_configs JSONB DEFAULT '[]',
  main_detail_labels JSONB DEFAULT '{}',
  project_id UUID,
  project_name TEXT,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own draft" ON drafts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own draft" ON drafts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own draft" ON drafts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own draft" ON drafts
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Table: dbc_builder_states (replaces dbc-builder-state localStorage)
-- =============================================
CREATE TABLE dbc_builder_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  script JSONB DEFAULT '{}',
  checks JSONB DEFAULT '{}',
  operations JSONB DEFAULT '[]',
  selected_id TEXT,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE dbc_builder_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dbc state" ON dbc_builder_states
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dbc state" ON dbc_builder_states
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dbc state" ON dbc_builder_states
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own dbc state" ON dbc_builder_states
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Table: fmb_upload_history (replaces fmb-upload-history:{user} localStorage)
-- =============================================
CREATE TABLE fmb_upload_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  module_name TEXT,
  field_count INT DEFAULT 0,
  xml_content TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fmb_history_user_id ON fmb_upload_history(user_id);

ALTER TABLE fmb_upload_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fmb history" ON fmb_upload_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fmb history" ON fmb_upload_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own fmb history" ON fmb_upload_history
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Trigger: Cap fmb_upload_history at 20 per user
-- =============================================
CREATE OR REPLACE FUNCTION cap_fmb_history()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM fmb_upload_history
  WHERE id IN (
    SELECT id FROM fmb_upload_history
    WHERE user_id = NEW.user_id
    ORDER BY uploaded_at DESC
    OFFSET 20
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cap_fmb_history
AFTER INSERT ON fmb_upload_history
FOR EACH ROW EXECUTE FUNCTION cap_fmb_history();
