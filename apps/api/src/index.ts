import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { router } from "./routes";
import { initRedis } from "./lib/redis";
import { validationMiddleware } from "./middleware";
import { websocketHandlers } from "./lib/websocket";

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use("/api/v1", validationMiddleware, router);

const PORT = process.env.PORT || 9000;

app.get("/health", (_req, res) => {
    try {
        return res.status(200).json({
            message: "Service is running",
            date: new Date().toString()
        });
    } catch (err) {
        console.log("Error in /health", err);
        return res.status(500).json({
            error: err,
            message: "Service is not running",
            date: new Date().toString()
        });
    }
});

async function start() {
    try {
        await initRedis();
        console.log("Redis pre-warmed ✓");
    } catch (err) {
        console.error("Redis unavailable at startup:", err);
        process.exit(1);
    }
    const server = Bun.serve({
        port: PORT,
        fetch(req, server) {
            const url = new URL(req.url);
            
            if (url.pathname === "/ws") {
                const cookies = req.headers.get("cookie");
                const token = req.headers.get("x-auth-value") || 
                             (cookies?.split("; ").find(c => c.startsWith("x-auth-value="))?.split("=")[1] ?? null);

                const success = server.upgrade(req, {
                    data: { token }
                });
                
                if (success) return undefined;
            }

            return (app as any)(req);
        },
        websocket: websocketHandlers,
    });

    console.log(`Server started on port ${server.port}`);
}

start();