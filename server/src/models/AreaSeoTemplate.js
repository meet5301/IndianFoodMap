import mongoose from "mongoose";

const areaSeoTemplateSchema = new mongoose.Schema(
  {
    area: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    metaDescription: {
      type: String,
      required: true,
      trim: true
    },
    focusKeywords: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

areaSeoTemplateSchema.index({ area: 1, slug: 1 }, { unique: true });

export const AreaSeoTemplate = mongoose.model("AreaSeoTemplate", areaSeoTemplateSchema);
