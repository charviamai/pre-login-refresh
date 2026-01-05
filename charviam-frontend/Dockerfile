# ============================================================================
# Stage 1: Build the React application
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables (passed from docker-compose)
ARG VITE_API_URL=https://api.arcadex.charviam.com/api
ARG VITE_PALM_BRIDGE_URL=
ARG VITE_GEOAPIFY_API_KEY=fd6e0d4219d64047a76260582eafb50e
ARG VITE_VAPID_PUBLIC_KEY=

# Set environment variables for the build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_PALM_BRIDGE_URL=$VITE_PALM_BRIDGE_URL
ENV VITE_GEOAPIFY_API_KEY=$VITE_GEOAPIFY_API_KEY
ENV VITE_VAPID_PUBLIC_KEY=$VITE_VAPID_PUBLIC_KEY

# Build the application
RUN npm run build

# ============================================================================
# Stage 2: Serve with Nginx
# ============================================================================
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
