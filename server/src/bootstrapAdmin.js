import bcrypt from "bcryptjs";
import { User } from "./models/User.js";

const DEFAULT_ADMIN_EMAIL = "admin@indiafoodmap.in";
const DEFAULT_ADMIN_PASSWORD = "Admin@12345";

export const ensureAdminUser = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase().trim();
  const adminPassword = String(process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD);
  const adminName = process.env.ADMIN_NAME || "IndiaFoodMap Admin";

  const existingAdmin = await User.findOne({ email: adminEmail });

  if (existingAdmin) {
    let changed = false;

    if (existingAdmin.role !== "admin") {
      existingAdmin.role = "admin";
      changed = true;
    }

    if (!existingAdmin.isVerified) {
      existingAdmin.isVerified = true;
      changed = true;
    }

    if (changed) {
      await existingAdmin.save();
      console.log(`Updated admin account role for ${adminEmail}`);
    }

    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await User.create({
    name: adminName,
    email: adminEmail,
    passwordHash,
    role: "admin",
    isVerified: true,
    language: "en"
  });

  console.log(`Created admin account: ${adminEmail}`);
};
