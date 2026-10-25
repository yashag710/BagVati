# Node.js 24 LTS on Alpine
FROM node:24-alpine

# Set working directory
WORKDIR /app

ENV NODE_ENV=production

# tini runs as PID 1 and forwards SIGTERM, so the app stops promptly on redeploys
RUN apk add --no-cache tini

# Copy package.json and package-lock.json first so the dependency layer is cached
COPY package*.json ./

# Install exact versions from the lockfile, without devDependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy the rest of the app (.dockerignore keeps .env and node_modules out)
COPY --chown=node:node . .

# Run as the image's unprivileged user instead of root
USER node

# The app listens on $PORT (Render sets it); 3000 is the local default
EXPOSE 3000

# Run node directly (not via npm) under tini so shutdown signals reach it
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "app.js"]
