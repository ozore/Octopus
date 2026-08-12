# Clausewright — one immutable image, two process types.
#
# Spec: ARCHITECTURE.md ADR-001, §2.2 factor V (build / release / run strictly
# separated). The corpus bundle and its content hash are baked at BUILD time, not
# read at run time: that is what guarantees an outcome can be attributed to an
# exact corpus version (ADR-008) and what keeps the prompt prefix byte-stable for
# caching (ADR-003).
#
# Factor II: Chromium for the PDF renderer is pinned in the image, never assumed
# on the host.

FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# --- dependencies ------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

FROM base AS build-deps
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# --- build -------------------------------------------------------------------
FROM build-deps AS build
COPY . .
ARG CORPUS_RELEASE=0
ARG PROMPT_BUNDLE_HASH=unbuilt
ARG BUILD_SHA=dev
ENV CORPUS_RELEASE=$CORPUS_RELEASE PROMPT_BUNDLE_HASH=$PROMPT_BUNDLE_HASH BUILD_SHA=$BUILD_SHA
RUN npm run build

# --- runtime -----------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production

# Chromium for the worker's PDF renderer. The branded PDF and the on-screen
# document render from the SAME React component — divergence between them is a
# citation-invariant leak vector (ARCHITECTURE §2.1).
RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium ca-certificates fonts-liberation \
  && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
# The worker runs from source through tsx in the same image, so `web` and
# `worker` are provably the same release.
COPY --from=build --chown=nextjs:nodejs /app/src ./src
COPY --from=build --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=build --chown=nextjs:nodejs /app/drizzle.config.ts /app/tsconfig.json /app/package.json ./
# The corpus CONTENT, not just the code that reads it. `src/lib/corpus/load.ts`
# reads this directory at first use; the web process gets it through Next's file
# tracing (next.config.mjs `outputFileTracingIncludes`) and the worker, which
# runs from source, needs it here. An image without it boots into "corpus
# unreadable" — which is the correct, loud failure, and this is what prevents it.
COPY --from=build --chown=nextjs:nodejs /app/corpus ./corpus

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
