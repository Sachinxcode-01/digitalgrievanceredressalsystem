# Stage 1: Build Frontend React Bundle
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Install all dependencies (dev + production) for build step
RUN npm ci

# Copy full application codebase
COPY . .

# Set dummy environment variables to satisfy Vite build checks if needed
ENV VITE_SUPABASE_URL=https://placeholder.supabase.co
ENV VITE_SUPABASE_ANON_KEY=placeholder-key

# Build React bundle and run verification script
RUN npm run build

# Stage 2: Serve Bundle via Backend Express Service
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy dependency configs
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built frontend bundle from Stage 1
COPY --from=builder /app/dist ./dist

# Copy backend server files
COPY server ./server

# Expose server listener port
EXPOSE 5000

# Start Express server
CMD ["npm", "start"]
