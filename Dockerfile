# syntax=docker/dockerfile:1.6

FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@9
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json pnpm-lock.yaml ./
RUN NODE_ENV=development pnpm install --frozen-lockfile
COPY . .
RUN NODE_ENV=production pnpm build

FROM node:20-alpine AS runner
RUN apk add --no-cache curl tini
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S -u 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=5 \
  CMD curl -sfL http://localhost:3000/ -o /dev/null || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
