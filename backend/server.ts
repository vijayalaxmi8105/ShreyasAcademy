import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import cors from "cors";
import crypto from "crypto";
import nodemailer from "nodemailer";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";
import User from "./models/User";

console.log("🚀 SERVER STARTING...");
dotenv.config();

/* ================= DB ================= */
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shreyas")
  .then(() => console.log("MongoDB connected 🟢"))
  .catch(console.error);

/* ================= APP ================= */
const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

/* ================= MAIL ================= */
let transporter: nodemailer.Transporter | null = null;

// Only create transporter if email credentials are provided
if (process.env.EMAIL && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
    },
    // Add additional options for better Gmail compatibility
    secure: true,
    tls: {
      rejectUnauthorized: false
    }
  });

  // Verify transporter configuration
  transporter.verify((error) => {
    if (error) {
      console.warn("⚠️ Email transporter verification failed:", error.message);
      console.warn("⚠️ Password reset emails will not be sent, but reset links will be generated.");
      console.warn("⚠️ Check your Gmail app password and account settings.");
      console.warn("⚠️ Make sure 2FA is enabled and app password is correct.");
    } else {
      console.log("✅ Email transporter configured successfully");
    }
  });
} else {
  console.warn("⚠️ EMAIL or EMAIL_PASS not configured. Password reset emails will not be sent.");
  console.warn("⚠️ Reset links will be logged to console in development mode.");
}

/* ================= MIDDLEWARE ================= */
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  console.log("Request body:", req.body);
  next();
});

/* ================= HEALTH ================= */
app.get("/", (_req, res) => res.send("Backend running 🚀"));

/* ================= TEST EMAIL ================= */
app.post("/test-email", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!transporter) {
      return res.status(500).json({ message: "Email transporter not configured" });
    }

    console.log("📧 Testing email to:", email);

    await transporter.sendMail({
      from: `"Shreyas Academy" <${process.env.EMAIL}>`,
      to: email,
      subject: "Test Email from Shreyas Academy",
      text: "This is a test email to verify email configuration.",
      html: "<h2>Test Email</h2><p>This is a test email to verify email configuration works.</p>",
    });

    console.log("✅ Test email sent successfully");
    res.json({ message: "Test email sent successfully" });
  } catch (error: any) {
    console.error("❌ Test email failed:", error.message);
    res.status(500).json({ message: "Test email failed", error: error.message });
  }
});

/* ================= SIGNUP ================= */
app.post("/signup", async (req: Request, res: Response) => {
  try {
    let { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    email = email.trim().toLowerCase();

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email already registered" });
    }

    await User.create({ name, email, phone, password });

    res.status(201).json({ message: "Signup successful 🎉" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup failed" });
  }
});

/* ================= LOGIN ================= */
app.post("/login", async (req: Request, res: Response) => {
  let { email, password } = req.body;
  email = email.trim().toLowerCase();

  const user = await User.findOne({ email }).select("+password");
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("student_token", token, {
    httpOnly: true,
    sameSite: "lax",
  });

  res.json({ message: "Login successful 🎉", role: user.role });
});

/* ================= AUTH ================= */
const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.student_token;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    (req as any).user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

/* ================= PROFILE ================= */
app.get("/profile", verifyToken, async (req: Request, res: Response) => {
  const user = await User.findById((req as any).user.userId).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user });
});

/* ================= FORGOT PASSWORD ================= */
console.log("📝 Registering forgot-password route...");
app.post("/forgot-password", async (req: Request, res: Response) => {
  console.log("🚨 FORGOT PASSWORD ROUTE CALLED DIRECTLY");
  console.log("Raw request body:", req.body);
  console.log("Request headers:", req.headers);

  // Temporary simple response
  return res.json({ message: "Route is working", receivedBody: req.body });
});
console.log("✅ Forgot-password route registered");

/* ================= RESET PASSWORD ================= */
app.post("/reset-password/:token", async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    console.log("🔄 Reset password attempt for token:", token ? token.substring(0, 10) + "..." : "undefined");

    // Validate password
    if (!password || typeof password !== "string" || password.length < 6) {
      console.log("❌ Password validation failed");
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Validate token
    if (!token || typeof token !== "string" || token.length !== 64) {
      console.log("❌ Token validation failed");
      return res.status(400).json({ message: "Invalid reset token" });
    }

    // Hash token to compare with DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    console.log("🔍 Looking for user with hashed token:", hashedToken.substring(0, 10) + "...");

    // Find user with valid token and not expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: new Date() },
    });

    if (!user) {
      console.log("❌ No user found with valid token");
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    console.log("✅ Found user:", user.email);

    // Set new password - pre-save hook will hash it
    user.password = password;
    user.markModified('password');

    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    // Save user - this triggers password hashing via pre-save hook
    await user.save();

    console.log("✅ Password reset successful for:", user.email);
    return res.status(200).json({ message: "Password reset successful" });
  } catch (err: any) {
    console.error("❌ Reset password error:", err);
    console.error("❌ Error stack:", err.stack);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
});

// Error handling middleware - must be after all routes
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", err);
  if (!res.headersSent) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

/* ================= START ================= */
app.listen(port, () => {
  console.log(`Server running on port ${port} 🚀`);
});
