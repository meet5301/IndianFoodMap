import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db.js";
import { Vendor } from "./models/Vendor.js";
import { User } from "./models/User.js";

dotenv.config();

const seedVendors = [
  {
    name: "Ramesh Vada Pav",
    slug: "ramesh-vada-pav-ahmedabad-1001",
    city: "Ahmedabad",
    area: "Navrangpura",
    category: "Vada Pav",
    language: "hi",
    priceRange: "low",
    timings: "5 PM - 1 AM",
    description: "Local favorite vada pav with garlic chutney.",
    submittedBy: "admin",
    imageUrl: "https://images.unsplash.com/photo-1626776876729-bab4369a5a5f?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1626776876729-bab4369a5a5f?auto=format&fit=crop&w=1000&q=80"
    ],
    menuItems: ["Classic Vada Pav", "Cheese Vada Pav", "Masala Chai"],
    whatsappNumber: "919876543210",
    seoTitle: "Best Vada Pav in Navrangpura Ahmedabad",
    seoDescription: "Ramesh Vada Pav: street-style snacks with budget pricing.",
    location: {
      type: "Point",
      coordinates: [72.5618, 23.0338]
    }
  },
  {
    name: "Janta Pani Puri",
    slug: "janta-pani-puri-ahmedabad-1002",
    city: "Ahmedabad",
    area: "Maninagar",
    category: "Pani Puri",
    language: "en",
    priceRange: "low",
    timings: "4 PM - 11 PM",
    description: "Tangy and spicy pani puri with 6 flavor waters.",
    submittedBy: "admin",
    imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1000&q=80"
    ],
    menuItems: ["Classic Pani Puri", "Dahi Puri", "Sev Puri"],
    whatsappNumber: "919912345678",
    seoTitle: "Popular Pani Puri in Maninagar",
    seoDescription: "Janta Pani Puri offers spicy and tangy flavors all evening.",
    location: {
      type: "Point",
      coordinates: [72.6002, 22.9953]
    }
  }
];

const runSeed = async () => {
  await connectDB();
  await User.deleteMany({});
  await Vendor.deleteMany({});

  const passwordHash = await bcrypt.hash("password123", 10);
  const demoUser = await User.create({
    name: "Demo Admin",
    email: "admin@indiafoodmap.in",
    passwordHash,
    isVerified: true
  });

  const withOwner = seedVendors.map((vendor) => ({
    ...vendor,
    createdBy: demoUser._id,
    submittedBy: demoUser.name
  }));

  await Vendor.insertMany(withOwner);
  console.log("Seed complete");
  console.log("Demo login: admin@indiafoodmap.in / password123");
  process.exit(0);
};

runSeed().catch((error) => {
  console.error(error);
  process.exit(1);
});
