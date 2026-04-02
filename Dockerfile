FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY index.ts ./
COPY middleware ./middleware
COPY repository ./repository
COPY services ./services
COPY utils ./utils
COPY lib ./lib
COPY constants ./constants
COPY types ./types

RUN npm run build \
  && npm prune --omit=dev

FROM node:20-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

USER node
EXPOSE 8080

CMD ["node", "dist/index.js"]
