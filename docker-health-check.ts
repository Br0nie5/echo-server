/**
 * Tells Docker whether the server of the container answers, as its `HEALTHCHECK` command.
 *
 * Node.js runs this file as it is, removing its types itself, so it holds only syntax it can
 * remove (no enum, no namespace). It exits with `0` when the server answers `GET /api/logs`
 * without a session nor a date: a `401` when the authentication is enabled, since the session is
 * checked first, a `400` otherwise, for the missing date. Any other status, a timeout or a
 * connection error exits with `1`. A bare `/api` answers a `404`, and no route answers a `200`
 * without a session, hence this request.
 *
 * It targets the port of `HTTP_PORT`, which the Dockerfile defaults, so that this process, which
 * Docker starts apart from the server, sees the same value as the server does. It throws, hence
 * exits with `1`, when `HTTP_PORT` is not a port. It always targets `localhost`: `SERVER_URL` is
 * the address of the browser, behind a reverse proxy possibly, whose host, port and scheme can
 * all differ from those the server listens on. It uses HTTPS only when `TLS_CERT_PATH` is set.
 */

import http from 'node:http'
import https from 'node:https'

/** How long the server has to answer before it is considered down. */
const REQUEST_TIMEOUT_MILLISECONDS = 3000

/** The highest port number. */
const MAXIMUM_PORT = 65535

/** Gives the port `httpPort`, the value of `HTTP_PORT`, holds, or throws when it holds none. */
const parseHttpPort = (httpPort: string | undefined): number => {
  const port = Number(httpPort)
  if (!httpPort || !Number.isInteger(port) || port < 1 || port > MAXIMUM_PORT) {
    throw new Error(`HTTP_PORT must be an integer between 1 and ${MAXIMUM_PORT}: ${httpPort}`)
  }
  return port
}

const isTlsEnabled = Boolean(process.env.TLS_CERT_PATH)
const port = parseHttpPort(process.env.HTTP_PORT)
const url = new URL('/api/logs', `${isTlsEnabled ? 'https' : 'http'}://localhost:${port}`)
const client = isTlsEnabled ? https : http

const healthRequest = client.request(
  url,
  {
    method: 'GET',
    timeout: REQUEST_TIMEOUT_MILLISECONDS,
    // The certificate is issued for the public host, not for localhost, and may be self-signed.
    rejectUnauthorized: false
  },
  (healthResponse) => {
    const isHealthy = healthResponse.statusCode === 400 || healthResponse.statusCode === 401
    healthResponse.resume()
    process.exit(isHealthy ? 0 : 1)
  }
)

healthRequest.on('timeout', () =>
  healthRequest.destroy(new Error('Health check request timed out'))
)
healthRequest.on('error', () => process.exit(1))
healthRequest.end()
