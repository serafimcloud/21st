-- Drop existing embedding tables
DROP TABLE IF EXISTS component_embeddings;
DROP TABLE IF EXISTS demo_embeddings;
DROP TABLE IF EXISTS usage_context_embeddings;

-- Create new usage-oriented embeddings table
CREATE TABLE usage_embeddings (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  item_id bigint NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('component', 'demo')),
  embedding vector(1536) NOT NULL,
  usage_description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);

-- Create code-based embeddings table
CREATE TABLE code_embeddings (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  item_id bigint NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('component', 'demo')),
  embedding vector(1536) NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);

-- Add indexes for vector search
CREATE INDEX usage_embeddings_embedding_idx ON usage_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX code_embeddings_embedding_idx ON code_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Add indexes for filtering by type
CREATE INDEX usage_embeddings_item_type_idx ON usage_embeddings (item_type);
CREATE INDEX code_embeddings_item_type_idx ON code_embeddings (item_type);

-- Add indexes for item lookups
CREATE INDEX usage_embeddings_item_id_idx ON usage_embeddings (item_id);
CREATE INDEX code_embeddings_item_id_idx ON code_embeddings (item_id); 