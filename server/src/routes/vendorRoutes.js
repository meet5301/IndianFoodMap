import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  addReview,
  createVendor,
  deleteMyVendor,
  getMyVendors,
  getKnownAreas,
  getOverviewStats,
  getLiveOsmFoodPoints,
  getOsmPointDetail,
  getVendorBySlugOrId,
  getVendors,
  importAhmedabadVendorsFromOSM,
  updateMyVendor,
  resolveAreaLocation
} from "../controllers/vendorController.js";

const router = Router();

router.get("/stats/overview", getOverviewStats);
router.get("/areas", getKnownAreas);
router.get("/areas/resolve", resolveAreaLocation);
router.get("/osm/live", getLiveOsmFoodPoints);
router.get("/osm/detail/:osmType/:osmId", getOsmPointDetail);
router.get("/mine", requireAuth, getMyVendors);
router.post("/import/osm", requireAuth, importAhmedabadVendorsFromOSM);
router.get("/", getVendors);
router.post("/", requireAuth, createVendor);
router.put("/:id", requireAuth, updateMyVendor);
router.delete("/:id", requireAuth, deleteMyVendor);
router.get("/:slugOrId", getVendorBySlugOrId);
router.post("/:id/reviews", addReview);

export default router;
