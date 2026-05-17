import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { router } from "./routes";
import { initRedis } from "./lib/redis";
import { validationMiddleware } from "./middleware";
import http from "http";
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


    const server = http.createServer(app);

    server.on("upgrade", (req, socket, head) => {
        const url = new URL(req.url || "", `http://${req.headers.host}`);

        if (url.pathname !== "/ws") {
            socket.destroy();
            return;
        }
        const cookie = req.headers.cookie;
        const token = cookie?.split(";").find((c: string) => c.trim().startsWith("x-auth-value="))?.split("=")[1] || null;

        (Bun as any).upgrade(req, {
            data: {
                token,
            },
            websocket: websocketHandlers,
        });
    });
    server.listen(PORT, () => {
        console.log(`Server (HTTP+ws) is running on port ${PORT}`);
    })
}

start();