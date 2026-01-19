# FlowForge Startup Guide

## ✅ Prerequisites Completed

I've prepared your FlowForge installation:

1. ✅ **Updated plugin-manager** with database persistence
2. ✅ **Updated docker.service** with database integration
3. ✅ **Created registry system** with 8 built-in plugins
4. ✅ **Created .env file** from .env.example
5. ✅ **Logo setup** ready for your logo file

## 🚀 Quick Start

### Step 1: Start Docker Desktop

**IMPORTANT**: Docker Desktop must be running before you can start FlowForge.

1. Open Docker Desktop application on Windows
2. Wait for Docker to fully start (look for "Docker Desktop is running" in system tray)
3. Verify Docker is running:

```bash
docker ps
```

If you see a table of running containers (even if empty), you're ready to proceed!

### Step 2: Start FlowForge Core Platform

```bash
cd f:/Projects/lcncAK/flowforge

# Start the core platform (infrastructure + plugin-manager + web-ui)
docker compose -f docker-compose.core.yml up -d
```

This will start:
- PostgreSQL (database)
- Redis (caching)
- Qdrant (vector database)
- Kong (API gateway)
- Plugin Manager (ForgeHook control plane)
- Web UI (user interface)

### Step 3: Monitor Startup

Watch the logs to ensure everything starts properly:

```bash
# Watch all services
docker compose -f docker-compose.core.yml logs -f

# Or watch specific services
docker compose -f docker-compose.core.yml logs -f plugin-manager
docker compose -f docker-compose.core.yml logs -f web-ui
```

### Step 4: Verify Services Are Running

```bash
# Check all containers are healthy
docker compose -f docker-compose.core.yml ps
```

You should see all services with status "Up" and "healthy".

### Step 5: Access FlowForge

Once all services are healthy:

- **Web UI**: http://localhost:3000
- **Plugin Manager API**: http://localhost:4000
- **Kong Gateway**: http://localhost:8000

## 🧪 Testing the System

### 1. Test Plugin Manager Health

```bash
curl http://localhost:4000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-18T...",
  "version": "1.0.0",
  "docker": "connected"
}
```

### 2. Test Plugin Registry

```bash
# List all available plugins
curl http://localhost:4000/api/v1/registry/plugins | jq

# Search for crypto plugins
curl "http://localhost:4000/api/v1/registry/search?q=crypto" | jq

# Get featured plugins
curl http://localhost:4000/api/v1/registry/featured | jq

# Get registry stats
curl http://localhost:4000/api/v1/registry/stats | jq
```

### 3. Test Database Persistence

```bash
# Install a plugin via API
curl -X POST http://localhost:4000/api/v1/plugins/install \
  -H "Content-Type: application/json" \
  -d '{
    "forgehookId": "crypto-service",
    "autoStart": true
  }'

# List installed plugins
curl http://localhost:4000/api/v1/plugins | jq

# Restart plugin-manager container
docker compose -f docker-compose.core.yml restart plugin-manager

# Wait 10 seconds, then check plugins are still there
sleep 10
curl http://localhost:4000/api/v1/plugins | jq
```

The plugin should still be listed after restart! ✅

### 4. Test Web UI

Open http://localhost:3000 in your browser:

1. Navigate to the Marketplace page
2. You should see 8 available plugins from the registry
3. Search for "crypto" - should find Crypto Service
4. Click on a plugin to view details
5. Click "Install" to install a plugin
6. Monitor the installation progress
7. View installed plugins in the Plugins page

## 🗂️ Project Structure

```
flowforge/
├── docker-compose.core.yml      ← Main compose file (use this!)
├── .env                          ← Environment variables (created ✅)
├── services/
│   └── plugin-manager/
│       ├── registry/
│       │   └── forgehooks-registry.json   ← 8 plugins ✅
│       ├── migrations/
│       │   └── 001_create_plugins_table.sql ← DB schema ✅
│       ├── src/
│       │   ├── index.ts                    ← Updated ✅
│       │   ├── services/
│       │   │   ├── database.service.ts     ← New ✅
│       │   │   ├── docker.service.ts       ← Updated ✅
│       │   │   └── registry.service.ts     ← New ✅
│       │   └── routes/
│       │       └── registry.ts             ← New ✅
│       └── package.json
└── web-ui/
    ├── public/
    │   └── README.md             ← Logo instructions ✅
    ├── src/
    │   ├── components/
    │   │   └── Logo.tsx          ← Logo component ✅
    │   └── hooks/
    │       ├── usePlugins.ts     ← Updated ✅
    │       └── useRegistry.ts    ← New ✅
    └── LOGO_SETUP.md             ← Logo guide ✅
```

## 🔧 Useful Commands

### Managing Services

```bash
# Start all services
docker compose -f docker-compose.core.yml up -d

# Stop all services
docker compose -f docker-compose.core.yml down

# Restart a specific service
docker compose -f docker-compose.core.yml restart plugin-manager

# View logs
docker compose -f docker-compose.core.yml logs -f plugin-manager

# Check service health
docker compose -f docker-compose.core.yml ps

# Rebuild and restart
docker compose -f docker-compose.core.yml up -d --build plugin-manager
```

### Database Operations

```bash
# Connect to PostgreSQL
docker exec -it flowforge-postgres psql -U flowforge -d flowforge

# Inside psql:
\dt                    # List tables
SELECT * FROM plugins; # View installed plugins
SELECT * FROM plugin_events; # View plugin events
\q                     # Exit
```

