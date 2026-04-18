import cors from "cors";
import express from "express";
import fs from "fs";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientBuildCandidates = [
  path.resolve(__dirname, "../public"),
  path.resolve(__dirname, "../../client/dist")
];

const resolveClientBuildPath = () => {
  for (const candidate of clientBuildCandidates) {
    if (fs.existsSync(path.join(candidate, "index.html"))) {
      return candidate;
    }
  }

  return null;
};

const clientDistPath = resolveClientBuildPath();
const clientIndexPath = clientDistPath ? path.join(clientDistPath, "index.html") : null;

const isAssetPath = (requestPath) =>
  requestPath.startsWith("/assets/") || /\.(js|mjs|css|map|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|otf)$/i.test(requestPath);

const resolveStaticFilePath = (requestPath) => {
  const safePath = requestPath.replace(/^\/+/, "");

  for (const candidate of clientBuildCandidates) {
    const absolutePath = path.join(candidate, safePath);
    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
      return absolutePath;
    }
  }

  return null;
};
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

if (clientDistPath) {
  app.use(express.static(clientDistPath));
}

app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return next();
  }

  if (!isAssetPath(req.path)) {
    return next();
  }

  const staticFilePath = resolveStaticFilePath(req.path);

  if (!staticFilePath) {
    return next();
  }

  return res.sendFile(staticFilePath, (error) => {
    if (error) {
      next(error);
    }
  });
});

// API routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/vendors", vendorRoutes);

// ✅ React fallback
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ message: "API route not found" });
  }

  if (clientIndexPath) {
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

// error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;