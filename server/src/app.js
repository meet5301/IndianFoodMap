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
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, "../../client/dist");
const clientIndexPath = path.join(clientDistPath, "index.html");

const hasClientBuild = () => fs.existsSync(clientIndexPath);

const configuredOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
const allowedOrigins = new Set([...defaultOrigins, ...configuredOrigins]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    }
  })
);
app.use(express.json());
app.use(morgan("dev"));

if (hasClientBuild()) {
  app.use(express.static(clientDistPath));
}

app.get("/", (_req, res) => {
  if (hasClientBuild()) {
    return res.sendFile(clientIndexPath);
  }

  return res.json({
    message: "IndiaFoodMap API",
    docs: {
      health: "/api/health",
      vendors: "/api/vendors"
    }
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/vendors", vendorRoutes);

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }

  if (hasClientBuild()) {
    return res.sendFile(clientIndexPath);
  }

  return next();
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
