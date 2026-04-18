import { Router } from "express";
import { login, me, register, requestOtp, verifyOtp } from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/otp/request", requestOtp);
router.post("/otp/verify", verifyOtp);
router.get("/me", requireAuth, me);

export default router;
