import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { router } from "./routes";
import { initRedis } from "./lib/redis";
import { validationMiddleware } from "./middleware";

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

    app.listen(PORT, () => {
        console.log(`HTTP server started on port ${PORT}`);
    });
}

start();