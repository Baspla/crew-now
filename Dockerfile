# Multi-Stage Build für ein optimiertes Next.js Projekt
# Basisimage
FROM oven/bun:1.2.22-slim AS base

# Abhängigkeiten installieren
FROM base AS deps
WORKDIR /app

# Installiere notwendige Build-Tools
RUN apt-get update -y && \
    apt-get install -y libc6-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Kopiere Abhängigkeitsdateien
COPY package.json ./
COPY bun.lock* ./

# Installiere Abhängigkeiten
RUN bun install

# Build Phase
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js Build
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# Produktions-Phase
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Erstellen eines nicht-root Benutzers für verbesserte Sicherheit
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Kopiere nur die notwendigen Dateien für die Produktion
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Wechseln zum nicht-root Benutzer
USER nextjs

# Port-Freigabe und Gesundheitscheck
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Next.js Server starten
CMD ["bun", "server.js"]