### Debugging

```bash
# Check plugin-manager logs
docker logs flowforge-plugin-manager -f

# Check web-ui logs
docker logs flowforge-web-ui -f

# Check Kong logs
docker logs flowforge-kong -f

# Inspect a container
docker inspect flowforge-plugin-manager

# Execute commands in plugin-manager
docker exec -it flowforge-plugin-manager sh
```

## 🐛 Troubleshooting

### Issue: Docker daemon not running

**Error**: `error during connect: ... docker_engine: The system cannot find the file specified`

**Solution**: Start Docker Desktop on Windows

### Issue: Port conflicts

**Error**: `bind: address already in use`

**Solution**:
1. Find what's using the port:
   ```bash
   # Windows (PowerShell)
   netstat -ano | findstr :4000
   ```
2. Either stop that process or change the port in `.env` file

### Issue: Plugin Manager can't connect to database

**Error**: `Failed to connect to database`

**Solution**:
1. Check PostgreSQL is running:
   ```bash
   docker ps | grep postgres
   ```
2. Check database logs:
   ```bash
   docker logs flowforge-postgres
   ```
3. Verify connection string in `.env`:
   ```
   DATABASE_URL=postgres://flowforge:flowforge_password@postgres:5432/flowforge
   ```

### Issue: Plugin Manager can't access Docker

**Error**: `Cannot connect to Docker`

**Solution**:
Ensure Docker socket is mounted in `docker-compose.core.yml`:
```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

On Windows, this should work automatically with Docker Desktop.

### Issue: Web UI shows "Failed to fetch registry"

**Solution**:
1. Check plugin-manager is running:
   ```bash
   docker ps | grep plugin-manager
   ```
2. Test registry endpoint:
   ```bash
   curl http://localhost:4000/api/v1/registry/plugins
   ```
3. Check web-ui environment variables in `docker-compose.core.yml`:
   ```yaml
   environment:
     VITE_PLUGIN_MANAGER_URL: http://localhost:4000
   ```

### Issue: Database migrations not applied

**Solution**:
The migrations run automatically on startup. If they fail:

1. Check plugin-manager logs:
   ```bash
   docker logs flowforge-plugin-manager | grep migration
   ```
2. Manually run migrations:
   ```bash
   docker exec -it flowforge-plugin-manager npm run migrate
   ```
3. Or connect to database and run SQL manually:
   ```bash
   docker exec -it flowforge-postgres psql -U flowforge -d flowforge -f /path/to/migration.sql
   ```

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Web UI (Port 3000)                     │
│  - Browse Marketplace (8 plugins from registry)             │
│  - Install/Uninstall ForgeHooks                             │
│  - Monitor Plugin Status                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP
                       ▼
┌─────────────────────────────────────────────────────────────┐
│               Plugin Manager (Port 4000)                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Registry Service                                     │  │
│  │  - forgehooks-registry.json (8 plugins)               │  │
│  │  - Search, filter, featured plugins                   │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Docker Service                                       │  │
│  │  - Create/Start/Stop containers                       │  │
│  │  - Port allocation (4001-4999)                        │  │
│  │  - Health monitoring                                  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Database Service                                     │  │
│  │  - PostgreSQL persistence                             │  │
│  │  - Plugin state & events                              │  │
│  │  - Startup sync with Docker                           │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ Docker API
         ┌─────────────────────────────┐
         │   Docker Engine             │
         │  - Runs ForgeHook containers│
         │  - Network: flowforge-net   │
         └─────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
  ┌──────────────┐          ┌──────────────┐
  │ ForgeHook 1  │          │ ForgeHook 2  │
  │ Port: 4001   │   ...    │ Port: 4002   │
  └──────────────┘          └──────────────┘
```

## 🎯 What's Next?

After starting FlowForge:

1. **Add your logo** to `web-ui/public/logo.svg` (see [LOGO_SETUP.md](web-ui/LOGO_SETUP.md))

2. **Install plugins** via Web UI:
   - Go to http://localhost:3000/marketplace
   - Browse the 8 available ForgeHooks
   - Click "Install" on any plugin
   - Watch it deploy as a Docker container

3. **Test plugin persistence**:
   - Install a plugin
   - Restart plugin-manager: `docker restart flowforge-plugin-manager`
   - Verify plugin is still installed after restart

4. **Add custom plugins**:
   - Edit `services/plugin-manager/registry/forgehooks-registry.json`
   - Add your plugin manifest
   - Reload registry: `curl -X POST http://localhost:4000/api/v1/registry/reload`
   - See it appear in the Web UI marketplace

5. **Customize environment**:
   - Edit `.env` file
   - Restart services: `docker compose -f docker-compose.core.yml restart`

## 📚 Documentation

- **Database Persistence**: `services/plugin-manager/DATABASE_PERSISTENCE_GUIDE.md`
- **Plugin Registry**: `services/plugin-manager/PLUGIN_REGISTRY_GUIDE.md`
- **Logo Setup**: `web-ui/LOGO_SETUP.md`
- **Implementation Summary**: `services/plugin-manager/REGISTRY_IMPLEMENTATION_SUMMARY.md`

---

**Ready to start?**

1. Start Docker Desktop
2. Run: `docker compose -f docker-compose.core.yml up -d`
3. Visit: http://localhost:3000

🚀 **FlowForge is ready to launch!**
