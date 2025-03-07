-- Create prompt_rules table
CREATE TABLE IF NOT EXISTS public.prompt_rules (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  tech_stack JSONB DEFAULT '[]'::jsonb,
  theme JSONB DEFAULT '{}'::jsonb,
  additional_context TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_prompt_rules_user_id ON public.prompt_rules(user_id);

-- Add RLS policies
ALTER TABLE public.prompt_rules ENABLE ROW LEVEL SECURITY;

-- Allow public access for now (no authentication required)
CREATE POLICY prompt_rules_all_policy
  ON public.prompt_rules
  USING (true);

-- Policies with Clerk for restricted access:

-- Policy for users to see only their own rules
CREATE POLICY prompt_rules_select_policy
  ON public.prompt_rules
  FOR SELECT
  USING (user_id = requesting_user_id());

-- Policy for users to insert their own rules
CREATE POLICY prompt_rules_insert_policy
  ON public.prompt_rules
  FOR INSERT
  WITH CHECK (user_id = requesting_user_id());

-- Policy for users to update their own rules
CREATE POLICY prompt_rules_update_policy
  ON public.prompt_rules
  FOR UPDATE
  USING (user_id = requesting_user_id());

-- Policy for users to delete their own rules
CREATE POLICY prompt_rules_delete_policy
  ON public.prompt_rules
  FOR DELETE
  USING (user_id = requesting_user_id());