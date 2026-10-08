# Stage 1: Build the React SPA
FROM registry.access.redhat.com/ubi9/nodejs-20:latest AS builder
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Serve using Red Hat UBI Nginx
FROM registry.access.redhat.com/ubi9/nginx-124:latest

# Copy built application and custom nginx config
COPY --from=builder /app/dist /opt/app-root/src
COPY nginx.conf /etc/nginx/nginx.conf

# Port 8080 for non-root execution
EXPOSE 8080

# Switch to non-root user (standard UBI UID)
USER 1001

CMD ["nginx", "-g", "daemon off;"]
