# === Build Stage ===
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm install tailwind-variants --legacy-peer-deps
RUN \
  if [ -f package-lock.json ]; then npm install --legacy-peer-deps; \
  elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install; \
  elif [ -f yarn.lock ]; then yarn install; \
  else echo "No lockfile found." && exit 1; fi

# Copy source files
COPY . .

ARG NEXT_PUBLIC_AUTH_API_URL
ENV NEXT_PUBLIC_AUTH_API_URL=$NEXT_PUBLIC_AUTH_API_URL

# Build the Next.js app
RUN npm run build

# === Production Stage ===
FROM node:18-alpine AS runner

WORKDIR /app

# Optional: If you use .env.local or other env files
COPY --from=builder /app/.env* ./

# Copy only what's needed to run
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Start the app
CMD ["npm", "start"]
