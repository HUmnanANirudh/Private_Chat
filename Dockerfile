FROM dhi.io/bun:1
WORKDIR /app

COPY package.json bun.lock tsconfig.json ./

COPY packages ./packages

COPY apps/api ./apps/api
COPY apps/ws ./apps/ws

RUN bun install --frozen-lockfile

RUN touch .env

EXPOSE 9000
EXPOSE 9001

CMD ["bun", "run", "--parallel", "start:api", "start:ws"]
