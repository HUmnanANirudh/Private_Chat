import Express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { router } from "./routes";
import { client, initRedis } from "./lib/redis";

const app = Express();

app.use(cors());
app.use(cookieParser());
app.use(Express.json());
app.use("/api/v1", router);

const PORT = process.env.PORT || 9000;

app.get("/api/v1/health", (_req, res) => {
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