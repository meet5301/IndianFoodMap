import bcrypt from "bcryptjs";
import slugify from "slugify";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Vendor } from "../models/Vendor.js";

const buildSlug = (name, city) => {
  return slugify(`${name}-${city}-${Date.now().toString().slice(-4)}`, {
    lower: true,
    strict: true,
    trim: true
  });
};

const parseNumber = (value, fallback) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export const getAdminOverview = async (_req, res, next) => {
  try {
    const [usersCount, vendorsCount, recentUsers, recentVendors] = await Promise.all([
      User.countDocuments(),
      Vendor.countDocuments(),
      User.find({}).sort({ createdAt: -1 }).limit(5).select("name email role createdAt").lean(),
      Vendor.find({}).sort({ createdAt: -1 }).limit(5).select("name area city category createdAt").lean()
    ]);

    return res.json({ usersCount, vendorsCount, recentUsers, recentVendors });
  } catch (error) {
    return next(error);
  }
};

export const listUsers = async (_req, res, next) => {
  try {
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .select("name email role language isVerified createdAt updatedAt")
      .lean();

    return res.json({ users });
  } catch (error) {
    return next(error);
  }
};

export const updateUserByAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, language, isVerified, password } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name !== undefined) {
      user.name = String(name || "").trim() || user.name;
    }

    if (email !== undefined) {
      const normalizedEmail = String(email || "").toLowerCase().trim();
      if (normalizedEmail && normalizedEmail !== user.email) {
        const exists = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } }).lean();
        if (exists) {
          return res.status(409).json({ message: "Email already in use" });
        }
        user.email = normalizedEmail;
      }
    }

    if (role === "admin" || role === "user") {
      user.role = role;
    }

    if (language === "en" || language === "hi") {
      user.language = language;
    }

    if (typeof isVerified === "boolean") {
      user.isVerified = isVerified;
    }

    if (password) {
      if (String(password).length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      user.passwordHash = await bcrypt.hash(String(password), 10);
    }

    await user.save();

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        language: user.language,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteUserByAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (String(req.user._id) === String(id)) {
      return res.status(400).json({ message: "You cannot delete your own admin account" });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await Vendor.updateMany({ createdBy: id }, { $set: { createdBy: null, submittedBy: "admin-removed-user" } });

    return res.json({ message: "User deleted" });
  } catch (error) {
    return next(error);
  }
};

export const listVendorsByAdmin = async (_req, res, next) => {
  try {
    const vendors = await Vendor.find({}).sort({ createdAt: -1 }).lean();
    return res.json({ vendors });
  } catch (error) {
    return next(error);
  }
};

export const createVendorByAdmin = async (req, res, next) => {
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

    const resolvedCity = city?.trim() || "Ahmedabad";
    const lat = parseNumber(latitude, 23.0225);
    const lng = parseNumber(longitude, 72.5714);

    const vendor = await Vendor.create({
      name,
      slug: buildSlug(name, resolvedCity),
      city: resolvedCity,
      area,
      category,
      priceRange: priceRange || "low",
      timings: timings || "Not specified",
      openingTime: openingTime || "",
      closingTime: closingTime || "",
      isOpenNow: typeof isOpenNow === "boolean" ? isOpenNow : true,
      description: description || "",
      imageUrl: imageUrl || "",
      images: Array.isArray(images) ? images : [],
      menuItems: Array.isArray(menuItems) ? menuItems : [],
      whatsappNumber: whatsappNumber || "",
      seoTitle: seoTitle || "",
      seoDescription: seoDescription || "",
      language: language || "en",
      submittedBy: req.user.email || "admin",
      createdBy: req.user._id,
      location: {
        type: "Point",
        coordinates: [lng, lat]
      }
    });

    return res.status(201).json({ vendor });
  } catch (error) {
    return next(error);
  }
};

export const updateVendorByAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid vendor id" });
    }

    const vendor = await Vendor.findById(id);
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

    if (name !== undefined) {
      vendor.name = String(name || "").trim() || vendor.name;
    }

    if (city !== undefined) {
      vendor.city = String(city || "").trim() || vendor.city;
    }

    if (area !== undefined) {
      vendor.area = String(area || "").trim() || vendor.area;
    }

    if (category !== undefined) {
      vendor.category = String(category || "").trim() || vendor.category;
    }

    if (priceRange) {
      vendor.priceRange = priceRange;
    }

    if (timings !== undefined) {
      vendor.timings = timings;
    }

    if (openingTime !== undefined) {
      vendor.openingTime = openingTime;
    }

    if (closingTime !== undefined) {
      vendor.closingTime = closingTime;
    }

    if (typeof isOpenNow === "boolean") {
      vendor.isOpenNow = isOpenNow;
    }

    if (description !== undefined) {
      vendor.description = description;
    }

    if (imageUrl !== undefined) {
      vendor.imageUrl = imageUrl;
    }

    if (Array.isArray(images)) {
      vendor.images = images;
    }

    if (Array.isArray(menuItems)) {
      vendor.menuItems = menuItems;
    }

    if (whatsappNumber !== undefined) {
      vendor.whatsappNumber = whatsappNumber;
    }

    if (seoTitle !== undefined) {
      vendor.seoTitle = seoTitle;
    }

    if (seoDescription !== undefined) {
      vendor.seoDescription = seoDescription;
    }

    if (language === "en" || language === "hi") {
      vendor.language = language;
    }

    if (latitude !== undefined || longitude !== undefined) {
      const currentCoordinates = vendor.location?.coordinates || [72.5714, 23.0225];
      const lat = latitude !== undefined ? parseNumber(latitude, currentCoordinates[1]) : currentCoordinates[1];
      const lng = longitude !== undefined ? parseNumber(longitude, currentCoordinates[0]) : currentCoordinates[0];
      vendor.location = {
        type: "Point",
        coordinates: [lng, lat]
      };
    }

    await vendor.save();

    return res.json({ vendor });
  } catch (error) {
    return next(error);
  }
};

export const deleteVendorByAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid vendor id" });
    }

    const vendor = await Vendor.findByIdAndDelete(id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    return res.json({ message: "Vendor deleted" });
  } catch (error) {
    return next(error);
  }
};
