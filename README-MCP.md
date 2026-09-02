
# 🧠 Second Brain - ALL MCPs for Real Coding

You now have 11 MCPs that let you work on ANY project + create new projects.

## What you built (your mcp_universal.py)

Your universal MCP has 8 tools:
- search_second_brain: semantic search across rico, content-engine, lvyy
- create_project: scaffold fastapi/nextjs/fullstack at ANY path
- analyze_project: detect stack of ANY repo
- file_read/write/list/delete: real file ops
- shell_run: npm, pip, git, pytest, docker
- git_status/commit/diff

## Full Stack (11 MCPs)

1. filesystem - access X:/, C:/Users/loyal, C:/projects - ANY project
2. git - git ops
3. github - create repos, PRs
4. brave-search - search docs
5. fetch - fetch templates
6. postgres - query Neon brain directly
7. puppeteer - browser test new projects
8. memory - long-term memory
9. sequential-thinking - planning
10. time - time
11. universal-second-brain - YOUR CUSTOM (the brain)

## Install

```powershell
cd X:\second-brain-kb
powershell -ExecutionPolicy Bypass -File install_all_mcps.ps1
setx GITHUB_TOKEN ghp_...
setx BRAVE_API_KEY ...
setx NEON_DSN ...
```

Copy opencode_final.json to:
- OpenCode: %USERPROFILE%\.config\opencode\opencode.json
- Claude: %APPDATA%\Claude\claude_desktop_config.json
- Cursor: %APPDATA%\Cursor\mcp.json

## Create ANY new project

In OpenCode/Claude:
```
> create_project type=nextjs name=my-saas path=X:/projects
> create_project type=fastapi name=my-api path=X:/projects
> create_project type=fullstack name=my-startup path=X:/

> analyze_project path=X:/some-cloned-repo
> search_second_brain query="how to do auth"
> shell_run command="npm install" cwd="X:/projects/my-saas"
> shell_run command="npm run dev" cwd="X:/projects/my-saas"
```

## Dynamic indexing for ANY project

To add any new project to second-brain:

```powershell
python ingest.py --project-path X:/projects/my-new-app --project-id my-new-app
# Then search it:
python query.py "auth logic in my-new-app"
```

## Real coding workflow

1. User: "Create SaaS with auth from content-engine"
2. Agent:
   - search_second_brain "auth middleware"
   - create_project fullstack saas X:/
   - file_read X:/content engine/.../auth.py
   - file_write X:/saas/backend/auth.py (adapted)
   - shell_run "docker compose up"
   - git_status + git_commit
3. Done - new project built using old patterns

This works for ANY given project, not just your 3.
