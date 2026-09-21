FROM node:24-slim AS deps
WORKDIR /app

# better-sqlite3 has no prebuilt binary for this platform/Node version yet,
# so it needs to be compiled from source with node-gyp (requires Python + a C++ toolchain).
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

COPY echo_utilities/ ./echo_utilities/
COPY echo_frontend/ ./echo_frontend/
COPY echo_backend/ ./echo_backend/

RUN npm ci --omit=dev --workspace=echo_backend

FROM node:24-slim
WORKDIR /app

COPY --from=deps /app ./

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

COPY docker-health-check.js /usr/local/bin/docker-health-check.js

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node /usr/local/bin/docker-health-check.js

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "echo_backend/dist/server.js"]