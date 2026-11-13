import jwt from "jsonwebtoken";
import { HttpError } from "../errors.js";

export const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-will-be-changed";

export function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return next(new HttpError(401, "Missing token"));
    try {
        req.user = jwt.verify(token, JWT_SECRET); // { id, role }
        next();
    } catch {
        next(new HttpError(401, "Invalid or expired token"));
    }
}
