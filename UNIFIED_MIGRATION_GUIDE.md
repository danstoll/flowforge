# FlowForge Unified Architecture - Migration Guide

## 🎯 What Changed?

FlowForge has been restructured from **two separate services** into a **single unified full-stack application**.

### Before (Old Architecture)
```
flowforge/
├── services/plugin-manager/    ← Backend API (Port 4000)
└── web-ui/                     ← Frontend (Port 3000)
```

### After (New Architecture)
```
flowforge/
└── web-ui/                     ← Single unified app (Port 3000 only!)
    ├── frontend/               ← React app
    └── backend/                ← Fastify API
```

---

## ✨ Benefits

| Benefit | Description |
|---------|-------------|
| **Simpler Deployment** | One Docker container instead of two |
| **Single Port** | Everything on port 3000 |
| **No CORS Issues** | Frontend and backend same origin |
| **Easier Development** | One service, one build process |
| **Lower Resource Usage** | 50% fewer containers |
| **Better Performance** | No network hop between UI and API |

---

## 🚀 Quick Start (New Architecture)

### 1. Start Docker Desktop

### 2. Launch FlowForge

```bash
cd f:/Projects/lcncAK/flowforge
docker compose -f docker-compose.unified.yml up -d
```

### 3. Access FlowForge

- **Web UI**: http://localhost:3000
- **API**: http://localhost:3000/api/v1/...

**That's it!** No more port 4000!

---

## 📊 What's Different?

### API URLs Changed

**Old**:
```
http://localhost:4000/health
http://localhost:4000/api/v1/plugins
http://localhost:4000/api/v1/registry/plugins
```

**New**:
```
http://localhost:3000/api/v1/health
http://localhost:3000/api/v1/plugins
http://localhost:3000/api/v1/registry/plugins
```

All API endpoints now have `/api/v1` prefix and are served from port 3000.

### WebSocket URL Changed

**Old**:
```javascript
ws://localhost:4000/ws/events
```

**New**:
```javascript
ws://localhost:3000/ws/events
```

### Docker Compose Changed

**Old**:
```yaml
services:
  plugin-manager:  # Separate service on port 4000
    ...
  web-ui:          # Separate service on port 3000
    ...
```

**New**:
```yaml
services:
  flowforge:  # Single unified service on port 3000
    ...
```

---

## 📁 New File Structure

```
flowforge/
├── docker-compose.unified.yml  ← NEW: Simplified compose file
│
└── web-ui/                      ← Main application directory
    ├── frontend/                ← React frontend
    │   ├── src/
    │   │   ├── components/
    │   │   ├── pages/
    │   │   ├── hooks/
    │   │   └── types/
    │   ├── public/
    │   ├── index.html
    │   └── vite.config.ts
    │
    ├── backend/                 ← Fastify backend
    │   ├── src/
    │   │   ├── routes/
    │   │   │   ├── health.ts
    │   │   │   ├── plugins.ts
    │   │   │   └── registry.ts
    │   │   ├── services/
    │   │   │   ├── database.service.ts
    │   │   │   ├── docker.service.ts
    │   │   │   ├── registry.service.ts
    │   │   │   └── kong.service.ts
    │   │   ├── app.ts
    │   │   └── index.ts
    │   ├── migrations/
    │   ├── registry/
    │   │   └── forgehooks-registry.json
    │   ├── tsconfig.json
    │   └── package.json
    │
    ├── Dockerfile.unified       ← NEW: Builds both frontend & backend
    ├── package.unified.json     ← NEW: Combined dependencies
    └── ...
```

---

## 🔧 Development Workflow

### Install Dependencies

```bash
cd flowforge/web-ui

# Install all dependencies (frontend + backend)
npm install --package-lock-only
npm install
```

### Run in Development Mode

**Option 1: Run both frontend and backend together**
```bash
npm run dev
```

**Option 2: Run separately in different terminals**

Terminal 1 (Backend):
```bash
npm run dev:backend
```

Terminal 2 (Frontend):
```bash
npm run dev:frontend
```

Frontend will proxy API requests to backend during development.

### Build for Production

```bash
# Build both frontend and backend
npm run build
```

### Run Production Build Locally

```bash
# Start backend (serves frontend)
npm start
```

---

## 🧪 Testing

### Test API Endpoints

```bash
# Health check
curl http://localhost:3000/api/v1/health

# List available plugins
curl http://localhost:3000/api/v1/registry/plugins | jq

# List installed plugins
curl http://localhost:3000/api/v1/plugins | jq

# Install a plugin
curl -X POST http://localhost:3000/api/v1/plugins/install \
  -H "Content-Type: application/json" \
  -d '{
    "forgehookId": "crypto-service",
    "autoStart": true
  }'
```

### Test Web UI

1. Visit http://localhost:3000
2. Navigate to Marketplace
3. Search for plugins
4. Install a plugin
5. View installed plugins

---

## 🐛 Troubleshooting

### Issue: Old containers still running

**Error**: Port 4000 or 3000 already in use

