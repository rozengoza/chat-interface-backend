# =============================================================
# Dockerfile — for any container-based host (Fly.io, etc.)
# fly.io free tier: 3 shared-cpu VMs, 256MB RAM each
# =============================================================
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy source
COPY . .

# Don't run as root
RUN addgroup -S arc && adduser -S arc -G arc
USER arc

EXPOSE 3001

CMD ["node", "src/index.js"]
