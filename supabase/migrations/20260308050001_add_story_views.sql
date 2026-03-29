-- Create story_views table for tracking which stories users have viewed
CREATE TABLE IF NOT EXISTS public.story_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
    viewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    viewed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(story_id, viewer_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_story_views_story_id 
ON public.story_views(story_id);

CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id 
ON public.story_views(viewer_id);

-- Setup Row Level Security
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- Policies for story_views table
-- 1. Users can insert their own story views
CREATE POLICY "Users can insert their own story views"
ON public.story_views FOR INSERT
WITH CHECK (auth.uid() = viewer_id);

-- 2. Users can read their own story views
CREATE POLICY "Users can read their own story views"
ON public.story_views FOR SELECT
USING (auth.uid() = viewer_id);

-- 3. Story owners can see who viewed their stories
CREATE POLICY "Story owners can see who viewed their stories"
ON public.story_views FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.stories s
        WHERE s.id = story_views.story_id
        AND s.user_id = auth.uid()
    )
);

