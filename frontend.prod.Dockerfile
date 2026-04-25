# Production Dockerfile for the frontend, used when deploying to Cloud Run.
# For local dev, docker-compose builds frontend.Dockerfile (npm run dev).

# Stage 1 — build static assets
FROM node:20-bookworm-slim AS build
WORKDIR /app

ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2 — serve via nginx
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/templates/default.conf.template

ENV PORT=8080
EXPOSE 8080

# envsubst injects the Cloud Run-provided $PORT into the nginx config at start.
CMD ["/bin/sh", "-c", "envsubst '$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
