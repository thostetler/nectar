# Redis Session Implementation

This document describes the Redis-backed session management system implemented in this application.

## Overview

The application now supports Redis-backed sessions in addition to the existing iron-session (cookie-based) implementation. The two systems can run in parallel using feature flags for gradual rollout.

## Architecture

### Session Storage

**Before (iron-session only)**:
```
Cookie contains: { token, isAuthenticated, apiCookieHash, bot }
```

**After (with Redis)**:
```
Cookie contains: { sessionId } (encrypted)
Redis stores: {
  sessionId,
  userId,
  username,
  token,
  isAuthenticated,
  apiCookieHash,
  bot,
  createdAt,
  lastActivity,
  userAgent,
  ip
}
```

### Benefits

1. **Smaller cookies**: Only session ID stored in cookie
2. **Horizontal scaling**: Multiple app instances share Redis
3. **Session management**: Can list/revoke sessions across devices
4. **Activity tracking**: Track last activity, IP, user agent
5. **Invalidation**: Can invalidate sessions immediately across all servers

## Environment Variables

### Required

```bash
# Redis connection URL
REDIS_URL=redis://localhost:6379

# For production with authentication:
REDIS_URL=redis://:password@host:6379

# For Redis Cluster:
REDIS_URL=redis://host1:6379,host2:6379,host3:6379
```

### Feature Flags

```bash
# Enable Redis sessions (default: false)
REDIS_SESSIONS_ENABLED=true

# Rollout percentage 0-100 (default: 100)
# Use for gradual rollout: start with 10, then 50, then 100
REDIS_SESSIONS_ROLLOUT_PERCENTAGE=100

# Enable Redis rate limiting (default: follows REDIS_SESSIONS_ENABLED)
REDIS_RATE_LIMIT_ENABLED=true

# Enable session activity tracking (default: true)
# Set to false to reduce Redis writes
SESSION_ACTIVITY_TRACKING_ENABLED=true

# Enable verbose session logging (default: false, true in development)
VERBOSE_SESSION_LOGGING=false
```

### Rate Limiting

```bash
# Maximum requests per window (default: 100)
RATE_LIMIT_MAX_REQUESTS=100

# Time window in milliseconds (default: 60000 = 1 minute)
RATE_LIMIT_WINDOW_MS=60000
```

## Implementation Files

### Core Files

- **`src/lib/redis.ts`**: Redis connection management with health checks
- **`src/lib/sessionStore.ts`**: Session CRUD operations
- **`src/lib/featureFlags.ts`**: Feature flag configuration
- **`src/lib/rateLimit.ts`**: Redis-based rate limiting

### Middleware

- **`src/middlewares/initSession.ts`**: Session initialization (updated for Redis)
- **`src/middleware.ts`**: Main middleware (updated to use new rate limiter)

### API Routes

- **`src/pages/api/auth/login.ts`**: Login endpoint (updated for Redis)
- **`src/pages/api/auth/logout.ts`**: Logout endpoint (updated for Redis)
- **`src/pages/api/sessions/index.ts`**: List user sessions (new)
- **`src/pages/api/sessions/revoke.ts`**: Revoke a session (new)
- **`src/pages/api/sessions/revoke-all.ts`**: Revoke all other sessions (new)
- **`src/pages/api/health.ts`**: Health check endpoint (new)

### Types

- **`src/types/iron-session.shims.d.ts`**: Updated to include sessionId

## API Endpoints

### Health Check

```
GET /api/health
```

Response:
```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": 1234567890,
  "uptime": 12345,
  "redis": {
    "enabled": true,
    "connected": true,
    "healthy": true,
    "lastHealthCheck": 1234567890
  },
  "sessions": {
    "totalSessions": 100,
    "totalIndexes": 50
  }
}
```

### List User Sessions

```
GET /api/sessions
```

Requires authentication. Returns all sessions for the current user.

Response:
```json
{
  "success": true,
  "sessions": [
    {
      "sessionId": "abc123...",
      "createdAt": 1234567890,
      "lastActivity": 1234567890,
      "userAgent": "Mozilla/5.0...",
      "ip": "192.168.1.1",
      "current": true
    }
  ]
}
```

### Revoke a Session

```
POST /api/sessions/revoke
Content-Type: application/json

{
  "sessionId": "abc123..."
}
```

Requires authentication. Revokes a specific session (cannot revoke current session).

Response:
```json
{
  "success": true
}
```

### Revoke All Other Sessions

