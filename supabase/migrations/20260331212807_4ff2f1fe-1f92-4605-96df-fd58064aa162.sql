ALTER TABLE public.dorms
  ADD COLUMN IF NOT EXISTS has_multiple_blocks boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS block_count int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS tenant_selection text DEFAULT 'mixed';