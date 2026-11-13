import { Router } from "express";
import multer from "multer";
import db from "../db.js";
import { HttpError } from "../errors.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// Loads a flight and enforces ownership (admins can see all).
export function loadFlight(req) {
    const flight = db.prepare("SELECT * FROM flights WHERE id = ?").get(req.params.id);
    if (!flight) {
        throw new HttpError(404, "Flight not found");
    }
    if (req.user.role !== "admin" && flight.owner_id !== req.user.id) {
        throw new HttpError(403, "Not allowed");
    }
    return flight;
}

router.post("/", (req, res) => {
    const { drone_id } = req.body || {};
    if (!drone_id) {
        throw new HttpError(400, "drone_id required");
    }
    const info = db.prepare("INSERT INTO flights (owner_id, drone_id) VALUES (?, ?)").run(req.user.id, drone_id);
    const flight = db.prepare("SELECT * FROM flights WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json(flight);
});

router.get("/", (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const where = [];
    const params = [];

    if (req.user.role !== "admin") {
        where.push("owner_id = ?");
        params.push(req.user.id);
    }
    if (req.query.drone_id) {
        where.push("drone_id = ?");
        params.push(req.query.drone_id);
    }
    if (req.query.status) {
        where.push("status = ?");
        params.push(req.query.status);
    }
    if (req.query.cursor) {
        where.push("id < ?");
        params.push(parseInt(req.query.cursor));
    }

    const sql = `
    SELECT * FROM flights
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY id DESC LIMIT ?
    `;
    const rows = db.prepare(sql).all(...params, limit + 1);

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    res.json({ data, next_cursor: hasMore ? data[data.length - 1].id : null });
});

router.get("/:id", (req, res) => {
    res.json(loadFlight(req));
})

const upload = multer({
    dest: "uploads/",
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
    fileFilter: (req, file, cb) => {
        if (!file.originalname.toLowerCase().endsWith(".csv"))
            return cb(new HttpError(400, "Only .csv files are allowed"));
        cb(null, true);
    },
});

router.post(
    "/:id/files",
    (req, res, next) => {
        const flight = loadFlight(req); // 404/403 before we accept any bytes
        if (flight.status === "processing") throw new HttpError(409, "Flight is already processing");
        next();
    },
    upload.single("file"),
    (req, res) => {
        if (!req.file) throw new HttpError(400, "file field is required");
        const flightId = Number(req.params.id);
        db.prepare("UPDATE flights SET status = 'uploaded' WHERE id = ?").run(flightId);
        setImmediate(() => processFlight(flightId, req.file.path));
        res.status(202).json({ id: flightId, status: "uploaded" });
    }
);


export default router;
