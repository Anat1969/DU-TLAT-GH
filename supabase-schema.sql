-- =============================================================================
-- SUPABASE DATABASE SCHEMA
-- 
-- יצור את הטבלאות האלה ישירות בSupabase SQL Editor
-- https://supabase.com/dashboard
--
-- =============================================================================

-- ============================================================================
-- 1. TABLE: concepts
-- ============================================================================
-- שמירת קונספטים / רעיונות עמוקים
-- =============================================================================

CREATE TABLE concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  essence VARCHAR(500) NOT NULL,
  tension VARCHAR(500) NOT NULL,
  medium VARCHAR(255) NOT NULL,
  style VARCHAR(255) NOT NULL,
  references TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Search / Filter
  is_published BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

CREATE INDEX idx_concepts_created_at ON concepts(created_at DESC);
CREATE INDEX idx_concepts_is_published ON concepts(is_published);


-- ============================================================================
-- 2. TABLE: prompts
-- ============================================================================
-- שמירת Midjourney Prompts שנוצרו
-- =============================================================================

CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
  
  -- Generated content
  hebrew_description TEXT NOT NULL,
  midjourney_prompt TEXT NOT NULL,
  why_it_works TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  model VARCHAR(50) DEFAULT 'claude-opus-4-1',
  version INT DEFAULT 1,
  
  -- Status tracking
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP
);

CREATE INDEX idx_prompts_concept_id ON prompts(concept_id);
CREATE INDEX idx_prompts_created_at ON prompts(created_at DESC);
CREATE INDEX idx_prompts_is_used ON prompts(is_used);


-- ============================================================================
-- 3. TABLE: images
-- ============================================================================
-- שמירת תמונות מ-Midjourney
-- =============================================================================

CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
  
  -- Image metadata
  file_path VARCHAR(500) NOT NULL, -- Supabase Storage path
  file_name VARCHAR(255) NOT NULL,
  file_size INT,
  mime_type VARCHAR(50),
  
  -- Image properties
  resolution_width INT,
  resolution_height INT,
  dominant_color VARCHAR(7),
  
  -- Status
  created_at TIMESTAMP DEFAULT NOW(),
  uploaded_at TIMESTAMP,
  
  -- Notes
  notes TEXT
);

CREATE INDEX idx_images_prompt_id ON images(prompt_id);
CREATE INDEX idx_images_concept_id ON images(concept_id);
CREATE INDEX idx_images_created_at ON images(created_at DESC);


-- ============================================================================
-- 4. TABLE: models_3d
-- ============================================================================
-- שמירת מודלים תלת-מימדיים מ-Tripo3D
-- =============================================================================

CREATE TABLE models_3d (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
  
  -- Model metadata
  file_path VARCHAR(500) NOT NULL, -- Supabase Storage path
  file_name VARCHAR(255) NOT NULL,
  file_size INT,
  format VARCHAR(20), -- glb, obj, fbx, etc.
  
  -- Model properties
  vertex_count INT,
  texture_resolution VARCHAR(50),
  has_materials BOOLEAN DEFAULT FALSE,
  
  -- Tripo3D data
  tripo_task_id VARCHAR(255),
  tripo_model_id VARCHAR(255),
  
  -- Status
  created_at TIMESTAMP DEFAULT NOW(),
  generated_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  
  -- Error handling
  error_message TEXT
);

CREATE INDEX idx_models_3d_image_id ON models_3d(image_id);
CREATE INDEX idx_models_3d_concept_id ON models_3d(concept_id);
CREATE INDEX idx_models_3d_status ON models_3d(status);
CREATE INDEX idx_models_3d_created_at ON models_3d(created_at DESC);


-- ============================================================================
-- 5. TABLE: projects
-- ============================================================================
-- ארגון של קונספטים לפרויקטים
-- =============================================================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Properties
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_projects_created_at ON projects(created_at DESC);


-- ============================================================================
-- 6. JUNCTION: project_concepts
-- ============================================================================
-- חיבור בין פרויקטים לקונספטים (many-to-many)
-- =============================================================================

CREATE TABLE project_concepts (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
  
  -- Metadata
  added_at TIMESTAMP DEFAULT NOW(),
  position INT DEFAULT 0, -- order in project
  
  PRIMARY KEY (project_id, concept_id)
);

CREATE INDEX idx_project_concepts_project_id ON project_concepts(project_id);
CREATE INDEX idx_project_concepts_concept_id ON project_concepts(concept_id);


-- ============================================================================
-- 7. TABLE: activity_log
-- ============================================================================
-- רישום של כל הפעילויות
-- =============================================================================

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50), -- concept, prompt, image, model_3d
  entity_id UUID,
  
  -- Details
  details JSONB,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_action ON activity_log(action);


-- ============================================================================
-- VIEWS (optional but useful)
-- ============================================================================

-- View: Full journey from concept to 3D model
CREATE VIEW v_complete_journey AS
SELECT
  c.id as concept_id,
  c.title,
  p.id as prompt_id,
  p.midjourney_prompt,
  i.id as image_id,
  i.file_path as image_path,
  m.id as model_3d_id,
  m.file_path as model_path,
  m.status as model_status,
  c.created_at as concept_created_at,
  p.created_at as prompt_created_at,
  i.created_at as image_created_at,
  m.created_at as model_created_at
FROM concepts c
LEFT JOIN prompts p ON c.id = p.concept_id
LEFT JOIN images i ON p.id = i.prompt_id
LEFT JOIN models_3d m ON i.id = m.image_id
ORDER BY c.created_at DESC;


-- ============================================================================
-- STORAGE BUCKETS (יצור דרך Supabase UI)
-- ============================================================================
-- 
-- Bucket 1: "images"
-- ├── /midjourney/{concept_id}/{timestamp}.png
-- ├── /midjourney/{concept_id}/{timestamp}.jpg
-- └── /originals/...
--
-- Bucket 2: "models"
-- ├── /3d/{concept_id}/{timestamp}.glb
-- ├── /3d/{concept_id}/{timestamp}.obj
-- └── /3d/{concept_id}/{timestamp}.mtl
--
-- ============================================================================


-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Optional but recommended for production

ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE models_3d ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read and write
CREATE POLICY "Allow authenticated users" ON concepts
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON prompts
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON images
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON models_3d
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON projects
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON activity_log
  FOR ALL USING (auth.role() = 'authenticated');
