"""
FastAPI for Second Brain v4 - API + Web UI backend
Endpoints:
  POST /api/search - hybrid search
  POST /api/chat - chat with context
  POST /api/agent - multi-agent task
  GET /api/agent/stream - SSE stream for agent progress
  GET /api/status - health
  GET /api/system - system telemetry (CPU, memory, disk)
  GET /api/projects - list projects
  GET /api/memory - list memories
  POST /api/memory - add memory
  GET /api/system/metrics - benchmark telemetry
  GET / - Web UI
"""
import os
import asyncio
import json
from pathlib import Path
from typing import List, Optional, AsyncGenerator
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncpg
import aiohttp
import psutil

ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")

try:
    import sys
    sys.path.insert(0, str(ROOT))
    sys.path.insert(0, str(ROOT / "v4-extract" / "second-brain-v4"))
except Exception:
    pass

from brain_agent_v4 import search_brain, PROJECTS, CURRENT_PROJECT, embed, run_multi_agent_stream, close_pool

from contextlib import asynccontextmanager

# Data.json path (from ai-dashboard)
DATA_JSON_PATH = Path(os.getenv("DATA_JSON_PATH", str(ROOT / "ai-dashboard" / "data.json")))

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown
    await close_pool()

app = FastAPI(title="Second Brain v4", version="4.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NEON_DSN = os.getenv("NEON_DSN")
OLLAMA_EMBED_URL = os.getenv("OLLAMA_EMBED_URL", "http://127.0.0.1:11434/api/embed")
OLLAMA_CHAT_URL = os.getenv("OLLAMA_CHAT_URL", "http://127.0.0.1:11434/api/chat")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")
CHAT_MODEL = os.getenv("CHAT_MODEL", "deepseek-r1:14b")

_pool = None

async def get_pool():
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(NEON_DSN, min_size=1, max_size=4, command_timeout=120)
    return _pool


class SearchRequest(BaseModel):
    query: str
    top_k: int = 8

class ChatRequest(BaseModel):
    query: str
    top_k: int = 6

class AgentRequest(BaseModel):
    task: str
    project: Optional[str] = None

class MemoryRequest(BaseModel):
    type: str = "fact"
    content: str
    project_id: Optional[str] = None


@app.get("/", response_class=HTMLResponse)
async def ui():
    html_path = ROOT / "ui" / "index.html"
    if html_path.exists():
        return html_path.read_text(encoding='utf-8')
    return """
    <html><body style="font-family: monospace; padding: 20px;">
    <h1>🧠 Second Brain v4 API</h1>
    <p>API running. Create ui/index.html for the web UI.</p>
    <ul>
      <li>POST /search - search brain</li>
      <li>POST /chat - chat with context</li>
      <li>POST /agent - multi-agent task</li>
      <li>GET /status</li>
      <li>GET /memory</li>
      <li>POST /memory</li>
    </ul>
    <input id="q" placeholder="search brain..." style="width:400px"><button onclick="search()">Search</button>
    <pre id="results"></pre>
    <script>
      async function search() {
        const q = document.getElementById('q').value;
        const res = await fetch('/search', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({query:q, top_k:8})});
        const data = await res.json();
        document.getElementById('results').textContent = JSON.stringify(data, null, 2);
      }
    </script>
    </body></html>
    """


@app.get("/status")
async def status():
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            cnt = await conn.fetchval("SELECT COUNT(*) FROM chunks_v4")
            projs = await conn.fetch("SELECT project_id, COUNT(*) as c FROM chunks_v4 GROUP BY project_id")
            try:
                mem = await conn.fetchval("SELECT COUNT(*) FROM memory")
            except Exception:
                mem = 0
            try:
                graph = await conn.fetchval("SELECT COUNT(*) FROM code_graph")
            except Exception:
                graph = 0
        return {
            "status": "ok",
            "chunks_v4": cnt,
            "memory": mem,
            "code_graph": graph,
            "projects": {r["project_id"]: r["c"] for r in projs},
            "model": CHAT_MODEL,
            "embed_model": EMBED_MODEL,
            "current_project": CURRENT_PROJECT,
            "project_roots": {k: str(v) for k, v in PROJECTS.items()},
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}


@app.post("/search")
async def api_search(req: SearchRequest):
    if not search_brain:
        raise HTTPException(503, "search backend unavailable")
    results = await search_brain(req.query, top_k=req.top_k)
    return {
        "query": req.query,
        "results": [
            {
                "project": r["project_id"],
                "file": r["file_path"],
                "chunk": r.get("chunk_name"),
                "content": r["content"][:1000],
                "score": float(r.get("similarity", r.get("rank", 0))),
            }
            for r in results
        ],
    }


@app.post("/chat")
async def api_chat(req: ChatRequest):
    results = await search_brain(req.query, top_k=min(req.top_k, 4)) if search_brain else []
    context = "\n\n".join(f"[{r['project_id']}/{r['file_path']}] {r['content'][:800]}" for r in results)
    
    # Fast mode: if query is short, just return search results
    if len(req.query.split()) <= 3 and not req.query.endswith('?'):
        return {
            "query": req.query, 
            "answer": f"Found {len(results)} relevant chunks. Use a question for LLM analysis.", 
            "context_used": len(results),
            "fast_mode": True,
            "results": [
                {"project": r["project_id"], "file": r["file_path"], "chunk": r.get("chunk_name"), 
                 "content": r["content"][:500], "score": float(r.get("similarity", r.get("rank", 0)))}
                for r in results
            ]
        }
    
    system = "Answer concisely using the provided code context. Max 3 sentences."
    user_prompt = f"Context:\n{context}\n\nQuestion: {req.query}"

    messages = [{"role": "system", "content": system}, {"role": "user", "content": user_prompt}]
    answer = None
    async with aiohttp.ClientSession() as s:
        for attempt in range(3):
            try:
                async with s.post(OLLAMA_CHAT_URL, json={"model": CHAT_MODEL, "messages": messages, "stream": False},
                                  timeout=aiohttp.ClientTimeout(total=180, connect=30)) as r:
                    data = await r.json()
                if "error" in data:
                    return {"query": req.query, "error": data["error"], "context_used": len(results)}
                answer = data["message"]["content"]
                break
            except (aiohttp.TimeoutError, aiohttp.ClientError):
                if attempt == 2:
                    return {"query": req.query, "error": "chat timed out after 3 attempts", "context_used": len(results)}
                await asyncio.sleep(1)
    return {"query": req.query, "answer": answer, "context_used": len(results)}


@app.post("/agent")
async def api_agent(req: AgentRequest):
    from brain_agent_v4 import run_multi_agent
    await run_multi_agent(req.task)
    return {"status": "completed", "task": req.task}


@app.get("/agent/stream")
async def api_agent_stream(task: str):
    """Stream agent progress via Server-Sent Events"""
    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            async for event in run_multi_agent_stream(task):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        yield f"data: {json.dumps({'type': 'complete', 'task': task})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@app.get("/projects")
async def api_projects():
    return {"current": CURRENT_PROJECT, "projects": {k: str(v) for k, v in PROJECTS.items()}}


@app.get("/memory")
async def api_memory_list(limit: int = 50):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, type, content, project_id, created_at FROM memory ORDER BY id DESC LIMIT $1", limit
        )
    return {"memories": [dict(r) for r in rows]}


