import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { AreaSeoTemplate } from "./models/AreaSeoTemplate.js";

dotenv.config();

const csvPath = path.resolve(process.cwd(), "../SEO_AHMEDABAD_AREA_SEO_TEMPLATES.csv");

const parseCsvLine = (line) => {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const parseCsv = (raw) => {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return [];
  }

  const [headerLine, ...dataLines] = lines;
  const headers = parseCsvLine(headerLine).map((header) => header.trim());

  return dataLines.map((line) => {
    const cols = parseCsvLine(line);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = cols[index] || "";
    });

    return row;
  });
};

const toKeywords = (value) =>
  String(value || "")
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

const run = async () => {
  await connectDB();

  const rawCsv = await fs.readFile(csvPath, "utf8");
  const rows = parseCsv(rawCsv);

  if (!rows.length) {
    console.log("No rows found in SEO template CSV.");
    process.exit(0);
  }

  const bulkOps = rows
    .filter((row) => row.area && row.slug && row.title && row.meta_description)
    .map((row) => ({
      updateOne: {
        filter: { slug: row.slug },
        update: {
          $set: {
            area: row.area,
            slug: row.slug,
            title: row.title,
            metaDescription: row.meta_description,
            focusKeywords: toKeywords(row.focus_keywords)
          }
        },
        upsert: true
      }
    }));

  if (!bulkOps.length) {
    console.log("No valid rows to import.");
    process.exit(0);
  }

  const result = await AreaSeoTemplate.bulkWrite(bulkOps, { ordered: false });
  const total = await AreaSeoTemplate.countDocuments();

  console.log("---------------------------------------");
  console.log(`SEO area templates imported: ${bulkOps.length}`);
  console.log(`Matched: ${result.matchedCount}`);
  console.log(`Modified: ${result.modifiedCount}`);
  console.log(`Upserted: ${result.upsertedCount}`);
  console.log(`Total templates in DB: ${total}`);
  console.log("Collection: area_seo_templates");
  console.log("---------------------------------------");

  process.exit(0);
};

run().catch((error) => {
  console.error("Failed to import area SEO templates:", error.message);
  process.exit(1);
});
