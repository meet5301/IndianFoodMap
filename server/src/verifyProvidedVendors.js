import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { Vendor } from "./models/Vendor.js";

dotenv.config();

const targetNames = [
  "Manek chowk food court",
  "New Freezeland",
  "Divine's Food Lab",
  "Ajay's - V S Hospital, Ahmedabad",
  "Karnavati Dabeli Center"
];

const run = async () => {
  await connectDB();

  const docs = await Vendor.find({ name: { $in: targetNames } })
    .select("name area city location")
    .lean();

  console.log(`Found ${docs.length} vendors`);
  for (const doc of docs) {
    const coordinates = Array.isArray(doc.location?.coordinates) ? doc.location.coordinates : [];
    console.log(`${doc.name} | ${doc.area} | ${doc.city} | ${JSON.stringify(coordinates)}`);
  }

  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
