-- Add masonic_status and access_level to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS masonic_status TEXT DEFAULT 'non_brother',
ADD COLUMN IF NOT EXISTS access_level INTEGER DEFAULT 0;

-- Create stories table
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content_url TEXT,
  content_text TEXT,
  content_type TEXT NOT NULL DEFAULT 'image', -- 'image', 'text'
  privacy TEXT NOT NULL DEFAULT 'public', -- 'public', 'brothers', 'connections'
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for stories
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Create policies for stories
CREATE POLICY "Stories are viewable based on privacy and status" 
ON public.stories FOR SELECT 
USING (
  expires_at > now() AND (
    privacy = 'public' OR 
    (privacy = 'brothers' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND masonic_status = 'brother')) OR
    (privacy = 'connections' AND EXISTS (SELECT 1 FROM public.follows WHERE follower_id = auth.uid() AND following_id = stories.user_id)) OR
    user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own stories" 
ON public.stories FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories" 
ON public.stories FOR DELETE 
USING (auth.uid() = user_id);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'delivered', -- 'delivered', 'seen'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Users can view their own messages" 
ON public.messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" 
ON public.messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own received messages (for status)" 
ON public.messages FOR UPDATE 
USING (auth.uid() = receiver_id);
