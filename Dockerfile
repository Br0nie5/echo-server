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

LABEL org.opencontainers.image.source="https://github.com/Br0nie5/echo-server"

WORKDIR /app

COPY --from=deps /app ./

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

COPY docker-health-check.ts /usr/local/bin/docker-health-check.ts

# Defaults set in the environment of the container rather than by the entrypoint: the health check,
# which Docker starts apart from the server, reads the port too, and the directories below are
# created from these paths. The host directories of the logs are chosen by the volumes mounted on
# them, so the paths themselves never need to change.
ENV HTTP_PORT=4000 \
  LOGS_DIR_PATH=/watched_logs \
  SERVER_LOGS_DIR_PATH=/server_logs

# The server runs as the unprivileged `node` user of the base image. It writes to the data and
# server logs directories, owned by it here, as is a new named volume mounted on one of them, and
# the entrypoint writes the runtime env file of the frontend in its dist.
RUN mkdir -p /app/data "$LOGS_DIR_PATH" "$SERVER_LOGS_DIR_PATH" \
  && chown node:node /app/data "$SERVER_LOGS_DIR_PATH" /app/echo_frontend/dist

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node /usr/local/bin/docker-health-check.ts

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "echo_backend/dist/main.js"]
