import fs from "fs";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

// __dirname fix (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// frontend build path candidates: preferred server/public, fallback client/dist
const clientBuildCandidates = [
  path.resolve(__dirname, "../public"),
  path.resolve(__dirname, "../../client/dist")
];

const resolveClientBuildPath = () => {
  for (const candidate of clientBuildCandidates) {
    const indexPath = path.join(candidate, "index.html");
    if (fs.existsSync(indexPath)) {
      return candidate;
    }
  }

  return null;
};

const clientDistPath = resolveClientBuildPath();
const clientIndexPath = clientDistPath ? path.join(clientDistPath, "index.html") : null;
const hasClientBuild = () => Boolean(clientIndexPath);

// CORS setup
const configuredOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
const allowedOrigins = new Set([...defaultOrigins, ...configuredOrigins]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      // dev mode → allow all
      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true
  })
);

app.use(express.json());
app.use(morgan("dev"));

// serve frontend (React build)
if (clientDistPath) {
  app.use(express.static(clientDistPath));
}

// API routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/vendors", vendorRoutes);

// root route
app.get("/", (_req, res) => {
  if (hasClientBuild()) {
    return res.sendFile(clientIndexPath);
  }

  return res.json({
    message: "IndiaFoodMap API running",
    endpoints: {
      health: "/api/health",
      vendors: "/api/vendors"
    }
  });
});

// React routing (important)
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();

  if (hasClientBuild()) {
    return res.sendFile(clientIndexPath);
  }

  return res.status(404).json({ message: "Not Found" });
});

// error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;