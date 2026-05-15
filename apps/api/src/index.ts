import Express from "express";
import cors from "cors";
import { client } from "./lib/redis"
const app = Express();
app.use(cors())
const PORT = process.env.PORT || 9000
const date = new Date().toString()

// app.use("/api/v1",router)

app.get("/health", (_req, res) => {
    try {
        return res.status(200).json({
            date: date,
            message: "Service is running"
        })
    } catch (err) {
        console.log("Error in /health", err)
        return res.status(500).json({
            date: date,
            message: "Service is not running",
            error: err
        })
    }
})

app.listen(PORT, () => {
    console.log("Server started on port:" + `${PORT}`);
})

async function StartServer(): Promise<void> {
    try {
        await client.connect();
        await client.set("test:key", "hello world");

        const value = await client.get("test:key")
        console.log(value)

        const exist = await client.exists("test:key")
        console.log(exist)

        await client.del("test:key")
        console.log("test key deleted")
    } catch (err) {
        console.log("Error in redis", err)
    }
}

StartServer()