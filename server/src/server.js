import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";

dotenv.config();

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
