
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced chunks with hybrid search + code graph
CREATE TABLE IF NOT EXISTS chunks_v4 (
    id SERIAL PRIMARY KEY,
    project_id TEXT REFERENCES projects(id),
    file_path TEXT NOT NULL,
    chunk_index INT NOT NULL,
    chunk_type TEXT NOT NULL DEFAULT 'generic', -- function, class, import, generic
    chunk_name TEXT, -- function/class name
    content TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    language TEXT,
    start_line INT,
    end_line INT,
    -- Vectors
    embedding vector(768) NOT NULL,
    -- Hybrid search: tsvector for keyword
    content_tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
    -- Code graph
    imports TEXT[], -- extracted imports
    calls TEXT[], -- function calls
    -- Metadata
    indexed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, file_path, chunk_index)
);

-- Code graph edges (file -> file dependencies)
CREATE TABLE IF NOT EXISTS code_graph (
    id SERIAL PRIMARY KEY,
    project_id TEXT REFERENCES projects(id),
    source_file TEXT NOT NULL,
    target_file TEXT NOT NULL,
    relation TEXT NOT NULL, -- imports, calls, extends
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations memory (agent learns)
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL, -- user, assistant, tool
    content TEXT NOT NULL,
    tool_calls JSONB,
    project_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Long-term memory / lessons
CREATE TABLE IF NOT EXISTS memory (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL, -- pattern, lesson, preference, fact
    content TEXT NOT NULL,
    project_id TEXT,
    embedding vector(768),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for hybrid search
CREATE INDEX IF NOT EXISTS idx_chunks_v4_embedding ON chunks_v4 USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX IF NOT EXISTS idx_chunks_v4_tsv ON chunks_v4 USING GIN (content_tsv);
CREATE INDEX IF NOT EXISTS idx_chunks_v4_trgm ON chunks_v4 USING GIN (content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_chunks_v4_project ON chunks_v4 (project_id, file_path);
-- NOTE: no ANN index on memory - it's small and HNSW gave unreliable approximate recall
CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations (session_id, created_at);

-- Hybrid search function (vector + normalized keyword via indexed probes)
CREATE OR REPLACE FUNCTION hybrid_search(
    query_text TEXT,
    query_embedding vector(768),
    match_count INT DEFAULT 10,
    vector_weight FLOAT DEFAULT 0.7
) RETURNS TABLE (
    id INT,
    project_id TEXT,
    file_path TEXT,
    chunk_name TEXT,
    content TEXT,
    similarity FLOAT,
    rank FLOAT
) LANGUAGE plpgsql AS $$
DECLARE
    kw tsquery;
    vec_k INT;
    kw_k INT;
    max_kws FLOAT;
BEGIN
    -- Free-text keyword query: supports OR/"phrase"/implicit AND without requiring every word
    kw := websearch_to_tsquery('english', query_text);
    IF kw IS NULL OR kw = ''::tsquery THEN
        kw := plainto_tsquery('english', query_text);
    END IF;
    vec_k := GREATEST(match_count * 8, 50);
    kw_k  := GREATEST(match_count * 8, 50);

    -- Keyword max ts_rank over candidate set (normalized to 0..1 so it competes fairly)
    SELECT MAX(ts_rank_cd(x.content_tsv, kw)) INTO max_kws
    FROM chunks_v4 x
    WHERE x.content_tsv @@ kw;

    RETURN QUERY
    WITH cand AS (
        (
            SELECT chunks_v4.id AS cand_id FROM chunks_v4
            ORDER BY chunks_v4.embedding <=> query_embedding LIMIT vec_k
        )
        UNION
        (
            SELECT chunks_v4.id AS cand_id FROM chunks_v4
            WHERE chunks_v4.content_tsv @@ kw LIMIT kw_k
        )
    )
    SELECT
        c.id,
        c.project_id,
        c.file_path,
        c.chunk_name,
        c.content,
        (1 - (c.embedding <=> query_embedding))::FLOAT as similarity,
        (
            vector_weight * (1 - (c.embedding <=> query_embedding))
            + (1 - vector_weight) *
              CASE WHEN max_kws > 0 THEN (ts_rank_cd(c.content_tsv, kw) / max_kws) ELSE 0 END
        )::FLOAT as rank
    FROM cand
    JOIN chunks_v4 c ON c.id = cand.cand_id
    ORDER BY rank DESC
    LIMIT match_count;
END;
$$;
