# Stage 1: Build the React SPA
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for caching
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

# Build argument for backend API URL
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

# Build production bundle
RUN npm run build

# Stage 2: Serve with lightweight Nginx
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