```
POST /api/sessions/revoke-all
```

Requires authentication. Revokes all sessions except the current one (logout all other devices).

Response:
```json
{
  "success": true,
  "count": 3
}
```

## Redis Data Structure

### Session Keys

```
session:{sessionId} -> JSON session data
TTL: 30 days (authenticated), 1 day (anonymous), 7 days (bot)
```

### Session Indexes

```
session_index:{userId}:{sessionId} -> sessionId
TTL: Same as session
```

Used for listing all sessions for a user.

### Rate Limit Keys

```
rate_limit:{ip} -> sorted set of timestamps
TTL: window duration + 10 seconds
```

## Deployment Guide

### Local Development

1. Install Redis:
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:latest
```

2. Set environment variables:
```bash
# .env.local
REDIS_URL=redis://localhost:6379
REDIS_SESSIONS_ENABLED=true
REDIS_SESSIONS_ROLLOUT_PERCENTAGE=100
```

3. Start the application:
```bash
pnpm dev
```

### Production Deployment

#### Phase 1: Setup (Week 1)

1. **Provision Redis**
   - Use managed service (AWS ElastiCache, Redis Cloud, etc.)
   - Configure persistence (AOF + RDB)
   - Setup monitoring and alerts
   - Configure backups

2. **Deploy Code**
   ```bash
   REDIS_URL=redis://:password@production-redis:6379
   REDIS_SESSIONS_ENABLED=false  # Start disabled
   ```

3. **Verify**
   - Check `/api/health` endpoint
   - Verify Redis connectivity
   - Check logs for errors

#### Phase 2: Gradual Rollout (Week 2)

1. **10% Traffic**
   ```bash
   REDIS_SESSIONS_ENABLED=true
   REDIS_SESSIONS_ROLLOUT_PERCENTAGE=10
   ```

2. **Monitor** (24-48 hours)
   - Error rates
   - Redis CPU/memory
   - Session creation rate
   - Application latency

3. **50% Traffic** (if stable)
   ```bash
   REDIS_SESSIONS_ROLLOUT_PERCENTAGE=50
   ```

4. **Monitor** (24-48 hours)

5. **100% Traffic** (if stable)
   ```bash
   REDIS_SESSIONS_ROLLOUT_PERCENTAGE=100
   ```

#### Phase 3: Monitoring (Ongoing)

Set up alerts for:
- Redis down
- High memory usage (>80%)
- High latency (>100ms p95)
- High error rate (>1%)
- Unexpected session count growth

### Rollback Plan

If issues occur:

1. **Immediate**: Set `REDIS_SESSIONS_ENABLED=false`
2. **Redeploy** with updated env vars
3. **Verify** application works with iron-session only
4. **Investigate** logs and Redis metrics
5. **Fix** issue before re-enabling

No data loss occurs during rollback - sessions will regenerate on next request.

## Monitoring

### Key Metrics

1. **Redis Metrics**
   - Connected clients
   - Memory usage
   - Hit/miss ratio
   - Commands per second
   - Latency (p50, p95, p99)

2. **Session Metrics**
   - Active sessions count
   - Session creation rate
   - Session lookup failures
   - Average session duration

3. **Application Metrics**
   - Session initialization time
   - Login success/failure rate
   - Logout success rate
   - Session management errors

### Logs

Session operations are logged with structured data:

```
[session-store] Session saved to Redis {sessionId, userId, ttl, duration}
[session-store] Session retrieved {sessionId, userId, duration}
[session-store] Session destroyed {sessionId, userId}
[initSession] Redis session is valid {sessionId}
[api/login] Login successful - session saved to Redis {sessionId, userId}
```

Use log levels:
- `DEBUG`: Detailed session operations (enable with `VERBOSE_SESSION_LOGGING=true`)
- `INFO`: Session lifecycle events (create, destroy)
- `WARN`: Degraded operation (Redis slow, falling back)
- `ERROR`: Failures requiring attention

## Redis Configuration

### Recommended Production Config

```conf
# Memory
maxmemory 2gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec

# Performance
tcp-backlog 511
timeout 0
tcp-keepalive 300

