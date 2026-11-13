import express from "express";
import authRoutes from "./routes/auth.js";
import flightRoutes from "./routes/flights.js";

const app = express();
app.use(express.json());

app.use("/v1/auth", authRoutes);
app.use("/v1/flights", flightRoutes);

app.use((req, res) => res.status(404).json({ error: { message: "Not found" } }));

// Central error handler: consistent error shape
app.use((err, req, res, next) => {
    let status = err.status || 500;
    let message = err.message;
    if (err.code === "LIMIT_FILE_SIZE") {
        status = 413;
        message = "File too large (max 10 MB)";
    }
    if (status === 500) {
        console.error(err);
        message = "Internal server error";
    }
    res.status(status).json({
        error: { message }
    });
})

export default app;
