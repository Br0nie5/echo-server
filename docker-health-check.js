// Runs inside the container via the Dockerfile HEALTH CHECK instruction.
// There's no unauthenticated 200 route to hit, so we call GET /api/logs and
// treat 400 (missing fromDate, when auth is disabled) or 401 (missing/invalid
// auth, when auth is enabled) as "server is up". A bare /api 404s, so it
// can't be used here.

import http from 'http'
import https from 'https'

// Always hit localhost — SERVER_URL may point at a public hostname that isn't
// reachable (or resolvable) from inside the container. HTTP_PORT is the source
// of truth for the port; fall back to the port embedded in SERVER_URL if unset.
const protocol = process.env.SERVER_URL ? new URL(process.env.SERVER_URL).protocol : 'http:'
const port = process.env.HTTP_PORT || (process.env.SERVER_URL && new URL(process.env.SERVER_URL).port) || 4000
const url = new URL('/api/logs', `${protocol}//localhost:${port}`)
const client = url.protocol === 'https:' ? https : http

const healthRequest = client.request(
  url,
  {
    method: 'GET',
    timeout: 3000,
    // Loopback health check only — tolerate self-signed certs set via TLS_CERT_PATH/TLS_KEY_PATH.
    rejectUnauthorized: false,
  },
  (healthResponse) => {
    const healthy = healthResponse.statusCode === 400 || healthResponse.statusCode === 401
    healthResponse.resume()
    process.exit(healthy ? 0 : 1)
  },
)

healthRequest.on('timeout', () => healthRequest.destroy(new Error('Health check request timed out')))
healthRequest.on('error', () => process.exit(1))
healthRequest.end()