@app.post("/memory")
async def api_memory_add(req: MemoryRequest):
    proj = req.project_id or CURRENT_PROJECT
    emb = await embed(req.content[:500])
    emb_str = "[" + ",".join(f"{x:.6f}" for x in emb) + "]"
    pool = await get_pool()
    async with pool.acquire() as conn:
        mid = await conn.fetchval(
            "INSERT INTO memory (type, content, project_id, embedding) VALUES ($1,$2,$3,$4::vector) RETURNING id",
            req.type, req.content, proj, emb_str,
        )
    return {"id": mid, "status": "added", "type": req.type, "project_id": proj}


import concurrent.futures

@app.get("/api/system")
async def api_system():
    """System telemetry: CPU, memory, disk - reads from data.json or live psutil"""
    try:
        import time
        start = time.time()
        
        # Try reading from data.json first (updated by external collector)
        if DATA_JSON_PATH.exists():
            try:
                with open(DATA_JSON_PATH, 'r') as f:
                    data = json.load(f)
                # Convert to expected format
                cpu_cores = data.get("cpu_cores", [])
                cpu_total = data.get("cpu", 0)
                if not cpu_total and cpu_cores:
                    cpu_total = sum(cpu_cores) / len(cpu_cores)
                
                mem = data.get("mem", {})
                disk = data.get("disk", {})
                
                result = {
                    "cpu": {
                        "total_percent": cpu_total,
                        "per_core_percent": cpu_cores,
                        "core_count": len(cpu_cores) if cpu_cores else psutil.cpu_count(logical=True),
                        "cpu_freq": data.get("cpu_freq", "3.4 GHz"),
                    },
                    "memory": {
                        "total_bytes": int((mem.get("total", 16) or 16) * 1024**3),
                        "available_bytes": int((mem.get("free", 1) or 1) * 1024**3),
                        "used_bytes": int((mem.get("used", 15) or 15) * 1024**3),
                        "percent": mem.get("percent", 0),
                    },
                    "disk": {
                        "total_bytes": int((disk.get("total", 446) or 446) * 1024**3),
                        "used_bytes": int((disk.get("used", 361) or 361) * 1024**3),
                        "free_bytes": int((disk.get("free", 85) or 85) * 1024**3),
                        "percent": disk.get("usePct", 0),
                    },
                    "elapsed_ms": int((time.time() - start) * 1000)
                }
                return result
            except Exception:
                pass  # Fall through to live psutil
        
        # Fallback: live psutil measurement
        psutil.cpu_percent(interval=None, percpu=True)
        time.sleep(0.1)
        cpu_percent_per_core = psutil.cpu_percent(interval=None, percpu=True)
        cpu_total = psutil.cpu_percent(interval=None)
        
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        result = {
            "cpu": {
                "total_percent": cpu_total,
                "per_core_percent": cpu_percent_per_core,
                "core_count": psutil.cpu_count(logical=True),
            },
            "memory": {
                "total_bytes": memory.total,
                "available_bytes": memory.available,
                "used_bytes": memory.used,
                "percent": memory.percent,
            },
            "disk": {
                "total_bytes": disk.total,
                "used_bytes": disk.used,
                "free_bytes": disk.free,
                "percent": (disk.used / disk.total) * 100,
            },
            "elapsed_ms": int((time.time() - start) * 1000)
        }
        return result
    except Exception as e:
        import traceback
        return {"error": str(e), "trace": traceback.format_exc()}


