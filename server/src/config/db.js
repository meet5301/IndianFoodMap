import mongoose from "mongoose";

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing in environment variables");
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    });
    console.log("MongoDB connected");
  } catch (error) {
    if (String(error?.message || "").includes("querySrv") || String(error?.code || "").includes("ECONNREFUSED")) {
      throw new Error(
        "MongoDB Atlas connection failed. Check the Atlas host list, username/password, and allow your current IP in Network Access."
      );
    }

    throw error;
  }
};
