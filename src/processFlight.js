import { parse } from "csv-parse/sync";
import fs from "node:fs";
import db from "./db.js";

function toEpochMs(v) {
    if (v === undefined || v === "") return NaN;
    const n = Number(v);
    return Number.isFinite(n) ? n : Date.parse(v);
}

export function processFlight(flightId, filePath) {
    const setStatus = db.prepare("UPDATE flights SET status = ? WHERE id = ?");
    try {
        setStatus.run("processing", flightId);
        
        const records = parse(fs.readFileSync(filePath), {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });

        const insert = db.prepare(
            "INSERT INTO telemtry (flight_id, ts, lat, lon, alt, battery, speed) VALUES (?, ?, ?, ?, ?, ?, ?)"
        );

        let inserted = 0;
        db.transaction(() => {
            db.prepare("DELETE FROM telemetry WHERE flight_id = ?").run(flightId);
            for (const r of records) {
                const ts = toEpochMs(r.timestamp);
                const lat = Number(r.lat);
                const lon = Number(r.lon);
                if (!Number.isFinite(ts) || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
                insert.run(flightId, ts, lat, lon, Number(r.alt), Number(r.battery), Number(r.speed));
                inserted++;
            }
        })();

        if (inserted === 0) throw new Error("No valid rows");
        setStatus.run("ready", flightId);
    } catch (err) {
        console.error(`Processing flight ${flightId} failed:`, err.message);
        setStatus.run("failed", flightId);
    } finally {
        fs.unlink(filePath, () => {});
    }
}
