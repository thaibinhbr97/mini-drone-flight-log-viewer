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
    const status = err.status || 500;
    if (status === 500) console.log(err);
    res.status(status).json({
        error: { message: status === 500 ? "Internal server error" : err.message },
    });
})

export default app;
