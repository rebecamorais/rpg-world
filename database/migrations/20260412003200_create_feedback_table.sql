-- Create feedback table for RPGWorld
-- 1. Create the table
CREATE TABLE public.feedback (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID          REFERENCES public.profile(id) ON DELETE SET NULL,
  email       TEXT          NOT NULL,
  type        TEXT          NOT NULL, -- 'bug', 'feature', 'feedback', 'account'
  message     TEXT          NOT NULL,
  status      TEXT          NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'closed'
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- 3. Define Policies (Internal use only for now via service role, but adding insert for safety)
-- However, we plan to use the admin client from the backend, so RLS doesn't apply to those queries.
-- We can add a policy for admins if we want to view it in the UI later.
CREATE POLICY "feedback_insert" ON public.feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "feedback_view_as_admin" ON public.feedback FOR SELECT USING (true); -- Placeholder, should be restricted to roles in the future
