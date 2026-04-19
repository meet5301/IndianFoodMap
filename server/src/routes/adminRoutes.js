import { Router } from "express";
import {
  createVendorByAdmin,
  deleteUserByAdmin,
  deleteVendorByAdmin,
  getAdminOverview,
  listUsers,
  listVendorsByAdmin,
  updateUserByAdmin,
  updateVendorByAdmin
} from "../controllers/adminController.js";
import { requireAdmin, requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/overview", getAdminOverview);
router.get("/users", listUsers);
router.put("/users/:id", updateUserByAdmin);
router.delete("/users/:id", deleteUserByAdmin);

router.get("/vendors", listVendorsByAdmin);
router.post("/vendors", createVendorByAdmin);
router.put("/vendors/:id", updateVendorByAdmin);
router.delete("/vendors/:id", deleteVendorByAdmin);

export default router;
