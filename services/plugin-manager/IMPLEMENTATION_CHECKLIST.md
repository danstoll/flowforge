# Database Persistence - Implementation Checklist

## Quick Start

Follow these steps to implement database persistence for the plugin-manager service.

## ✅ Pre-Implementation Checklist

- [ ] PostgreSQL is running and accessible
- [ ] `pg` package is installed (already in package.json)
- [ ] Backup current plugin-manager code
- [ ] Review [DATABASE_PERSISTENCE_GUIDE.md](DATABASE_PERSISTENCE_GUIDE.md)

## 📋 Implementation Steps

### Step 1: Backup Current Files

```bash
cd services/plugin-manager

# Backup original files
cp src/services/docker.service.ts src/services/docker.service.backup.ts
cp src/index.ts src/index.backup.ts
```

- [ ] Backed up `docker.service.ts`
- [ ] Backed up `index.ts`

### Step 2: Replace Files

```bash
# Replace with updated versions
mv src/services/docker.service.updated.ts src/services/docker.service.ts
mv src/index.updated.ts src/index.ts
```

- [ ] Replaced `docker.service.ts` with database-enabled version
- [ ] Replaced `index.ts` with database initialization

### Step 3: Verify File Structure

Check that these new files exist:

```
services/plugin-manager/
├── migrations/
│   └── 001_create_plugins_table.sql        ← New
├── scripts/
│   └── run-migration.ts                    ← New
├── src/
│   ├── services/
│   │   ├── database.service.ts             ← New
│   │   ├── docker.service.ts               ← Updated
│   │   └── kong.service.ts                 ← Unchanged
│   └── index.ts                            ← Updated
├── package.json                            ← Updated (added migrate script)
├── DATABASE_PERSISTENCE_GUIDE.md           ← New
└── IMPLEMENTATION_CHECKLIST.md             ← This file
```

- [ ] All new files are in place
- [ ] `package.json` has `migrate` script

### Step 4: Install Dependencies (If Needed)

```bash
npm install
```

- [ ] Dependencies installed
- [ ] No errors during installation

### Step 5: Run Database Migration

#### Option A: Manual Migration (Recommended First Time)

```bash
npm run migrate
```

Expected output:
```
🔄 Running database migration...
📄 Executing migration: 001_create_plugins_table.sql
✅ Migration completed successfully!

📊 Created tables:
   - plugins
   - plugin_events
   - plugin_metrics

✨ Database is ready!
```

- [ ] Migration completed successfully
- [ ] All 3 tables created

#### Option B: Verify in Database

```bash
# Connect to PostgreSQL
docker exec -it flowforge-postgres psql -U flowforge -d flowforge

# List tables
\dt

# Expected output:
#  Schema |     Name       | Type  |  Owner
# --------+----------------+-------+----------
#  public | plugins        | table | flowforge
#  public | plugin_events  | table | flowforge
#  public | plugin_metrics | table | flowforge
```

- [ ] Connected to database
- [ ] Tables exist and are accessible

### Step 6: Test Locally

```bash
# Start in development mode
npm run dev
```

Expected console output:
```
Starting Plugin Manager
Database connection established
Database migrations completed
Docker connection established
Docker service initialized with database sync
Plugin Manager started successfully
```

- [ ] Service started without errors
- [ ] Database connection established
- [ ] Docker service initialized
- [ ] HTTP server listening on port 4000

### Step 7: Verify Functionality

#### Test 1: List Plugins

```bash
curl http://localhost:4000/api/v1/plugins | jq
```

- [ ] API returns plugin list (may be empty)

#### Test 2: Check Database

```bash
docker exec -it flowforge-postgres psql -U flowforge -d flowforge

# Run query
SELECT COUNT(*) FROM plugins;
```

- [ ] Query executes successfully

#### Test 3: Install a Plugin (via Web UI or API)

Visit `http://localhost:3000/marketplace` and install a plugin, OR:

```bash
curl -X POST http://localhost:4000/api/v1/plugins/install \
  -H "Content-Type: application/json" \
  -d '{
    "manifest": {
      "id": "test-plugin",
      "name": "Test Plugin",
      "version": "1.0.0",
      "description": "Test",
      "image": { "repository": "nginx", "tag": "alpine" },
      "port": 80,
      "endpoints": []
    },
    "autoStart": true
  }'
```

- [ ] Plugin installed successfully
- [ ] Container created
- [ ] Container started

#### Test 4: Verify Persistence

```bash
# Check database
SELECT forgehook_id, status, container_id FROM plugins;

# Should show the test plugin
```

- [ ] Plugin record exists in database
- [ ] Status is correct
- [ ] Container ID is populated

#### Test 5: Restart Service

```bash
# Stop the service (Ctrl+C)
# Then restart
npm run dev
```

Expected behavior:
- Plugin should still be listed
- Database state should be preserved
- Running plugins should resume health monitoring

- [ ] Service restarted successfully
- [ ] Plugins loaded from database
- [ ] Plugin state preserved

#### Test 6: Check Event Log

