# Образ приложения для сервера. Запуск – deploy/docker-compose.yml.
# Настройки (адрес, ключи, почта) в образ не попадают, их передаёт docker compose при запуске.

FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_OUTPUT=standalone
# Сборка только загружает модули и к базе не подключается, но без адреса модуль базы не загрузится.
RUN DATABASE_URL=postgres://build:build@localhost:5432/build pnpm build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/drizzle ./drizzle
# Загруженные в админке файлы. На сервере сюда подключается вольюм files.
RUN mkdir private && chown node:node private
USER node
EXPOSE 3000
CMD ["node", "server.js"]
