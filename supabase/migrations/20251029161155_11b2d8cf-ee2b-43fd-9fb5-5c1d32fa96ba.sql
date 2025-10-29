-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on students table
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Students policies: teachers can manage their own students
CREATE POLICY "Teachers can view their students"
  ON public.students FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Teachers can create students"
  ON public.students FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Teachers can update their students"
  ON public.students FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Teachers can delete their students"
  ON public.students FOR DELETE
  USING (auth.uid() = created_by);

-- Create daily_evaluations table
CREATE TABLE public.daily_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Behavioral questions (multiple choice)
  behavior_rating TEXT CHECK (behavior_rating IN ('excelente', 'bom', 'regular', 'precisa_melhorar')),
  eating_rating TEXT CHECK (eating_rating IN ('comeu_tudo', 'comeu_bem', 'comeu_pouco', 'nao_comeu')),
  sleep_rating TEXT CHECK (sleep_rating IN ('dormiu_bem', 'dormiu_pouco', 'nao_dormiu', 'agitado')),
  social_rating TEXT CHECK (social_rating IN ('muito_participativo', 'participativo', 'timido', 'isolado')),
  
  -- Text observation
  daily_notes TEXT,
  
  -- Audio storage path
  audio_url TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Unique constraint: one evaluation per student per day
  UNIQUE(student_id, evaluation_date)
);

-- Enable RLS on daily_evaluations table
ALTER TABLE public.daily_evaluations ENABLE ROW LEVEL SECURITY;

-- Daily evaluations policies
CREATE POLICY "Teachers can view evaluations of their students"
  ON public.daily_evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = daily_evaluations.student_id
      AND students.created_by = auth.uid()
    )
  );

CREATE POLICY "Teachers can create evaluations for their students"
  ON public.daily_evaluations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = daily_evaluations.student_id
      AND students.created_by = auth.uid()
    )
  );

CREATE POLICY "Teachers can update evaluations of their students"
  ON public.daily_evaluations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = daily_evaluations.student_id
      AND students.created_by = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete evaluations of their students"
  ON public.daily_evaluations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = daily_evaluations.student_id
      AND students.created_by = auth.uid()
    )
  );

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio-notes', 'audio-notes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for audio files
CREATE POLICY "Teachers can upload audio for their students"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'audio-notes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Teachers can view their own audio files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'audio-notes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Teachers can update their own audio files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'audio-notes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Teachers can delete their own audio files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'audio-notes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );