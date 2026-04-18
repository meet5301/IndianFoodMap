import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const otpStore = new Map();

const signToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  language: user.language,
  isVerified: user.isVerified
});

export const register = async (req, res, next) => {
  try {
    const { name, email, password, language } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() }).lean();
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      language: language || "en"
    });

    const token = signToken(user._id);

    return res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken(user._id);

    return res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    return next(error);
  }
};

export const me = async (req, res) => {
  return res.json({ user: req.user });
};

export const requestOtp = async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ message: "phone is required" });
  }

  const otp = "123456";
  const expirySeconds = Number(process.env.OTP_EXPIRY_SECONDS || 300);

  otpStore.set(phone, {
    otp,
    expiresAt: Date.now() + expirySeconds * 1000
  });

  return res.json({
    message: "OTP generated (mock)",
    otp,
    expiresInSeconds: expirySeconds
  });
};

export const verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ message: "phone and otp are required" });
  }

  const entry = otpStore.get(phone);

  if (!entry || Date.now() > entry.expiresAt) {
    otpStore.delete(phone);
    return res.status(400).json({ message: "OTP expired or not found" });
  }

  if (entry.otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  otpStore.delete(phone);
  return res.json({ message: "OTP verified" });
};
