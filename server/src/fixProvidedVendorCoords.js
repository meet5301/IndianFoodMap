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

const resolveAreaCoordinates = async (area) => {
  if (!area || area === "Unknown Area") {
    return null;
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", `${area}, Ahmedabad, Gujarat, India`);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "IndiaFoodMap/1.0 (coords-fix)"
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

  const docs = await Vendor.find({ name: { $in: targetNames } });
  let updated = 0;

  for (const doc of docs) {
    const coords = await resolveAreaCoordinates(doc.area);
    if (!coords) {
      continue;
    }

    doc.location = {
      type: "Point",
      coordinates: coords
    };

    await doc.save();
    updated += 1;
  }

  console.log(`Updated coordinates for ${updated} vendor(s).`);
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
