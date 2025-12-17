import { Elysia, t } from "elysia";

export const app = new Elysia({ prefix: "/api" }).get("/user", {
  user: { name: "John" },
});

export const GET = app.fetch;
export const POST = app.fetch;