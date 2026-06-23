FROM oven/bun:1
WORKDIR /app

COPY package.json bun.lock tsconfig.json ./
COPY packages ./packages
COPY apps/api ./apps/api
COPY apps/ws ./apps/ws

RUN bun install
RUN touch .env

EXPOSE 9001
CMD ["bun", "run", "start:ws"]
