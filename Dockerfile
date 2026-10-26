# The version of .tool-versions, which the CI tests with: change both together.
FROM node:26.12.1-slim AS deps
WORKDIR /app

# The native dependencies come with binaries built for linux-x64 and linux-arm64 (glibc):
# better-sqlite3 has no build step, and bcrypt compiles itself with node-gyp, which needs Python and
# a C++ toolchain, only when none of its binaries fits the platform or the version of Node.js. The
# toolchain is that fallback.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

COPY echo_utilities/ ./echo_utilities/
COPY echo_frontend/ ./echo_frontend/
COPY echo_backend/ ./echo_backend/

RUN npm ci --omit=dev --workspace=echo_backend

FROM node:26.12.1-slim

LABEL org.opencontainers.image.source="https://github.com/Br0nie5/echo-server"

WORKDIR /app

COPY --from=deps /app ./

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

COPY docker-health-check.ts /usr/local/bin/docker-health-check.ts

# Defaults set in the environment of the container rather than by the entrypoint: the health check,
# which Docker starts apart from the server, reads the port too, and the directories below are
# created from these paths. The host directories of the logs and of the self reports are chosen by
# the volumes mounted on them, so the paths themselves never need to change: the entrypoint refuses
# any other one, so change them there too.
ENV HTTP_PORT=4000 \
  LOGS_DIR_PATH=/watched_logs \
  SELF_REPORTS_DIR_PATH=/self_reports

# The server runs as the unprivileged `node` user of the base image. It writes to the data and
# self reports directories, owned by it here, as is a new named volume mounted on one of them, and
# the entrypoint writes the runtime env file of the frontend in its dist.
RUN mkdir -p /app/data "$LOGS_DIR_PATH" "$SELF_REPORTS_DIR_PATH" \
  && chown node:node /app/data "$SELF_REPORTS_DIR_PATH" /app/echo_frontend/dist

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node /usr/local/bin/docker-health-check.ts

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "echo_backend/dist/main.js"]
