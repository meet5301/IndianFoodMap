import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { Vendor } from "./models/Vendor.js";

dotenv.config();

const resolveByName = async (name) => {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", `${name}, Ahmedabad, Gujarat, India`);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "IndiaFoodMap/1.0 (name-geocode-fix)"
    }
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  if (!Array.isArray(payload) || !payload.length) {
    return null;
  }

  const lat = Number(payload[0].lat);
  const lon = Number(payload[0].lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  return [lon, lat];
};

const run = async () => {
  await connectDB();

  const doc = await Vendor.findOne({ name: "Karnavati Dabeli Center" });
  if (!doc) {
    console.log("Vendor not found");
    process.exit(0);
  }

  const coords = await resolveByName(doc.name);
  if (!coords) {
    console.log("No coordinates resolved by name");
    process.exit(0);
  }

  doc.location = {
    type: "Point",
    coordinates: coords
  };

  await doc.save();
  console.log(`Updated ${doc.name} -> ${JSON.stringify(coords)}`);
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
