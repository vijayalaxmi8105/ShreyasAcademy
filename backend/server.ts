import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "./models/User";

dotenv.config();

/* ================= DB ================= */
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shreyas")
  .then(() => console.log("MongoDB connected 🟢"))
  .catch((err) => console.error(err));

/* ================= APP ================= */
const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET =
  process.env.JWT_SECRET || "change-this-secret-in-production";

/* ================= MIDDLEWARE ================= */
/* ✅ FIXED CORS – allow all localhost Vite ports */
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

/* ================= HEALTH ================= */
app.get("/", (_req: Request, res: Response) => {
  res.send("Backend running 🚀");
});

/* ================= SIGNUP ================= */
 app.post("/signup", async (req, res) => {
  try {
    let { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    email = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // 🔥 DO NOT HASH HERE
    await User.create({
      name,
      email,
      phone,
      password, // plain password
    });

    return res.status(201).json({ message: "Signup successful 🎉" });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    return res.status(500).json({ message: "Signup failed" });
  }
});

/* ================= LOGIN ================= */
  app.post("/login", async (req, res) => {
  let { email, password } = req.body;

  email = email.trim().toLowerCase();

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET);
  res.cookie("student_token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  return res.json({ message: "Login successful 🎉" });
});

/* ================= AUTH ================= */
const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.student_token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };

    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

/* ================= PROFILE ================= */
app.get("/profile", verifyToken, async (req: Request, res: Response) => {
  const { userId } = (req as any).user;

  const user = await User.findById(userId).select("-password");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ user });
});

/* ================= LOGOUT ================= */
app.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("student_token", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  return res.json({ message: "Logged out successfully" });
});

/* ================= START ================= */
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
