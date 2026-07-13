# =============================================================
# Dockerfile — minimal container for Render (or any Docker host)
# =============================================================
FROM node:20-alpine

WORKDIR /app

# Install deps first (layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy app source
COPY . .

# Don't run as root
RUN addgroup -S arc && adduser -S arc -G arc
USER arc

EXPOSE 3001

CMD ["node", "src/index.js"]
