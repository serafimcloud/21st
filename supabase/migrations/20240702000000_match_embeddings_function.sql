-- Make sure pgvector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create function for searching embeddings by similarity
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  embedding_table text,
  embedding_column text DEFAULT 'embedding'
) RETURNS TABLE (
  id uuid,
  -- For component_embeddings
  component_id int,
  embedding_type text,
  metadata jsonb,
  -- For demo_embeddings
  demo_id int,
  -- For usage_context_embeddings
  context_description text,
  -- Common fields
  similarity float
) LANGUAGE plpgsql AS $$
#variable_conflict use_column
BEGIN
  -- Validate inputs to prevent SQL injection
  IF embedding_table NOT IN ('component_embeddings', 'demo_embeddings', 'usage_context_embeddings') THEN
    RAISE EXCEPTION 'Invalid embedding_table: %', embedding_table;
  END IF;
  
  IF embedding_column != 'embedding' THEN
    RAISE EXCEPTION 'Invalid embedding_column: %', embedding_column;
  END IF;

  RETURN QUERY EXECUTE format(
    'SELECT 
       id,
       CASE WHEN %1$L = ''component_embeddings'' OR %1$L = ''usage_context_embeddings'' THEN component_id ELSE NULL END AS component_id,
       CASE WHEN %1$L = ''component_embeddings'' OR %1$L = ''demo_embeddings'' THEN embedding_type ELSE NULL END AS embedding_type,
       metadata,
       CASE WHEN %1$L = ''demo_embeddings'' OR %1$L = ''usage_context_embeddings'' THEN demo_id ELSE NULL END AS demo_id,
       CASE WHEN %1$L = ''usage_context_embeddings'' THEN context_description ELSE NULL END AS context_description,
       1 - (%2$L <=> %3$L) AS similarity
     FROM %1$I
     WHERE 1 - (%2$L <=> %3$L) > %4$L
     ORDER BY %3$L <=> %2$L
     LIMIT %5$L',
    embedding_table,
    embedding_column,
    query_embedding,
    match_threshold,
    match_count
  );
END;
$$;

-- Add necessary indexes if not already created
-- 1. Vector index for component_embeddings
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'component_embeddings_embedding_idx'
  ) THEN
    CREATE INDEX component_embeddings_embedding_idx ON component_embeddings 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  END IF;
END $$;

-- 2. Vector index for demo_embeddings
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'demo_embeddings_embedding_idx'
  ) THEN
    CREATE INDEX demo_embeddings_embedding_idx ON demo_embeddings 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  END IF;
END $$;

-- 3. Vector index for usage_context_embeddings
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'usage_context_embedding_idx'
  ) THEN
    CREATE INDEX usage_context_embedding_idx ON usage_context_embeddings 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  END IF;
END $$; 