import cors from "cors";
import express from "express";
import morgan from "morgan";
import path from "path";

import authRoutes from "./routes/authRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

// ✅ IMPORTANT: root से client/dist लो
const clientDistPath = path.resolve(__dirname, "../../client/dist");
// CORS
const configuredOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const defaultOrigins = ["http://localhost:5173"];
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

      return callback(new Error("CORS not allowed"));
    },
    credentials: true
  })
);

app.use(express.json());
app.use(morgan("dev"));

// ✅ STATIC FILES (MAIN FIX)
app.use(express.static(clientDistPath));

// API
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/vendors", vendorRoutes);

// ✅ React fallback
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ message: "API route not found" });
  }

  res.sendFile(path.join(clientDistPath, "index.html"));
});

// errors
app.use(notFoundHandler);
app.use(errorHandler);

export default app;