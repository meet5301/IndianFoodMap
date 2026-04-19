import slugify from "slugify";
import mongoose from "mongoose";
import { Vendor } from "../models/Vendor.js";
import { Review } from "../models/Review.js";
import { buildVendorSeoMeta } from "../utils/seoTemplates.js";

const buildSlug = (name, city) => {
  return slugify(`${name}-${city}-${Date.now().toString().slice(-4)}`, {
    lower: true,
    strict: true,
    trim: true
  });
};

const buildStableSlug = (name, area) => {
  return slugify(`${name}-${area}-ahmedabad`, {
    lower: true,
    strict: true,
    trim: true
  });
};

const resolveAreaCoordinates = async (area) => {
  const searchUrl = new URL("https://nominatim.openstreetmap.org/search");
  searchUrl.searchParams.set("q", `${area}, Ahmedabad, Gujarat, India`);
  searchUrl.searchParams.set("format", "json");
  searchUrl.searchParams.set("limit", "1");
  searchUrl.searchParams.set("addressdetails", "1");

  const response = await fetch(searchUrl, {
    headers: {
      "User-Agent": "IndiaFoodMap/1.0 (area-geocode)"
    }
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  if (!Array.isArray(data) || !data.length) {
    return null;
  }

  const match = data[0];
  const lat = Number(match.lat);
  const lon = Number(match.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  return { lat, lon };
};

const maybeResolveSubAreaCoordinates = async (area) => {
  const areaHints = [area, `${area} area`, `${area} locality`, `${area} Ahmedabad`];

  for (const hint of areaHints) {
    const result = await resolveAreaCoordinates(hint);
    if (result) {
      return result;
    }
  }

  return null;
};

const TIME_RANGE_REGEX = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|to|until|till|–|—)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;

const parseTimeToken = (hour, minute = "00", period = "") => {
  const nextHour = Number(hour);
  const nextMinute = Number(minute);

  if (!Number.isFinite(nextHour) || !Number.isFinite(nextMinute)) {
    return null;
  }

  let normalizedHour = nextHour;
  const normalizedPeriod = String(period).toLowerCase();

  if (normalizedPeriod === "am" && normalizedHour === 12) {
    normalizedHour = 0;
  }

  if (normalizedPeriod === "pm" && normalizedHour < 12) {
    normalizedHour += 12;
  }

  if (!normalizedPeriod && normalizedHour > 23) {
    return null;
  }

  return normalizedHour * 60 + nextMinute;
};

const getTimingWindow = (vendor) => {
  const openingTime = String(vendor?.openingTime || "").trim();
  const closingTime = String(vendor?.closingTime || "").trim();

  if (openingTime && closingTime) {
    const openingMatch = openingTime.match(/^(\d{1,2})(?::(\d{2}))?$/);
    const closingMatch = closingTime.match(/^(\d{1,2})(?::(\d{2}))?$/);
    const openMinutes = openingMatch ? parseTimeToken(openingMatch[1], openingMatch[2], "") : null;
    const closeMinutes = closingMatch ? parseTimeToken(closingMatch[1], closingMatch[2], "") : null;

    if (openMinutes !== null && closeMinutes !== null) {
      return { openMinutes, closeMinutes };
    }
  }

  const timings = String(vendor?.timings || "").trim().toLowerCase();

  if (!timings) {
    return null;
  }

  if (/(24\s*hours|24\/7|open\s*all\s*day|round\s*the\s*clock)/i.test(timings)) {
    return { openMinutes: 0, closeMinutes: 24 * 60 };
  }

  const match = timings.match(TIME_RANGE_REGEX);

  if (!match) {
    return null;
  }

  const openMinutes = parseTimeToken(match[1], match[2], match[3]);
  const closeMinutes = parseTimeToken(match[4], match[5], match[6]);

  if (openMinutes === null || closeMinutes === null) {
    return null;
  }

  return { openMinutes, closeMinutes };
};

const isVendorOpenNow = (vendor, referenceDate = new Date()) => {
  const timingWindow = getTimingWindow(vendor);

  if (!timingWindow) {
    return Boolean(vendor?.isOpenNow);
  }

  const currentMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();
  const { openMinutes, closeMinutes } = timingWindow;

  if (openMinutes === closeMinutes) {
    return true;
  }

  if (openMinutes < closeMinutes) {
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  }

  return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
};

const withDerivedOpenStatus = (vendor) => ({
  ...vendor,
  isOpenNow: isVendorOpenNow(vendor)
});

export const resolveAreaLocation = async (req, res, next) => {
  try {
    const area = req.query.area?.trim();

    if (!area) {
      return res.status(400).json({ message: "area is required" });
    }

    const result = await maybeResolveSubAreaCoordinates(area);

    if (!result) {
      return res.status(404).json({ message: "Area location not found" });
    }

    return res.json({
      area,
      coordinates: {
        latitude: result.lat,
        longitude: result.lon
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const getVendors = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 200);
    const skip = (page - 1) * limit;

    const filters = {};
    const hasLocationSearch = Number.isFinite(Number(req.query.lat)) && Number.isFinite(Number(req.query.lng)) && Number.isFinite(Number(req.query.radiusKm)) && Number(req.query.radiusKm) > 0;
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radiusKm = Number(req.query.radiusKm);

    const city = req.query.city?.trim();
    const search = req.query.search?.trim();
    const searchCenter = hasLocationSearch ? { lat, lng } : null;

    if (city) {
      filters.city = { $regex: new RegExp(city, "i") };
    }

    if (req.query.area?.trim()) {
      filters.area = { $regex: new RegExp(req.query.area.trim(), "i") };
    }

    if (search) {
      const term = new RegExp(search, "i");
      filters.$or = [
        { name: { $regex: term } },
        { category: { $regex: term } },
        { area: { $regex: term } },
        { city: { $regex: term } },
        { menuItems: { $elemMatch: { $regex: term } } }
      ];
    }

    if (req.query.category) {
      filters.category = { $regex: new RegExp(req.query.category, "i") };
    }

    if (req.query.language) {
      filters.language = req.query.language;
    }

    if (req.query.owner) {
      filters.submittedBy = { $regex: new RegExp(req.query.owner.trim(), "i") };
    }

    if (hasLocationSearch) {
      filters.location = {
        $geoWithin: {
          $centerSphere: [[lng, lat], Math.max(radiusKm, 0.1) / 6371]
        }
      };
    }

    const vendors = await Vendor.find(filters)
      .sort(hasLocationSearch ? undefined : { createdAt: -1 })
      .lean();

    let normalizedVendors = vendors.map(withDerivedOpenStatus);

    if (req.query.openNow === "true") {
      normalizedVendors = normalizedVendors.filter((vendor) => vendor.isOpenNow);
    }

    if (req.query.openNow === "false") {
      normalizedVendors = normalizedVendors.filter((vendor) => !vendor.isOpenNow);
    }

    if (searchCenter) {
      normalizedVendors.sort((left, right) => {
        const leftCoords = left.location?.coordinates || [];
        const rightCoords = right.location?.coordinates || [];

        if (leftCoords.length < 2 && rightCoords.length < 2) {
          return 0;
        }

        if (leftCoords.length < 2) {
          return 1;
        }

        if (rightCoords.length < 2) {
          return -1;
        }

        const leftDistance = haversineDistanceKm(searchCenter.lat, searchCenter.lng, leftCoords[1], leftCoords[0]);
        const rightDistance = haversineDistanceKm(searchCenter.lat, searchCenter.lng, rightCoords[1], rightCoords[0]);
        return leftDistance - rightDistance;
      });
    }

    const total = normalizedVendors.length;
    const paginatedVendors = normalizedVendors.slice(skip, skip + limit);

    res.json({
      vendors: paginatedVendors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const haversineDistanceKm = (lat1, lng1, lat2, lng2) => {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
};

export const getVendorBySlug = async (req, res, next) => {
  try {
    const { slugOrId } = req.params;
    const query = mongoose.Types.ObjectId.isValid(slugOrId)
      ? { _id: slugOrId }
      : { slug: slugOrId };

    const vendorRecord = await Vendor.findOne(query).lean();

    if (!vendorRecord) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const vendor = withDerivedOpenStatus(vendorRecord);

    const reviews = await Review.find({ vendorId: vendor._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.json({
      vendor,
      reviews,
      share: {
        whatsapp: `https://wa.me/?text=${encodeURIComponent(`Check out ${vendor.name} in ${vendor.area}, ${vendor.city}: ${vendor.slug}`)}`
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const getVendorBySlugOrId = getVendorBySlug;

export const createVendor = async (req, res, next) => {
  try {
    const {
      name,
      city,
      area,
      category,
      priceRange,
      timings,
      openingTime,
      closingTime,
      isOpenNow,
      description,
      imageUrl,
      images,
      menuItems,
      submittedBy,
      whatsappNumber,
      seoTitle,
      seoDescription,
      language,
      latitude,
      longitude
    } = req.body;

    if (!name || !area || !category) {
      return res.status(400).json({ message: "name, area and category are required" });
    }

    if (!Array.isArray(menuItems) || !menuItems.length) {
      return res.status(400).json({ message: "menuItems are required" });
    }

    const resolvedCity = city?.trim() || "Ahmedabad";

    const hasManualCoordinates = Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude));
    const fallbackCoordinates = hasManualCoordinates ? null : await maybeResolveSubAreaCoordinates(area);

    const resolvedCoordinates = hasManualCoordinates
      ? [Number(longitude), Number(latitude)]
      : fallbackCoordinates
        ? [fallbackCoordinates.lon, fallbackCoordinates.lat]
        : [72.5714, 23.0225];

    const nextSeo = buildVendorSeoMeta({
      name,
      area,
      city: resolvedCity,
      category,
      providedTitle: seoTitle,
      providedDescription: seoDescription
    });

    const vendor = await Vendor.create({
      name,
      slug: buildSlug(name, resolvedCity),
      city: resolvedCity,
      area,
      category,
      priceRange,
      timings,
      openingTime,
      closingTime,
      isOpenNow: typeof isOpenNow === "boolean" ? isOpenNow : true,
      description,
      imageUrl,
      images: Array.isArray(images) ? images : [],
      menuItems,
      submittedBy,
      createdBy: req.user?._id || null,
      whatsappNumber,
      seoTitle: nextSeo.seoTitle,
      seoDescription: nextSeo.seoDescription,
      language,
      location: {
        type: "Point",
        coordinates: resolvedCoordinates
      }
    });

    return res.status(201).json({ vendor });
  } catch (error) {
    return next(error);
  }
};

export const updateMyVendor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findOne({ _id: id, createdBy: req.user._id });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const {
      name,
      city,
      area,
      category,
      priceRange,
      timings,
      openingTime,
      closingTime,
      isOpenNow,
      description,
      imageUrl,
      images,
      menuItems,
      whatsappNumber,
      seoTitle,
      seoDescription,
      language,
      latitude,
      longitude
    } = req.body;

    const nextName = name?.trim() || vendor.name;
    const nextCity = city?.trim() || vendor.city || "Ahmedabad";
    const nextArea = area?.trim() || vendor.area;
    const hasManualCoordinates = Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude));
    const fallbackCoordinates = hasManualCoordinates ? null : await maybeResolveSubAreaCoordinates(nextArea);
    const currentCoordinates = vendor.location?.coordinates || [72.5714, 23.0225];

    vendor.name = nextName;
    vendor.city = nextCity;
    vendor.area = nextArea;
    vendor.category = category?.trim() || vendor.category;
    vendor.priceRange = priceRange || vendor.priceRange;
    vendor.timings = timings ?? vendor.timings;
    vendor.openingTime = openingTime ?? vendor.openingTime;
    vendor.closingTime = closingTime ?? vendor.closingTime;
    vendor.isOpenNow = typeof isOpenNow === "boolean" ? isOpenNow : vendor.isOpenNow;
    vendor.description = description ?? vendor.description;
    vendor.imageUrl = imageUrl ?? vendor.imageUrl;
    vendor.images = Array.isArray(images) ? images : vendor.images;
    vendor.menuItems = Array.isArray(menuItems) ? menuItems : vendor.menuItems;
    vendor.whatsappNumber = whatsappNumber ?? vendor.whatsappNumber;

    const nextSeo = buildVendorSeoMeta({
      name: vendor.name,
      area: vendor.area,
      city: vendor.city,
      category: vendor.category,
      providedTitle: seoTitle,
      providedDescription: seoDescription
    });

    vendor.seoTitle = nextSeo.seoTitle;
    vendor.seoDescription = nextSeo.seoDescription;
    vendor.language = language || vendor.language;
    vendor.location = {
      type: "Point",
      coordinates: hasManualCoordinates
        ? [Number(longitude), Number(latitude)]
        : fallbackCoordinates
          ? [fallbackCoordinates.lon, fallbackCoordinates.lat]
          : currentCoordinates
    };

    await vendor.save();

    return res.json({ vendor });
  } catch (error) {
    return next(error);
  }
};

export const deleteMyVendor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findOneAndDelete({ _id: id, createdBy: req.user._id });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    return res.json({ message: "Vendor deleted" });
  } catch (error) {
    return next(error);
  }
};

export const getMyVendors = async (req, res, next) => {
  try {
    const vendors = (await Vendor.find({ createdBy: req.user._id }).sort({ createdAt: -1 }).lean()).map(withDerivedOpenStatus);
    return res.json({ vendors });
  } catch (error) {
    return next(error);
  }
};

export const importAhmedabadVendorsFromOSM = async (req, res, next) => {
  try {
    const area = req.body.area?.trim() || req.query.area?.trim();

    if (!area) {
      return res.status(400).json({ message: "area is required (example: Maninagar)" });
    }

    const searchUrl = new URL("https://nominatim.openstreetmap.org/search");
    searchUrl.searchParams.set("q", `${area}, Ahmedabad, Gujarat, India`);
    searchUrl.searchParams.set("format", "json");
    searchUrl.searchParams.set("limit", "1");

    const geoResponse = await fetch(searchUrl, {
      headers: {
        "User-Agent": "IndiaFoodMap/1.0 (open-data-import)"
      }
    });

    if (!geoResponse.ok) {
      return res.status(502).json({ message: "Failed to fetch area geocode" });
    }

    const geoData = await geoResponse.json();
    if (!Array.isArray(geoData) || !geoData.length) {
      return res.status(404).json({ message: "Area not found in Ahmedabad" });
    }

    const match = geoData[0];
    const [south, north, west, east] = match.boundingbox.map(Number);

    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"~"restaurant|fast_food|cafe|food_court"](${south},${west},${north},${east});
        way["amenity"~"restaurant|fast_food|cafe|food_court"](${south},${west},${north},${east});
        relation["amenity"~"restaurant|fast_food|cafe|food_court"](${south},${west},${north},${east});
      );
      out center;
    `;

    const overpassResponse = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "User-Agent": "IndiaFoodMap/1.0 (open-data-import)"
      },
      body: overpassQuery
    });

    if (!overpassResponse.ok) {
      return res.status(502).json({ message: "Failed to fetch vendors from OSM" });
    }

    const overpassData = await overpassResponse.json();
    const elements = Array.isArray(overpassData.elements) ? overpassData.elements : [];

    const normalized = elements
      .map((element) => {
        const name = element.tags?.name?.trim();
        if (!name) {
          return null;
        }

        const lat = element.lat ?? element.center?.lat;
        const lon = element.lon ?? element.center?.lon;
        if (typeof lat !== "number" || typeof lon !== "number") {
          return null;
        }

        const amenity = element.tags?.amenity || "street food";
        const openingHours = element.tags?.opening_hours || "Not specified";
        const nextSeo = buildVendorSeoMeta({
          name,
          area,
          city: "Ahmedabad",
          category: amenity
        });

        return {
          name,
          slug: buildStableSlug(name, area),
          city: "Ahmedabad",
          area,
          category: amenity,
          priceRange: "low",
          timings: openingHours,
          isOpenNow: true,
          description: "Imported from OpenStreetMap open data.",
          imageUrl: "",
          images: [],
          menuItems: [],
          submittedBy: "osm-import",
          createdBy: req.user?._id || null,
          seoTitle: nextSeo.seoTitle,
          seoDescription: nextSeo.seoDescription,
          language: "en",
          location: {
            type: "Point",
            coordinates: [lon, lat]
          }
        };
      })
      .filter(Boolean);

    if (!normalized.length) {
      return res.status(200).json({ importedCount: 0, message: "No named vendors found in this area" });
    }

    const dedupedByName = Array.from(new Map(normalized.map((vendor) => [vendor.name.toLowerCase(), vendor])).values());

    const bulkOps = dedupedByName.map((vendor) => ({
      updateOne: {
        filter: {
          name: vendor.name,
          city: "Ahmedabad",
          area
        },
        update: {
          $set: vendor
        },
        upsert: true
      }
    }));

    const writeResult = await Vendor.bulkWrite(bulkOps);

    return res.json({
      importedCount: dedupedByName.length,
      matched: writeResult.matchedCount,
      modified: writeResult.modifiedCount,
      upserted: writeResult.upsertedCount,
      source: "OpenStreetMap (ODbL open data)"
    });
  } catch (error) {
    return next(error);
  }
};

export const addReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewerName, rating, comment } = req.body;

    if (!reviewerName || !rating) {
      return res.status(400).json({ message: "reviewerName and rating are required" });
    }

    const vendor = await Vendor.findById(id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const review = await Review.create({
      vendorId: id,
      reviewerName,
      userId: req.user?._id || null,
      rating: Number(rating),
      comment
    });

    const stats = await Review.aggregate([
      { $match: { vendorId: vendor._id } },
      {
        $group: {
          _id: "$vendorId",
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 }
        }
      }
    ]);

    vendor.ratingAverage = Number((stats[0]?.avgRating || 0).toFixed(1));
    vendor.ratingCount = stats[0]?.count || 0;

    await vendor.save();

    return res.status(201).json({ review, ratingAverage: vendor.ratingAverage, ratingCount: vendor.ratingCount });
  } catch (error) {
    return next(error);
  }
};

export const getOverviewStats = async (_req, res, next) => {
  try {
    const [vendors, totalReviews, cities] = await Promise.all([
      Vendor.find({}).lean(),
      Review.countDocuments(),
      Vendor.distinct("city")
    ]);

    return res.json({
      totalVendors: vendors.length,
      totalReviews,
      totalCities: cities.length,
      openNowCount: vendors.map(withDerivedOpenStatus).filter((vendor) => vendor.isOpenNow).length
    });
  } catch (error) {
    return next(error);
  }
};

export const getKnownAreas = async (_req, res, next) => {
  try {
    const areas = await Vendor.distinct("area", { city: { $regex: /^ahmedabad$/i } });
    const fallbackAreas = [
      "Ambawadi",
      "Akhbarnagar",
      "Asarwa",
      "Bapunagar",
      "Bhat",
      "Navrangpura",
      "Maninagar",
      "Vastrapur",
      "Prahlad Nagar",
      "Bopal",
      "Satellite",
      "CG Road",
      "Chandkheda",
      "Kankaria",
      "Gota",
      "Ghodasar",
      "Gurukul",
      "Ghatlodia",
      "Hebatpur",
      "Iscon",
      "Jodhpur",
      "Kalol Highway",
      "Juhapura",
      "Khokhra",
      "Memnagar",
      "Motera",
      "Naranpura",
      "Naroda",
      "Narol",
      "Nehrunagar",
      "Paldi",
      "Prahlad Nagar",
      "Rakhial",
      "Ranip",
      "S G Highway",
      "Sabarmati",
      "Sarkhej",
      "Sarkhej Gandhinagar Highway",
      "Shahibaug",
      "Shilaj",
      "Sola",
      "Thaltej",
      "Usmanpura",
      "Vadaj",
      "Vastral",
      "Vejalpur",
      "Wadaj",
      "Zundal",
      "Naranpura",
      "Bodakdev",
      "Ellisbridge",
      "Law Garden",
      "Makarba",
      "Mithakhali",
      "Nava Vadaj",
      "Old Vadaj",
      "South Bopal",
      "Sindhu Bhavan",
      "S.P. Ring Road",
      "Vaishnodevi Circle",
      "Vatva",
      "Vasna"
    ];

    const merged = Array.from(new Set([...fallbackAreas, ...areas]))
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right));

    return res.json({ areas: merged });
  } catch (error) {
    return next(error);
  }
};

export const getLiveOsmFoodPoints = async (req, res, next) => {
  try {
    const area = req.query.area?.trim();
    const bbox = req.query.bbox?.trim();

    let south;
    let west;
    let north;
    let east;

    if (bbox) {
      const parts = bbox.split(",").map((value) => Number(value.trim()));
      if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value))) {
        return res.status(400).json({ message: "bbox must be south,west,north,east" });
      }
      [south, west, north, east] = parts;
    } else {
      const targetArea = area || "Ahmedabad";
      const geoResult = await maybeResolveSubAreaCoordinates(targetArea);

      if (!geoResult) {
        return res.status(404).json({ message: "Unable to resolve area for OSM lookup" });
      }

      const lat = geoResult.lat;
      const lon = geoResult.lon;
      const delta = 0.035;
      south = lat - delta;
      north = lat + delta;
      west = lon - delta;
      east = lon + delta;
    }

    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"~"restaurant|fast_food|cafe|food_court|street_food"](${south},${west},${north},${east});
        way["amenity"~"restaurant|fast_food|cafe|food_court|street_food"](${south},${west},${north},${east});
        relation["amenity"~"restaurant|fast_food|cafe|food_court|street_food"](${south},${west},${north},${east});
        node["shop"~"bakery|deli|convenience"](${south},${west},${north},${east});
        way["shop"~"bakery|deli|convenience"](${south},${west},${north},${east});
      );
      out center;
    `;

    const overpassEndpoints = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
      "https://lz4.overpass-api.de/api/interpreter"
    ];

    let overpassData = null;
    let overpassError = null;

    for (const endpoint of overpassEndpoints) {
      try {
        const overpassResponse = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
            "User-Agent": "IndiaFoodMap/1.0 (osm-live-points)"
          },
          body: overpassQuery
        });

        if (!overpassResponse.ok) {
          overpassError = new Error(`OSM endpoint failed: ${overpassResponse.status}`);
          continue;
        }

        overpassData = await overpassResponse.json();
        break;
      } catch (error) {
        overpassError = error;
      }
    }

    if (!overpassData) {
      return res.status(502).json({ message: "Failed to fetch live OSM points", error: overpassError?.message });
    }
    const elements = Array.isArray(overpassData.elements) ? overpassData.elements : [];

    const points = elements
      .map((element) => {
        const lat = Number(element.lat ?? element.center?.lat);
        const lon = Number(element.lon ?? element.center?.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          return null;
        }

        const name = element.tags?.name?.trim() || element.tags?.brand?.trim() || "Unnamed food point";
        const category = element.tags?.amenity || element.tags?.shop || "food";
        const address = [element.tags?.["addr:street"], element.tags?.["addr:suburb"]].filter(Boolean).join(", ");
        const openingHours = element.tags?.opening_hours || "";
        const cuisine = element.tags?.cuisine || "";
        const phone = element.tags?.phone || element.tags?.["contact:phone"] || "";
        const website = element.tags?.website || element.tags?.["contact:website"] || "";

        return {
          id: `${element.type}-${element.id}`,
          name,
          category,
          address,
          openingHours,
          cuisine,
          phone,
          website,
          coordinates: {
            latitude: lat,
            longitude: lon
          }
        };
      })
      .filter(Boolean)
      .slice(0, 300);

    return res.json({
      source: "OpenStreetMap via Overpass API (ODbL open data)",
      count: points.length,
      points
    });
  } catch (error) {
    return next(error);
  }
};

export const getOsmPointDetail = async (req, res, next) => {
  try {
    const osmType = req.params.osmType?.trim();
    const osmId = req.params.osmId?.trim();

    if (!osmType || !osmId) {
      return res.status(400).json({ message: "osmType and osmId are required" });
    }

    if (!["node", "way", "relation"].includes(osmType)) {
      return res.status(400).json({ message: "osmType must be node, way, or relation" });
    }

    if (!/^\d+$/.test(osmId)) {
      return res.status(400).json({ message: "osmId must be numeric" });
    }

    const overpassQuery = `
      [out:json][timeout:25];
      ${osmType}(${osmId});
      out center tags;
    `;

    const overpassEndpoints = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
      "https://lz4.overpass-api.de/api/interpreter"
    ];

    let overpassData = null;
    let overpassError = null;

    for (const endpoint of overpassEndpoints) {
      try {
        const overpassResponse = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
            "User-Agent": "IndiaFoodMap/1.0 (osm-point-detail)"
          },
          body: overpassQuery
        });

        if (!overpassResponse.ok) {
          overpassError = new Error(`OSM endpoint failed: ${overpassResponse.status}`);
          continue;
        }

        overpassData = await overpassResponse.json();
        break;
      } catch (error) {
        overpassError = error;
      }
    }

    if (!overpassData) {
      return res.status(502).json({ message: "Failed to fetch OSM point details", error: overpassError?.message });
    }

    const elements = Array.isArray(overpassData.elements) ? overpassData.elements : [];
    const element = elements[0];

    if (!element) {
      return res.status(404).json({ message: "OSM point not found" });
    }

    const lat = Number(element.lat ?? element.center?.lat);
    const lon = Number(element.lon ?? element.center?.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(404).json({ message: "Coordinates not found for this OSM point" });
    }

    const tags = element.tags || {};

    return res.json({
      source: "OpenStreetMap via Overpass API (ODbL open data)",
      point: {
        id: `${element.type}-${element.id}`,
        name: tags.name?.trim() || tags.brand?.trim() || "Unnamed food point",
        category: tags.amenity || tags.shop || "food",
        address: [tags["addr:housenumber"], tags["addr:street"], tags["addr:suburb"], tags["addr:city"]].filter(Boolean).join(", "),
        cuisine: tags.cuisine || "",
        openingHours: tags.opening_hours || "",
        phone: tags.phone || tags["contact:phone"] || "",
        website: tags.website || tags["contact:website"] || "",
        mapsUrl: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}`,
        coordinates: {
          latitude: lat,
          longitude: lon
        },
        tags
      }
    });
  } catch (error) {
    return next(error);
  }
};
