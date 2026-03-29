-- Enable uuid-ossp extension (required for gen_random_uuid() used throughout migrations)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create stories table
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('image', 'video', 'text', 'match_result')),
    content TEXT NOT NULL,
    audience TEXT NOT NULL DEFAULT 'everyone' CHECK (audience IN ('everyone', 'connections')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for efficient querying of stories by user and expiry
CREATE INDEX IF NOT EXISTS idx_stories_active 
ON public.stories(user_id, expires_at);

-- Setup Row Level Security
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Policies for stories table
-- 1. Users can insert their own stories
CREATE POLICY "Users can insert their own stories"
ON public.stories FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 2. Users can read stories (active ones are filtered by the app, but RLS ensures safety)
CREATE POLICY "Users can read visible stories"
ON public.stories FOR SELECT
USING (
    user_id = auth.uid() -- Own stories
    OR 
    (audience = 'everyone' AND auth.uid() IS NOT NULL) -- Public stories for authenticated users
    OR 
    (
        audience = 'connections' AND 
        EXISTS (
            SELECT 1 FROM public.connections c
            WHERE c.status = 'accepted'
            AND (
                (c.user_id = auth.uid() AND c.connected_user_id = stories.user_id) OR
                (c.user_id = stories.user_id AND c.connected_user_id = auth.uid())
            )
        )
    )
);

-- 3. Users can delete their own stories
CREATE POLICY "Users can delete their own stories"
ON public.stories FOR DELETE
USING (auth.uid() = user_id);

-- Setup Storage Bucket for stories
INSERT INTO storage.buckets (id, name, public) 
VALUES ('stories', 'stories', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- 1. Public can view story assets
CREATE POLICY "Public can view story assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'stories');

-- 2. Authenticated users can upload story assets
CREATE POLICY "Authenticated users can upload story assets"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'stories' AND 
    auth.role() = 'authenticated'
);

-- 3. Users can delete their own story assets
CREATE POLICY "Users can delete their own story assets"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'stories' AND 
    auth.uid() = owner
);

