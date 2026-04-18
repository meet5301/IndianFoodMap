import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { Vendor } from "./models/Vendor.js";

dotenv.config();

const runCleanup = async () => {
  await connectDB();

  const result = await Vendor.deleteMany({
    $or: [
      { submittedBy: "osm-import" },
      { submittedBy: "admin" },
      { submittedBy: "Demo Admin" }
    ]
  });

  console.log(`Deleted vendors: ${result.deletedCount}`);
  process.exit(0);
};

runCleanup().catch((error) => {
  console.error(error);
  process.exit(1);
});
