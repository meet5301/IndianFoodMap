import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    city: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    area: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    language: {
      type: String,
      enum: ["en", "hi"],
      default: "en"
    },
    priceRange: {
      type: String,
      enum: ["low", "mid", "high"],
      default: "low"
    },
    timings: {
      type: String,
      default: "Not specified"
    },
    openingTime: {
      type: String,
      default: ""
    },
    closingTime: {
      type: String,
      default: ""
    },
    isOpenNow: {
      type: Boolean,
      default: true
    },
    description: {
      type: String,
      maxlength: 500,
      default: ""
    },
    imageUrl: {
      type: String,
      default: ""
    },
    images: {
      type: [String],
      default: []
    },
    menuItems: {
      type: [String],
      default: []
    },
    whatsappNumber: {
      type: String,
      default: ""
    },
    seoTitle: {
      type: String,
      default: ""
    },
    seoDescription: {
      type: String,
      default: ""
    },
    submittedBy: {
      type: String,
      default: "community"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    ratingAverage: {
      type: Number,
      default: 0
    },
    ratingCount: {
      type: Number,
      default: 0
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number],
        default: [72.5714, 23.0225]
      }
    }
  },
  {
    timestamps: true
  }
);

vendorSchema.index({ location: "2dsphere" });

export const Vendor = mongoose.model("Vendor", vendorSchema);
