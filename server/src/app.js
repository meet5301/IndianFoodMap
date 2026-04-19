import cors from "cors";
import express from "express";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

// ✅ ESM fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ correct path
const clientDistPath = path.resolve(__dirname, "../../client/dist");

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// serve frontend
app.use(express.static(clientDistPath));

// API
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vendors", vendorRoutes);

// React fallback
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ message: "API route not found" });
  }

  res.sendFile(path.join(clientDistPath, "index.html"));
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;