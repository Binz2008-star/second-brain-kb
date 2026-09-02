
# Install ALL MCPs for real coding
Write-Host "Installing ALL MCP servers..." -ForegroundColor Green

npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-git
npm install -g @modelcontextprotocol/server-github
npm install -g @modelcontextprotocol/server-brave-search
npm install -g @modelcontextprotocol/server-fetch
npm install -g @modelcontextprotocol/server-postgres
npm install -g @modelcontextprotocol/server-puppeteer
npm install -g @modelcontextprotocol/server-memory
npm install -g @modelcontextprotocol/server-sequential-thinking
npm install -g @modelcontextprotocol/server-time

pip install mcp asyncpg aiohttp python-dotenv sentence-transformers

Write-Host "All MCPs installed!" -ForegroundColor Green
Write-Host "Set env vars:" -ForegroundColor Yellow
Write-Host "  setx GITHUB_TOKEN your_github_token"
Write-Host "  setx BRAVE_API_KEY your_brave_key"
Write-Host "  setx NEON_DSN your_neon_dsn"
