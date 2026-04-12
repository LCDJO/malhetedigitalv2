-- Create hashtags table
CREATE TABLE public.hashtags (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post_hashtags table to link posts and hashtags
CREATE TABLE public.post_hashtags (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    hashtag_id UUID NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
    UNIQUE(post_id, hashtag_id)
);

-- Add discovery fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS loja_id UUID,
ADD COLUMN IF NOT EXISTS rito_id UUID,
ADD COLUMN IF NOT EXISTS potencia_id UUID;

-- Add media_url to posts (if not exists)
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Enable RLS
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Hashtags
CREATE POLICY "Hashtags are viewable by everyone" 
ON public.hashtags FOR SELECT USING (true);

CREATE POLICY "Users can create hashtags" 
ON public.hashtags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for Post-Hashtags
CREATE POLICY "Post-hashtags are viewable by everyone" 
ON public.post_hashtags FOR SELECT USING (true);

CREATE POLICY "Users can link hashtags to their own posts" 
ON public.post_hashtags FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.posts 
        WHERE id = post_id AND user_id = auth.uid()
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hashtags_name ON public.hashtags(name);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_post_id ON public.post_hashtags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag_id ON public.post_hashtags(hashtag_id);
