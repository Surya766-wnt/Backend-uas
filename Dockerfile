FROM node:20-alpine AS base

# Backend
FROM base AS backend-deps
WORKDIR /app/backend
COPY nest-js/package*.json ./
RUN npm ci

FROM base AS backend-build
WORKDIR /app/backend
COPY --from=backend-deps /app/backend/node_modules ./node_modules
COPY nest-js/ ./
RUN npm run build

# Frontend
FROM base AS frontend-deps
WORKDIR /app/frontend
COPY next-js/package*.json ./
RUN npm ci

FROM base AS frontend-build
WORKDIR /app/frontend
COPY --from=frontend-deps /app/frontend/node_modules ./node_modules
COPY next-js/ ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production
FROM base AS production
WORKDIR /app

RUN apk add --no-cache curl

COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules
COPY --from=backend-build /app/backend/package.json ./backend/
COPY --from=frontend-build /app/frontend/.next/standalone ./
COPY --from=frontend-build /app/frontend/.next/static ./frontend/.next/static
COPY --from=frontend-build /app/frontend/public ./frontend/public

WORKDIR /app/backend
EXPOSE 3000

CMD ["node", "dist/main.js"]
