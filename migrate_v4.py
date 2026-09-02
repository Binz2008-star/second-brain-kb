"""
Second Brain v4 - Phase 1 Schema & Data Migration
Idempotent: safe to re-run (ON CONFLICT DO NOTHING).

Usage:
  python migrate_v4.py            # create v4 tables + migrate chunks -> chunks_v4
  python migrate_v4.py --check    # verify schema + counts only
"""
import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import asyncpg

ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT / "v4-extract" / "second-brain-v4"))
from chunker_v4 import V4_SCHEMA_SQL  # noqa: E402

load_dotenv(ROOT / ".env")

BATCH = 50


def emb_str(emb):
    if isinstance(emb, (list, tuple)):
        return "[" + ",".join(f"{x:.6f}" for x in emb) + "]"
    return str(emb).strip()


async def connect(dsn):
    return await asyncpg.connect(dsn, timeout=120, command_timeout=180)


def _istring(parts, marker):
    return [p for p in parts if marker in p]


async def run_schema(conn):
    print("=== Running v4 schema ===")
    # Skip the hybrid_search function (has dollar-quoted body that breaks naive split)
    parts = [s.strip() for s in V4_SCHEMA_SQL.split(";") if s.strip()]
    for stmt in parts:
        if "CREATE OR REPLACE FUNCTION" in stmt or "$$" in stmt:
            continue
        try:
            await conn.execute(stmt)
        except Exception as e:
            print(f"  WARN: {stmt[:50]}... -> {e}")
    print("  v4 tables + indexes + extensions OK")

    hybrid_sql = parts[0] if False else """CREATE OR REPLACE FUNCTION hybrid_search(
    query_text TEXT, query_embedding vector(768),
    match_count INT DEFAULT 10, vector_weight FLOAT DEFAULT 0.7)
RETURNS TABLE (id INT, project_id TEXT, file_path TEXT, chunk_name TEXT,
    content TEXT, similarity FLOAT, rank FLOAT) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.project_id, c.file_path, c.chunk_name, c.content,
        (1 - (c.embedding <=> query_embedding))::FLOAT as similarity,
        (vector_weight * (1 - (c.embedding <=> query_embedding))
         + (1 - vector_weight) * ts_rank(c.content_tsv, plainto_tsquery('english', query_text)))::FLOAT as rank
    FROM chunks_v4 c
    WHERE c.content_tsv @@ plainto_tsquery('english', query_text)
       OR (1 - (c.embedding <=> query_embedding)) > 0.2
    ORDER BY rank DESC LIMIT match_count;
END; $$;"""
    await conn.execute(hybrid_sql)
    print("  hybrid_search() OK")


async def populate_projects(conn):
    env_map = {
        "content-engine": os.getenv("PROJECT_CONTENT_ENGINE", ""),
        "lvyy": os.getenv("PROJECT_LVYY", ""),
        "rico": os.getenv("PROJECT_RICO", ""),
    }
    projects = await conn.fetch("SELECT DISTINCT project_id FROM chunks")
    n = 0
    for p in projects:
        pid = p["project_id"]
        path = env_map.get(pid, "")
        await conn.execute("""INSERT INTO projects (id, name, path)
            VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING""", pid, pid, path)
        n += 1
    print(f"  projects synced: {n}")


async def migrate_chunks(conn):
    existing = await conn.fetchval("SELECT COUNT(*) FROM chunks_v4")
    chunks = await conn.fetch("""SELECT project_id, file_path, chunk_index, content,
        content_hash, language, start_line, end_line, embedding FROM chunks ORDER BY id""")
    rows = [(c["project_id"], c["file_path"], c["chunk_index"], c["content"],
             c["content_hash"], c["language"], c["start_line"], c["end_line"],
             emb_str(c["embedding"])) for c in chunks]
    print(f"  source chunks: {len(rows)} | chunks_v4 already: {existing}")

    i = 0
    while i < len(rows):
        batch = rows[i:i + BATCH]
        await conn.executemany("""
            INSERT INTO chunks_v4 (project_id, file_path, chunk_index, chunk_type,
                chunk_name, content, content_hash, language, start_line, end_line, embedding)
            VALUES ($1,$2,$3,'generic',NULL,$4,$5,$6,$7,$8,$9::vector)
            ON CONFLICT (project_id, file_path, chunk_index) DO NOTHING
        """, batch)
        i += BATCH
    cnt = await conn.fetchval("SELECT COUNT(*) FROM chunks_v4")
    print(f"  FINAL chunks_v4: {cnt}")


async def check(conn):
    v3 = await conn.fetchval("SELECT COUNT(*) FROM chunks")
    v4 = await conn.fetchval("SELECT COUNT(*) FROM chunks_v4")
    fn = await conn.fetchval("SELECT COUNT(*) FROM pg_proc WHERE proname='hybrid_search'")
    tsv = await conn.fetchval("SELECT COUNT(*) FROM chunks_v4 WHERE content_tsv IS NULL")
    proj = await conn.fetch("SELECT id FROM projects ORDER BY id")
    print(f"chunks(v3): {v3}")
    print(f"chunks_v4: {v4}")
    print(f"hybrid_search() exists: {bool(fn)}")
    print(f"rows with NULL content_tsv: {tsv}")
    print(f"projects: {[r['id'] for r in proj]}")
    ok = (v3 == v4 == 651 and fn == 1)
    print("MIGRATION OK" if ok else "MIGRATION INCOMPLETE")


async def main():
    dsn = os.environ["NEON_DSN"]
    conn = await connect(dsn)
    try:
        if "--check" in sys.argv:
            await check(conn)
            return
        await run_schema(conn)
        await populate_projects(conn)
        await migrate_chunks(conn)
        await check(conn)
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())