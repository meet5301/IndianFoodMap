import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";

import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// __dirname setup (ESM fix)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// frontend dist path
const frontendPath = path.join(__dirname, "../../client/dist");

// serve static files
app.use(express.static(frontendPath));

// React routes handle
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

const port = Number(process.env.PORT) || 5000;
const host = process.env.HOST || "0.0.0.0";

const startServer = async () => {
  try {
    await connectDB();

    app.listen(port, host, () => {
      console.log(`Server running on http://${host}:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

startServer();