# Limits
maxclients 10000
```

### Persistence Strategy

Use **AOF + RDB** for best durability:
- AOF: Append-only file for durability
- RDB: Snapshots for faster restarts
- Compromise: `appendfsync everysec` (1 second data loss max)

## Troubleshooting

### Redis Connection Errors

**Symptom**: `Redis error: ECONNREFUSED`

**Solution**:
1. Check Redis is running: `redis-cli ping`
2. Verify REDIS_URL is correct
3. Check network/firewall rules
4. Application will fall back to iron-session

### High Memory Usage

**Symptom**: Redis memory > 80%

**Solution**:
1. Check session count: `redis-cli DBSIZE`
2. Verify TTLs are set: `redis-cli TTL session:{id}`
3. Increase maxmemory or add more Redis instances
4. Reduce session TTL if needed

### Session Not Found

**Symptom**: User logged out unexpectedly

**Possible Causes**:
1. Redis evicted key (memory pressure)
2. Redis restarted without persistence
3. TTL expired
4. Manual deletion

**Solution**:
1. Check Redis memory and eviction policy
2. Verify persistence is enabled
3. Check logs for Redis errors
4. Session will regenerate on next request

### Inconsistent Sessions

**Symptom**: Session works sometimes, not others

**Possible Causes**:
1. Rollout percentage < 100% (expected)
2. Multiple Redis instances without proper clustering
3. Clock skew between servers

**Solution**:
1. Set `REDIS_SESSIONS_ROLLOUT_PERCENTAGE=100` for consistency
2. Use Redis Cluster or single instance
3. Sync clocks with NTP

## Performance Expectations

### Latency

- Session read: **1-5ms** (local Redis: <1ms)
- Session write: **2-10ms** (local Redis: <2ms)
- Session destroy: **1-5ms**
- List user sessions: **5-20ms** (depends on session count)

### Throughput

- Session operations: **10,000+ ops/sec** per Redis instance
- Rate limiting: **50,000+ checks/sec** per Redis instance

### Capacity

- Memory per session: ~500 bytes
- 1GB RAM ≈ 2 million sessions
- Plan for 3x session count for safety

## Security Considerations

1. **Cookie Security**
   - SessionId still encrypted with iron-session
   - Secure flag enabled in production
   - SameSite=strict

2. **Redis Security**
   - Use authentication (password)
   - Use TLS in production
   - Restrict network access
   - Regular security updates

3. **Session Security**
   - Sessions auto-expire via TTL
   - Can revoke sessions immediately
   - IP and user agent tracking for anomaly detection
   - Cookie hash validation prevents hijacking

## Testing

### Manual Testing

1. **Login**
   ```bash
   curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password"}'
   ```

2. **List Sessions**
   ```bash
   curl http://localhost:8000/api/sessions \
     -H "Cookie: SCIX_SESSION_COOKIE_NAME=..."
   ```

3. **Revoke Session**
   ```bash
   curl -X POST http://localhost:8000/api/sessions/revoke \
     -H "Content-Type: application/json" \
     -H "Cookie: SCIX_SESSION_COOKIE_NAME=..." \
     -d '{"sessionId":"abc123"}'
   ```

4. **Health Check**
   ```bash
   curl http://localhost:8000/api/health
   ```

### Redis CLI Testing

```bash
# List all sessions
redis-cli KEYS "session:*"

# Get session data
redis-cli GET "session:{id}"

# List user sessions
redis-cli KEYS "session_index:{userId}:*"

# Check TTL
redis-cli TTL "session:{id}"

# Monitor commands
redis-cli MONITOR
```

## Maintenance

### Cleanup Jobs

Run periodically (e.g., daily):

```javascript
// Clean up orphaned indexes
import { SessionStore } from '@/lib/sessionStore';
const result = await SessionStore.cleanup();
console.log(`Cleaned: ${result.cleaned}, Errors: ${result.errors}`);
```

### Session Statistics

```javascript
import { SessionStore } from '@/lib/sessionStore';
const stats = await SessionStore.getStats();
console.log(`Total sessions: ${stats.totalSessions}`);
console.log(`Total indexes: ${stats.totalIndexes}`);
```

## Future Enhancements

1. **Session Analytics**
   - Most active users
   - Session duration distribution
   - Login patterns

2. **Advanced Features**
   - Remember me tokens
   - Device fingerprinting
   - Anomaly detection
   - Concurrent session limits

3. **Performance**
   - Redis Cluster support
   - Read replicas for session reads
   - Compression for large sessions

## Support

For issues or questions:
1. Check logs: `[session-store]`, `[redis]`, `[initSession]` prefixes
2. Check health endpoint: `/api/health`
3. Check Redis: `redis-cli ping`
4. Review feature flags in logs
5. Disable Redis if needed: `REDIS_SESSIONS_ENABLED=false`
