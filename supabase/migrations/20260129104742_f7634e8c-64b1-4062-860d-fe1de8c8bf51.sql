-- Add scheduled_at column for post scheduling
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Drop existing policy and recreate with scheduling logic
DROP POLICY IF EXISTS "Anyone can view published posts" ON public.blog_posts;

-- Create new policy that checks scheduling
CREATE POLICY "Anyone can view published posts" 
ON public.blog_posts 
FOR SELECT 
USING (
  (
    is_published = true 
    AND (scheduled_at IS NULL OR scheduled_at <= now())
  ) 
  OR is_admin()
);

-- Add comment for clarity
COMMENT ON COLUMN public.blog_posts.scheduled_at IS 'When set, the post will only be visible after this date/time';