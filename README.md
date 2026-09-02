# Second Brain v4 — Autonomous Self-Evolving Code Knowledge Base

A local-first, AI-powered knowledge base that indexes your code, enables semantic search, runs multi-agent coding tasks, and evolves itself over time.

## Features

- **Hybrid Search**: Vector (HNSW) + BM25 keyword + code graph traversal
- **AST-Aware Chunking**: Python, JavaScript, TypeScript (tree-sitter)
- **Multi-Agent Pipeline**: Researcher → Architect → Editor → Tester → Memory
- **Long-Term Memory**: Persistent lessons, patterns, preferences (Neon + Markdown)
- **Self-Evolution**: Analyzes failures, suggests improvements, auto-applies to AGENTS.md
- **Unified CLI**: `sb chat` / `sb agent` / `sb search` / `sb status` / `sb evolve` / `sb ui`
- **Web UI**: Search, chat, agent streaming, memory browser at `http://localhost:8000`
- **MCP Server**: OpenCode/Claude integration via `search_brain`, `agent_task`, `get_status`, `list_memory`
- **Docker Ready**: Single-container deployment with health checks
- **File Watcher**: Auto-reloads MEMORY.md/LESSONS.md on changes

## Quick Start

```bash
# Prerequisites
# - Python 3.12+ (global)
# - Ollama running locally with: deepseek-r1:14b, nomic-embed-text
# - Neon PostgreSQL with pgvector (DSN in .env)

cd X:\second-brain-kb

# Install dependencies
pip install -r requirements.txt
pip install fastapi uvicorn python-multipart jinja2

# Check status
python sb.py status

# Search code
python sb.py search "gmail oauth token exchange"

# Run multi-agent task
python sb.py agent "add authentication to lvyy project"

# Interactive chat
python sb.py chat

# Start Web UI + API
python sb.py ui

# Self-evolution
python sb.py evolve
```

## Docker

```bash
# Build and run
docker compose -f docker-compose.v4.yml up -d --build

# Check health
curl http://localhost:8000/status

# Stop
docker compose -f docker-compose.v4.yml down
```

Environment variables in `.env`:
```env
NEON_DSN=postgresql://...
OLLAMA_EMBED_URL=http://127.0.0.1:11434/api/embed
OLLAMA_CHAT_URL=http://127.0.0.1:11434/api/chat
ARCHITECT_MODEL=deepseek-r1:14b
EDITOR_MODEL=deepseek-r1:14b
CHAT_MODEL=deepseek-r1:14b
EMBED_MODEL=nomic-embed-text
CURRENT_PROJECT=lvyy
PROJECT_CONTENT_ENGINE=X:\content engine\Robin-Content-Engine-v2
PROJECT_LVYY=C:\Users\loyal\lvyy-ai-sales-agent
PROJECT_RICO=X:\rico\Rico-Your-AI-intelligent-job-hunt-partner-in-the-UAE
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        sb.py (CLI)                          │
├─────────────────────────────────────────────────────────────┤
│  api.py (FastAPI)  │  brain_agent_v4.py (Multi-Agent)      │
│  - /search          │  - Researcher: search_brain           │
│  - /chat            │  - Architect: plan + search_brain     │
│  - /agent           │  - Editor: write_file, run_shell      │
│  - /agent/stream    │  - Tester: run_tests, lint, typecheck │
│  - /memory          │  - Memory: add_memory, get_context    │
├─────────────────────────────────────────────────────────────┤
│  chunker_v4.py (AST Chunker)  │  memory.py (MemoryManager)  │
│  - Python (ast)               │  - Markdown files           │
│  - JS/TS (tree-sitter)        │  - Neon pgvector            │
│  - Hybrid search SQL          │  - File watcher (watchdog)  │
├─────────────────────────────────────────────────────────────┤
│  Neon PostgreSQL (chunks_v4, code_graph, memory, conversations)│
│  Ollama (deepseek-r1:14b, nomic-embed-text)                   │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

| File | Purpose |
|------|---------|
| `sb.py` | Unified CLI entry point |
| `api.py` | FastAPI server (REST + SSE + Web UI) |
| `brain_agent_v4.py` | Multi-agent orchestration |
| `chunker_v4.py` | AST-aware code chunking (Python/JS/TS) |
| `memory.py` | Long-term memory + file watcher |
| `evolve.py` | Self-evolution engine |
| `mcp_server_v4.py` | MCP 2.x stdio server |
| `reindex_v4.py` | Phase 2: AST re-indexing pipeline |
| `ui/index.html` | Web UI (search, chat, agent streaming, memory) |

## Memory System

Four Markdown files in `./memory/`:
- `MEMORY.md` — User preferences, identity
- `PATTERNS.md` — Code patterns across repos
- `LESSONS.md` — Failures, fixes, what works
- `CONTEXT.md` — Current project context

Synced to Neon `memory` table with embeddings for semantic search.

## Self-Evolution

Run `python sb.py evolve`:
1. Analyzes `conversations` table for failures
2. Generates improvement proposals (`EVOLVE_TODO.md`)
3. Auto-embeds lessons to Neon for searchable memory
4. Auto-applies new proposals to `AGENTS.md` (durable state)

## MCP Integration

Registered in `~/.config/opencode/opencode.json`:
```json
{
  "mcpServers": {
    "second-brain-v4": {
      "command": "python",
      "args": ["X:/second-brain-kb/mcp_server_v4.py"]
    }
  }
}
```

Tools available to MCP clients:
- `search_brain(query, top_k)`
- `agent_task(task)`
- `get_status()`
- `list_memory(limit)`

## Re-indexing

```bash
# Scan files (dry run)
python reindex_v4.py --scan

# Index all projects
python reindex_v4.py

# Index single project
python reindex_v4.py --project rico

# Force rebuild (incl. code_graph)
python reindex_v4.py --all
```

## Database Schema

Key tables:
- `chunks_v4` — 9,511 code chunks with HNSW vector index
- `code_graph` — 1,352 import edges
- `memory` — Long-term lessons (no HNSW, exact search)
- `conversations` — Per-agent history + OUTCOME rows
- `projects` — Project registry

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Ollama timeout | Increase `aiohttp.ClientTimeout(total=600)` |
| Neon connection flaky | Pool + retry logic in `_get_pool()` |
| HNSW recall miss on `memory` | Table is small - uses exact brute-force |
| File watcher not starting | `pip install watchdog` |
| Tree-sitter parse errors | Falls back to generic chunker |

## License

MIT