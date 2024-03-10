
FROM node:20-slim AS base
ENV PNPM_HOME=/pnpm
ENV NEXT_TELEMETRY_DISABLED=1
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PATH="$PNPM_HOME:/app/.bin:/app/node_modules/.bin:$PATH"
ARG GIT_SHA
ENV GIT_SHA="$GIT_SHA"
ENV PORT=8000
ENV SENTRYCLI_SKIP_DOWNLOAD=1
ENV HOSTNAME="0.0.0.0"

RUN corepack enable
RUN rm -f /etc/apt/apt.conf.d/docker-clean; echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
  --mount=type=cache,target=/var/lib/apt,sharing=locked \
  apt update && apt-get --no-install-recommends install -y libc6
USER $USER_ID
WORKDIR /app

FROM base as dev
COPY --link . /app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts --no-optional
ENTRYPOINT ["pnpm", "run", "dev"]

FROM base as unit
COPY --link vitest.config.js /app
COPY --link vitest-setup.ts /app
COPY --link package.json /app
COPY --link tsconfig.json /app
COPY --link logger /app/logger
COPY --link src /app/src
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install vitest
ENTRYPOINT ["vitest"]

FROM base AS build_prod
COPY --link . /app
RUN mkdir -p /app/dist/cache
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts --no-optional --prod
RUN --mount=type=cache,id=nextjs,target=/app/dist/cache pnpm run build

# Production image, copy all the files and run next
FROM base AS prod
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --link --from=build_prod --chown=nextjs:nodejs /app/dist/standalone /app
COPY --link --from=build_prod --chown=nextjs:nodejs /app/dist/static /app/dist/static
COPY --link --from=build_prod --chown=nextjs:nodejs /app/public /app/public
COPY --link --from=build_prod --chown=nextjs:nodejs --chmod=777 /app/dist/cache /app/dist/cache

USER nextjs
EXPOSE 8000
ENTRYPOINT ["node", "server.js"]

FROM mcr.microsoft.com/playwright:v1.42.1-jammy as e2e
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:/app/node_modules/.bin:$PATH"
ARG USER_ID=1001
ARG GROUP_ID=1001
ARG GIT_SHA
ENV GIT_SHA="$GIT_SHA"
ENV PORT=8000
ENV HOSTNAME="0.0.0.0"

RUN usermod -u "$USER_ID" pwuser
RUN usermod -g "$GROUP_ID" pwuser

RUN corepack enable
WORKDIR /app

RUN mkdir /app/screenshots
RUN mkdir /app/test-results
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install @playwright/test playwright @faker-js/faker

# including src so that we can use the same tsconfig.json to reconcile imports (mostly for typings)
COPY --link src /app/src
COPY --link playwright.config.ts /app
COPY --link --chown="$USER_ID:$GROUP_ID" playwright /app/playwright
COPY --link e2e /app/e2e
COPY --link tsconfig.json /app
COPY --link --from=build_prod /app/dist/standalone /app
COPY --link --from=build_prod /app/dist/static /app/dist/static
COPY --link --from=build_prod /app/public /app/public
COPY --link --from=build_prod /app/dist/cache /app/dist/cache

ENTRYPOINT ["playwright"]
CMD ["test"]
