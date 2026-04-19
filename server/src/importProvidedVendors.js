import dotenv from "dotenv";
import slugify from "slugify";
import { connectDB } from "./config/db.js";
import { Vendor } from "./models/Vendor.js";

dotenv.config();

const normalizeArea = (value) => {
  const area = String(value || "").trim();
    if (!area || /^(?:-|--|—)$/.test(area)) {
    return "Unknown Area";
  }
  return area;
};

const normalizePhone = (value) => {
  const raw = String(value || "").trim();
    if (!raw || /^(?:-|--|—)$/.test(raw)) {
    return "";
  }
  return raw.replace(/[^\d]/g, "");
};

const parseMenuItems = (value) => {
  return String(value || "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseTimeRange = (value) => {
  const cleaned = String(value || "")
    .replace(/[\u2013\u2014]/g, "-")
    .trim();

  const [openingTime = "", closingTime = ""] = cleaned.split("-").map((part) => part.trim());
  return { openingTime, closingTime };
};

const rawVendors = [
  {
    name: "Manek chowk food court",
    area: "Gota",
    phone: "",
    menu: "Pav Bhaji; Chai; Dosa; Sandwich",
    timing: "05:00-05:00"
  },
  {
    name: "New Freezeland",
    area: "Ellisbridge",
    phone: "0777807709",
    menu: "Sandwich; Pav Bhaji; Juice",
    timing: "10:30-23:00"
  },
  {
    name: "Divine's Food Lab",
    area: "Shahibaug",
    phone: "",
    menu: "Vada Pav; Sandwich; Frankie",
    timing: "10:00-22:00"
  },
  {
    name: "Ajay's - V S Hospital, Ahmedabad",
    area: "Ellisbridge",
    phone: "0851100288",
    menu: "Chai; Sandwich; Samosa; Juice",
    timing: "10:30-22:30"
  },
  {
    name: "Karnavati Dabeli Center",
    area: "",
    phone: "0997453510",
    menu: "Dabeli; Juice; Sandwich",
    timing: "11:00-21:00"
  }
];

const toVendorPayload = (row, index) => {
  const area = normalizeArea(row.area);
  const menuItems = parseMenuItems(row.menu);
  const { openingTime, closingTime } = parseTimeRange(row.timing);
  const category = menuItems[0] || "Street Food";

  return {
    name: row.name,
    slug: slugify(`${row.name}-${area}-provided-${index + 1}`, { lower: true, strict: true, trim: true }),
    city: "Ahmedabad",
    area,
    category,
    language: "en",
    priceRange: "low",
    timings: row.timing,
    openingTime,
    closingTime,
    isOpenNow: true,
    description: "Verified vendor record provided by owner.",
    imageUrl: "",
    images: [],
    menuItems,
    whatsappNumber: normalizePhone(row.phone),
    seoTitle: `${row.name} in ${area}, Ahmedabad`,
    seoDescription: `${row.name} food stall in ${area}, Ahmedabad.`,
    submittedBy: "provided-data",
    location: {
      type: "Point",
      coordinates: [72.5714, 23.0225]
    }
  };
};

const run = async () => {
  await connectDB();

  const payload = rawVendors.map(toVendorPayload);

  const ops = payload.map((vendor) => ({
    updateOne: {
      filter: { name: vendor.name, city: vendor.city, area: vendor.area },
      update: { $set: vendor },
      upsert: true
    }
  }));

  const result = await Vendor.bulkWrite(ops);

  console.log("Provided vendor import complete");
  console.log(`Matched: ${result.matchedCount}`);
  console.log(`Modified: ${result.modifiedCount}`);
  console.log(`Upserted: ${result.upsertedCount}`);

  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
