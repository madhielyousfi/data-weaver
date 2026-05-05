
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Connections (data sources / destinations)
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  connector_type TEXT NOT NULL, -- postgres, mysql, s3, snowflake, bigquery, csv, http, webhook
  category TEXT NOT NULL DEFAULT 'source', -- source, destination
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'connected',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own connections select" ON public.connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own connections insert" ON public.connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own connections update" ON public.connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own connections delete" ON public.connections FOR DELETE USING (auth.uid() = user_id);

-- Pipelines
CREATE TABLE public.pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, paused
  schedule TEXT, -- cron-like or 'manual'
  graph JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own pipelines select" ON public.pipelines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own pipelines insert" ON public.pipelines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own pipelines update" ON public.pipelines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own pipelines delete" ON public.pipelines FOR DELETE USING (auth.uid() = user_id);

-- Pipeline runs
CREATE TABLE public.pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.pipelines ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running', -- running, success, failed
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  rows_processed INTEGER DEFAULT 0,
  logs JSONB DEFAULT '[]'::jsonb,
  error TEXT
);
ALTER TABLE public.pipeline_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own runs select" ON public.pipeline_runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own runs insert" ON public.pipeline_runs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own runs update" ON public.pipeline_runs FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_runs_pipeline ON public.pipeline_runs(pipeline_id, started_at DESC);
CREATE INDEX idx_runs_user ON public.pipeline_runs(user_id, started_at DESC);

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER pipelines_touch BEFORE UPDATE ON public.pipelines FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER connections_touch BEFORE UPDATE ON public.connections FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