```bash
docker exec -it flowforge-postgres psql -U flowforge -d flowforge

# View events
SELECT event_type, timestamp FROM plugin_events ORDER BY timestamp DESC LIMIT 10;
```

- [ ] Events are being logged
- [ ] Timestamps are correct

### Step 8: Build Production Image

```bash
npm run build
```

- [ ] TypeScript compiled successfully
- [ ] No compilation errors
- [ ] `dist/` directory created

### Step 9: Docker Build

```bash
docker build -t flowforge/plugin-manager:latest .
```

- [ ] Docker image built successfully
- [ ] No build errors

### Step 10: Integration Test

```bash
# Stop local dev server
# Update docker-compose to use new image
docker compose build plugin-manager
docker compose up -d

# Check logs
docker logs flowforge-plugin-manager

# Should see same startup sequence
```

- [ ] Container started successfully
- [ ] Database migrations ran
- [ ] Service is healthy

## ✅ Post-Implementation Verification

### Functionality Checklist

- [ ] Plugins can be installed
- [ ] Plugins can be started
- [ ] Plugins can be stopped
- [ ] Plugins can be restarted
- [ ] Plugins can be uninstalled
- [ ] Plugin state persists across restarts
- [ ] Health monitoring works
- [ ] Logs are accessible
- [ ] Events are logged to database
- [ ] Web UI shows correct plugin status

### Database Checklist

- [ ] `plugins` table populated correctly
- [ ] `plugin_events` table logging events
- [ ] Indexes created
- [ ] Triggers working (updated_at auto-updates)
- [ ] Queries are performant

### Error Handling Checklist

- [ ] Service handles database connection failures gracefully
- [ ] Migration errors are caught and logged
- [ ] Orphaned containers are adopted correctly
- [ ] Missing containers are detected and status updated
- [ ] Service continues if event logging fails

## 🐛 Troubleshooting

### Issue: Migration Fails with "relation already exists"

**Solution:** Tables already created. Either:
1. Skip migration (tables exist)
2. Drop and recreate:
   ```sql
   DROP TABLE plugin_events CASCADE;
   DROP TABLE plugin_metrics CASCADE;
   DROP TABLE plugins CASCADE;
   ```
   Then run: `npm run migrate`

- [ ] Resolved

### Issue: Cannot Connect to Database

**Check:**
1. PostgreSQL is running: `docker ps | grep postgres`
2. Environment variables are correct in `.env`
3. Database exists: `docker exec flowforge-postgres psql -U flowforge -l`

- [ ] Resolved

### Issue: Plugins Not Loading

**Check:**
1. Database contains plugins: `SELECT * FROM plugins;`
2. Container status in Docker: `docker ps -a | grep forgehook`
3. Logs: `docker logs flowforge-plugin-manager`

- [ ] Resolved

### Issue: Service Starts But Database Empty

**Possible causes:**
1. Wrong database connection string
2. Migration not run
3. Different database instance

**Solution:**
```bash
# Verify connection
docker exec flowforge-plugin-manager \
  psql -U flowforge -d flowforge -c "SELECT COUNT(*) FROM plugins;"
```

- [ ] Resolved

## 📚 Documentation

- [ ] Read [DATABASE_PERSISTENCE_GUIDE.md](DATABASE_PERSISTENCE_GUIDE.md)
- [ ] Understand database schema
- [ ] Understand sync logic
- [ ] Know how to query plugin state
- [ ] Know how to troubleshoot issues

## 🚀 Production Deployment

### Pre-Deployment

- [ ] All tests passing
- [ ] Database backed up
- [ ] Current plugin list documented
- [ ] Rollback plan prepared

### Deployment

- [ ] Deploy to staging first
- [ ] Test thoroughly in staging
- [ ] Schedule maintenance window
- [ ] Deploy to production
- [ ] Run migration
- [ ] Verify all plugins loaded
- [ ] Monitor for 24 hours

### Post-Deployment

- [ ] All plugins running correctly
- [ ] Database queries performant
- [ ] No errors in logs
- [ ] Health checks passing
- [ ] Event logging working

## ✨ Success Criteria

You've successfully implemented database persistence when:

✅ Plugins persist across plugin-manager restarts
✅ Database contains accurate plugin state
✅ Events are logged for audit trail
✅ Orphaned containers are auto-adopted
✅ Service handles crash recovery gracefully
✅ All existing functionality still works
✅ No breaking changes to API

## 📞 Need Help?

If you encounter issues:

1. Check logs: `docker logs flowforge-plugin-manager`
2. Query database: `docker exec -it flowforge-postgres psql -U flowforge -d flowforge`
3. Review [DATABASE_PERSISTENCE_GUIDE.md](DATABASE_PERSISTENCE_GUIDE.md)
4. Check file versions (backups exist if you need to rollback)

## 🎉 Congratulations!

Once all checkboxes are ticked, you have successfully implemented database persistence for FlowForge Plugin Manager!

**Benefits you now have:**
- ✅ Crash recovery
- ✅ Audit trail
- ✅ Persistent state
- ✅ Better debugging
- ✅ Foundation for future features (metrics, multi-instance)
