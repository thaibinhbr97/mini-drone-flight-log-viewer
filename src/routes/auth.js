import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import db from "../db.js";
import { HttpError } from "../errors.js";
import { JWT_SECRET } from "../middleware/auth.js";

const router = Router();

router.post("/register", (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password || password.length < 8) {
        throw new HttpError(400, "email and password (min 8 chars) required");
    }
    try {
        const hash = bcrypt.hashSync(password, 10);
        const info = db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)").run(email, hash);
        res.status(201).json({ id: info.lastInsertRowid, email, role: "operator" });
    } catch (e) {
        if (String(e.message).includes("UNIQUE")) {
            throw new HttpError(409, "Email already registered");
        }
        throw e;
    }
})

router.post("/login", (req, res) => {
    const { email, password } = req.body || {};
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user || !bcrypt.compareSync(password || "", user.password_hash)) {
        throw new HttpError(401, "Invalid credentials");
    }
    const token = jwt.sign( { id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
})

export default router;
