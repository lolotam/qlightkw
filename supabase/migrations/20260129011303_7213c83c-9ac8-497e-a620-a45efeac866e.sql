-- Fix the order_status_history INSERT policy to be more restrictive
-- Only allow inserts from authenticated users (the trigger runs with their context)
DROP POLICY IF EXISTS "System can insert status history" ON public.order_status_history;

CREATE POLICY "Authenticated users can insert status history" ON public.order_status_history
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);