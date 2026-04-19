import cors from "cors";
import express from "express";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import Vendor from "./models/Vendor.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

// ✅ ESM fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ correct path
const clientDistPath = path.resolve(__dirname, "../../client/dist");

const sanitizeBaseUrl = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
};

const resolvePublicBaseUrl = (req) => {
  const configured = sanitizeBaseUrl(process.env.CLIENT_ORIGIN || process.env.SITE_URL || "");
  if (configured) {
    return configured;
  }

  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  return `${protocol}://${req.get("host")}`;
};

const escapeXml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/robots.txt", (req, res) => {
  const baseUrl = resolvePublicBaseUrl(req);
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${baseUrl}/sitemap.xml`
  ].join("\n");

  res.type("text/plain").send(body);
});

app.get("/sitemap.xml", async (req, res) => {
  const baseUrl = resolvePublicBaseUrl(req);
  const staticRoutes = ["/", "/home", "/find-stall"];

  try {
    const vendors = await Vendor.find({ slug: { $exists: true, $ne: "" } })
      .select("slug updatedAt")
      .sort({ updatedAt: -1 })
      .lean();

    const staticEntries = staticRoutes
      .map((route) => {
        const loc = `${baseUrl}${route}`;
        return [
          "  <url>",
          `    <loc>${escapeXml(loc)}</loc>`,
          "    <changefreq>daily</changefreq>",
          route === "/" ? "    <priority>1.0</priority>" : "    <priority>0.9</priority>",
          "  </url>"
        ].join("\n");
      })
      .join("\n");

    const vendorEntries = vendors
      .map((vendor) => {
        const loc = `${baseUrl}/vendor/${encodeURIComponent(vendor.slug)}`;
        const lastmod = vendor.updatedAt ? new Date(vendor.updatedAt).toISOString() : "";
        return [
          "  <url>",
          `    <loc>${escapeXml(loc)}</loc>`,
          lastmod ? `    <lastmod>${lastmod}</lastmod>` : "",
          "    <changefreq>weekly</changefreq>",
          "    <priority>0.8</priority>",
          "  </url>"
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n");

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      staticEntries,
      vendorEntries,
      "</urlset>"
    ]
      .filter(Boolean)
      .join("\n");

    res.type("application/xml").send(xml);
  } catch (error) {
    res.status(500).type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><error>${escapeXml(error.message)}</error>`);
  }
});

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