@app.get("/data.json")
async def get_data_json():
    """Serve the data.json file from ai-dashboard"""
    if DATA_JSON_PATH.exists():
        return JSONResponse(content=json.loads(DATA_JSON_PATH.read_text()))
    return {"error": "data.json not found", "path": str(DATA_JSON_PATH)}


# Benchmark metrics storage (in-memory, persisted via API)
benchmark_metrics = {
    "avg_ttft_ms": 0.0,
    "avg_tps": 0.0,
    "p95_ttft_ms": 0.0,
    "total_requests": 0,
    "success_rate": 100.0,
    "updated_at": "N/A"
}

@app.post("/api/system/benchmark-results")
async def update_benchmark_results(metrics: dict):
    """Receive benchmark results from benchmark_suite.py"""
    global benchmark_metrics
    benchmark_metrics = metrics
    return {"status": "ok"}

@app.get("/api/system/metrics")
async def get_system_metrics():
    """Get latest benchmark telemetry"""
    return benchmark_metrics


# API prefix routes - proxy to existing handlers
@app.post("/api/search")
async def api_search_v2(req: SearchRequest):
    return await api_search(req)

@app.post("/api/chat")
async def api_chat_v2(req: ChatRequest):
    return await api_chat(req)

@app.post("/api/agent")
async def api_agent_v2(req: AgentRequest):
    return await api_agent(req)

@app.get("/api/agent/stream")
async def api_agent_stream_v2(task: str):
    return await api_agent_stream(task)

@app.get("/api/status")
async def api_status_v2():
    return await status()

@app.get("/api/projects")
async def api_projects_v2():
    return await api_projects()

@app.get("/api/memory")
async def api_memory_list_v2(limit: int = 50):
    return await api_memory_list(limit)

@app.post("/api/memory")
async def api_memory_add_v2(req: MemoryRequest):
    return await api_memory_add(req)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)