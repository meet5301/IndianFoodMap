import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    language: {
      type: String,
      enum: ["en", "hi"],
      default: "en"
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model("User", userSchema);
