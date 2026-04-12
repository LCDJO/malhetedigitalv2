ALTER TABLE public.posts ADD COLUMN post_type TEXT NOT NULL DEFAULT 'post';
CREATE INDEX idx_posts_type ON public.posts(post_type);