**Solution**:
```bash
# Stop old architecture containers
docker compose -f docker-compose.core.yml down

# Start new unified architecture
docker compose -f docker-compose.unified.yml up -d
```

### Issue: Frontend not loading

**Check**:
1. Backend is running: `docker logs flowforge`
2. Frontend was built: `docker exec flowforge ls /app/frontend/dist`
3. Visit http://localhost:3000 (not 3000/index.html)

### Issue: API endpoints return 404

**Check**:
1. Using correct URL: `http://localhost:3000/api/v1/...` (not port 4000)
2. Backend routes registered: Check logs for "Plugin Manager started successfully"

### Issue: CORS errors in browser console

**This shouldn't happen anymore!** Frontend and backend are on same origin.

If you still see CORS errors:
- Clear browser cache
- Ensure using `http://localhost:3000` not `http://127.0.0.1:3000`

---

## 📦 Migration Checklist

If you're migrating from the old architecture:

- [ ] Stop old containers: `docker compose -f docker-compose.core.yml down`
- [ ] Remove old images (optional): `docker image rm flowforge-plugin-manager flowforge-web-ui`
- [ ] Use new compose file: `docker compose -f docker-compose.unified.yml up -d`
- [ ] Update any external integrations to use port 3000 (not 4000)
- [ ] Update API URLs to include `/api/v1` prefix
- [ ] Test plugin installation still works
- [ ] Verify database persistence (plugins survive restart)

---

## 🎯 Key Differences Summary

| Aspect | Old Architecture | New Architecture |
|--------|-----------------|------------------|
| **Services** | 2 (plugin-manager + web-ui) | 1 (flowforge) |
| **Ports** | 3000 (UI), 4000 (API) | 3000 (everything) |
| **API Base URL** | `http://localhost:4000` | `http://localhost:3000` |
| **API Prefix** | `/api/v1` (already had it) | `/api/v1` (same) |
| **WebSocket** | `ws://localhost:4000/ws/events` | `ws://localhost:3000/ws/events` |
| **Compose File** | `docker-compose.core.yml` | `docker-compose.unified.yml` |
| **Docker Image** | `flowforge-plugin-manager`, `flowforge-web-ui` | `flowforge` |
| **CORS** | Required between services | Not needed (same origin) |

---

## 🔄 Startup Sequence

### Old Architecture
```
1. Start plugin-manager (port 4000)
   ├─ Connect to PostgreSQL
   ├─ Connect to Docker
   ├─ Load registry
   └─ Start Fastify API

2. Start web-ui (port 3000)
   └─ Serve React app (Nginx)

3. Browser calls 4000 for API, 3000 for UI
```

### New Architecture
```
1. Start flowforge (port 3000)
   ├─ Backend starts (Fastify)
   │  ├─ Connect to PostgreSQL
   │  ├─ Connect to Docker
   │  ├─ Load registry
   │  └─ Register API routes (/api/v1/*)
   └─ Serve React build for non-API routes

2. Browser calls 3000 for everything
```

---

## 📚 Updated Documentation

All documentation has been updated to reflect the new architecture:

- [START_HERE.md](START_HERE.md) - Updated with port 3000
- [QUICK_START.md](QUICK_START.md) - Updated commands
- [UNIFIED_ARCHITECTURE.md](UNIFIED_ARCHITECTURE.md) - Complete architecture guide

---

## ✅ Verification Steps

After migration, verify everything works:

### 1. Check Container Status

```bash
docker compose -f docker-compose.unified.yml ps
```

Should show:
- `flowforge` - healthy
- `postgres` - healthy
- `redis` - healthy
- `qdrant` - healthy
- `kong` - healthy

### 2. Test API

```bash
curl http://localhost:3000/api/v1/health | jq
```

Should return:
```json
{
  "status": "healthy",
  "docker": "connected",
  "database": "connected",
  "registry": "loaded"
}
```

### 3. Test Registry

```bash
curl http://localhost:3000/api/v1/registry/stats | jq
```

Should show 8 available plugins.

### 4. Test Web UI

Visit http://localhost:3000

- [ ] Homepage loads
- [ ] Navigate to Marketplace
- [ ] See 8 available plugins
- [ ] Search works
- [ ] Install a plugin
- [ ] Plugin shows as "running"

### 5. Test Persistence

```bash
# Restart flowforge
docker restart flowforge

# Wait 10 seconds
sleep 10

# Check plugin still installed
curl http://localhost:3000/api/v1/plugins | jq '.plugins | length'
```

Should still show your installed plugins!

---

## 🎉 Success!

You're now running the unified FlowForge architecture!

**Benefits you'll notice**:
- ✅ Simpler startup (one service)
- ✅ Faster response times (no network hop)
- ✅ Lower memory usage (fewer containers)
- ✅ Easier to understand and maintain

**Next steps**:
1. Add your logo to `web-ui/frontend/public/logo.svg`
2. Customize `.env` settings
3. Add custom plugins to registry
4. Build awesome workflows!

---

**Questions?** Check [UNIFIED_ARCHITECTURE.md](UNIFIED_ARCHITECTURE.md) for complete details.
