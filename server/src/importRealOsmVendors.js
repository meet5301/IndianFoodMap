import dotenv from "dotenv";
import slugify from "slugify";
import { connectDB } from "./config/db.js";
import { Vendor } from "./models/Vendor.js";

dotenv.config();

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter"
];

const AHMEDABAD_BOUNDS = {
  south: 22.92,
  west: 72.45,
  north: 23.17,
  east: 72.73
};

const TILE_SIZE = 0.03;

const buildTiles = ({ south, west, north, east }, step) => {
  const tiles = [];

  for (let lat = south; lat < north; lat += step) {
    for (let lon = west; lon < east; lon += step) {
      tiles.push({
        south: Number(lat.toFixed(6)),
        west: Number(lon.toFixed(6)),
        north: Number(Math.min(lat + step, north).toFixed(6)),
        east: Number(Math.min(lon + step, east).toFixed(6))
      });
    }
  }

  return tiles;
};

const buildOverpassQuery = ({ south, west, north, east }) => `
[out:json][timeout:20];
(
  node["amenity"~"restaurant|fast_food|cafe|food_court|street_food"](${south},${west},${north},${east});
  node["shop"~"bakery|deli|convenience"](${south},${west},${north},${east});
);
out body;
`;

const fetchTileElements = async (tile) => {
  const query = buildOverpassQuery(tile);
  let lastError = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
          "User-Agent": "IndiaFoodMap/1.0 (bulk-osm-import)"
        },
        body: query
      });

      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status} from ${endpoint}`);
        continue;
      }

      const payload = await response.json();
      return Array.isArray(payload.elements) ? payload.elements : [];
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("All Overpass endpoints failed");
};

const toMenuItems = (tags) => {
  const cuisine = tags?.cuisine?.trim();
  if (!cuisine) {
    return [];
  }

  return cuisine
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
};

const normalizeElement = (element) => {
  const lat = Number(element.lat ?? element.center?.lat);
  const lon = Number(element.lon ?? element.center?.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  const tags = element.tags || {};
  const name = tags.name?.trim() || tags.brand?.trim() || tags.operator?.trim();

  if (!name) {
    return null;
  }

  const area =
    tags["addr:suburb"] ||
    tags["addr:neighbourhood"] ||
    tags["addr:city_district"] ||
    tags["is_in:suburb"] ||
    "Ahmedabad";

  const city = tags["addr:city"] || "Ahmedabad";
  const category = tags.amenity || tags.shop || "food";
  const osmKey = `${element.type}-${element.id}`;

  return {
    name,
    slug: slugify(`${name}-${area}-${osmKey}`, { lower: true, strict: true, trim: true }),
    city,
    area,
    category,
    priceRange: "low",
    timings: tags.opening_hours || "Not specified",
    isOpenNow: true,
    description: tags.description?.trim() || `Imported from OpenStreetMap (${category}).`,
    imageUrl: "",
    images: [],
    menuItems: toMenuItems(tags),
    submittedBy: `osm-${osmKey}`,
    createdBy: null,
    seoTitle: `${name} in ${area}, ${city}`,
    seoDescription: `${name} listed in ${area}, ${city} via OpenStreetMap open data.`,
    language: "en",
    location: {
      type: "Point",
      coordinates: [lon, lat]
    }
  };
};

const run = async () => {
  await connectDB();

  const tiles = buildTiles(AHMEDABAD_BOUNDS, TILE_SIZE);
  console.log(`Starting OSM import using ${tiles.length} tiles...`);

  const deduped = new Map();
  let failedTiles = 0;

  for (const [index, tile] of tiles.entries()) {
    try {
      const elements = await fetchTileElements(tile);
      for (const element of elements) {
        const key = `${element.type}-${element.id}`;
        if (!deduped.has(key)) {
          deduped.set(key, element);
        }
      }

      console.log(`Tile ${index + 1}/${tiles.length}: +${elements.length} raw elements`);
    } catch (error) {
      failedTiles += 1;
      console.warn(`Tile ${index + 1}/${tiles.length} failed: ${error.message}`);
    }
  }

  const normalized = Array.from(deduped.values())
    .map(normalizeElement)
    .filter(Boolean);

  if (!normalized.length) {
    console.log("No valid named OSM places found to import.");
    process.exit(0);
  }

  const bulkOps = normalized.map((vendor) => ({
    updateOne: {
      filter: { slug: vendor.slug },
      update: { $set: vendor },
      upsert: true
    }
  }));

  const writeResult = await Vendor.bulkWrite(bulkOps, { ordered: false });

  const totalOsmCount = await Vendor.countDocuments({ submittedBy: { $regex: /^osm-/ } });

  console.log("---------------------------------------");
  console.log(`Unique raw elements: ${deduped.size}`);
  console.log(`Normalized vendors: ${normalized.length}`);
  console.log(`Matched existing: ${writeResult.matchedCount}`);
  console.log(`Modified existing: ${writeResult.modifiedCount}`);
  console.log(`Inserted new: ${writeResult.upsertedCount}`);
  console.log(`Failed tiles: ${failedTiles}`);
  console.log(`Total OSM vendors in DB: ${totalOsmCount}`);
  console.log("---------------------------------------");

  process.exit(0);
};

run().catch((error) => {
  console.error("Bulk OSM import failed", error);
  process.exit(1);
});
