import Express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import roomsRouter from "./routes/rooms.routes";
import "./services/ws.service";

const app = Express();

app.use(cors());
app.use(cookieParser());
app.use(Express.json());

app.use("/api/v1/rooms", roomsRouter);

const PORT = process.env.PORT || 9000;

app.get("/health", (_req, res) => {
    try {
        return res.status(200).json({
            date: new Date().toString(),
            message: "Service is running"
        });
    } catch (err) {
        console.log("Error in /health", err);
        return res.status(500).json({
            date: new Date().toString(),
            message: "Service is not running",
            error: err
        });
    }
});

app.listen(PORT, () => {
    console.log(`HTTP server started on port ${PORT}`);
    console.log(`WebSocket server running on port ${Number(process.env.WS_PORT) || 9001}`);
});