import dotenv from "dotenv";
dotenv.config(); // Load env vars first

import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import cors from "cors";
import crypto from "crypto";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { Resend } from "resend";
import User from "./models/User.js";



// ===== Authenticated Request Type =====
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    role: string;
    email?: string;
  };
}

// Initialize Resend with null check
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : (() => {
      console.warn("⚠️ RESEND_API_KEY not set. Email functionality disabled.");
      return null;
    })();

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is required");
  process.exit(1);
}

// Initialize Express
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      const allowedOrigins = ["https://shreyas-academy-uggx.vercel.app"];
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

/* ================= AUTH MIDDLEWARE ================= */
const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.student_token;
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
      email?: string;
    };
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user || authReq.user.role !== "admin") {
    return res.status(403).json({ message: "Admins only" });
  }
  next();
};

/* ================= ROUTES ================= */
app.get("/", (_req, res) => res.send("Backend running 🚀"));

/* ================= SIGNUP ================= */
app.post("/signup", async (req: Request, res: Response) => {
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

    // Let User model pre-save hook handle password hashing
    await User.create({ name, email, phone, password });
    res.status(201).json({ message: "Signup successful 🎉" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup failed" });
  }
});

/* ================= LOGIN ================= */
app.post("/login", async (req: Request, res: Response) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }
    
    email = email.trim().toLowerCase();
    const user = await User.findOne({ email }).select("+password");
    
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Use User model's comparePassword method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    res.cookie("student_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ message: "Login successful 🎉", role: user.role });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Login failed." });
  }
});

/* ================= PROFILE ================= */
app.get("/profile", verifyToken, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const user = await User.findById(authReq.user.userId).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });

  let biology = 0;
  let physics = 0;
  let chemistry = 0;
  let total = 0;

  if (user.weeklyMarks && user.weeklyMarks.length > 0) {
    user.weeklyMarks.forEach((week) => {
      biology += week.biologyMarks || 0;
      physics += week.physicsMarks || 0;
      chemistry += week.chemistryMarks || 0;
      total += week.totalMarks || 0;
    });
  }

  res.json({
    user: {
      ...user.toObject(),
      weeklyMarks: user.weeklyMarks,
    },
  });
});

/* ================= ADMIN ROUTES ================= */
app.get("/admin/students", verifyToken, isAdmin, async (_req, res) => {
  const students = await User.find({ role: "student" }).select("-password");
  res.json({ students });
});

app.post("/admin/students/:id/marks", verifyToken, isAdmin, async (req, res) => {
  const { biologyMarks, physicsMarks, chemistryMarks } = req.body;

  const totalMarks = Number(biologyMarks) + Number(physicsMarks) + Number(chemistryMarks);

  const student = await User.findById(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });

  // Get GLOBAL current week
  const allStudents = await User.find();
  const allWeeks = allStudents.flatMap((u) => u.weeklyMarks.map((w) => w.week));
  const currentWeek = allWeeks.length === 0 ? 1 : Math.max(...allWeeks);

  const studentHasThisWeek = student.weeklyMarks.some((w) => w.week === currentWeek);
  const week = studentHasThisWeek ? currentWeek + 1 : currentWeek;

  student.weeklyMarks.push({
    week,
    date: new Date(),
    biologyMarks,
    physicsMarks,
    chemistryMarks,
    totalMarks,
  });

  await student.save();

  res.json({ message: `Week ${week} marks added`, student });
});

app.put("/admin/students/:id/mentor", verifyToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const { mentorName, mentorContactNumber } = req.body;

    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    student.mentorName = mentorName;
    student.mentorContactNumber = mentorContactNumber;

    await student.save();

    return res.json({
      message: "Mentor updated successfully",
      student: {
        _id: student._id,
        mentorName: student.mentorName,
        mentorContactNumber: student.mentorContactNumber,
      },
    });
  } catch (error) {
    console.error("Mentor update error:", error);
    return res.status(500).json({ message: "Failed to update mentor" });
  }
});

/* ================= MAKE ADMIN (SECURE, TYPED) ================= */
app.post("/make-admin", verifyToken, async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email: string };

    const requestingUser = await User.findById((req as AuthenticatedRequest).user.userId);
    if (!requestingUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Valid email is required" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const ADMIN_EMAIL = "shreyasacademy2025@gmail.com";

    if (trimmedEmail !== ADMIN_EMAIL) {
      return res.status(403).json({
        message: "Only authorized emails can become admin",
      });
    }

    if (requestingUser.email.toLowerCase() !== trimmedEmail) {
      return res.status(403).json({
        message: "You can only promote yourself",
      });
    }

    const user = await User.findOneAndUpdate(
      { email: trimmedEmail },
      { role: "admin" },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Successfully promoted to admin! 🎉",
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin promotion error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/logout", (_req, res) => {
  const isProd = process.env.NODE_ENV === "production";

  res.clearCookie("student_token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  });

  res.json({ message: "Logged out successfully" });
});

app.delete("/admin/students/:id", verifyToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (student.role === "admin") {
      return res.status(403).json({ message: "Cannot delete admin accounts" });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      message: `Student ${student.name} has been removed successfully`,
      deletedStudent: {
        name: student.name,
        email: student.email,
      },
    });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({ message: "Failed to delete student" });
  }
});

// TEMPORARY DEBUG ENDPOINT - Remove after fixing
app.get("/debug-admin", async (_req, res) => {
  const user = await User.findOne({
    email: "shreyasacademy2025@gmail.com",
  }).select("+password");

  if (!user) {
    return res.json({ error: "User not found" });
  }

  res.json({
    email: user.email,
    role: user.role,
    passwordHash: user.password,
    passwordLength: user.password?.length || 0,
  });
});

/* ================= PASSWORD RESET ================= */
app.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const trimmedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });
    
    if (!user) {
      return res.json({ message: "If account exists, a reset link has been sent to your email" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
    user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "https://shreyas-academy-uggx.vercel.app";
    const resetLink = `${frontendUrl}/reset-password/${token}`;

    if (resend) {
      try {
        await resend.emails.send({
          from: 'Shreyas Academy <onboarding@resend.dev>',
          to: user.email,
          subject: 'Reset your Shreyas Academy password',
          html: `<p>Click the link below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`
        });
        return res.json({ message: "Reset link sent to your email" });
      } catch (mailError: any) {
        console.error("❌ Resend API Error:", mailError.message);
        return res.status(500).json({ message: "Failed to send email." });
      }
    } else {
      return res.json({ 
        message: "Email service not configured.", 
        ...(process.env.NODE_ENV !== "production" && { resetLink }) 
      });
    }
  } catch (err) {
    res.status(500).json({ message: "An error occurred." });
  }
});

app.post("/reset-password/:token", async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({ 
      resetPasswordToken: hashedToken, 
      resetPasswordExpire: { $gt: new Date() } 
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired link" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Password reset error:", err);
    res.status(500).json({ message: "An error occurred while resetting password" });
  }
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("❌ Server error:", err);
  res.status(500).json({ 
    message: "Internal server error",
    ...(process.env.NODE_ENV !== "production" && { error: err.message })
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Not Found" });
});

// Connect to MongoDB and start server
mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  })
  .then(() => {
    console.log("✅ MongoDB connected");
    
    if (resend) {
      console.log("✅ Resend email service initialized");
    }
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      console.log(`🛑 ${signal} received. Shutting down server...`);
      server.close(() => {
        console.log("💤 Server stopped");
        mongoose.connection.close();
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  })
  .catch((err: any) => {
    console.error("❌ MongoDB connection error:");
    console.error("  Name:", err.name);
    console.error("  Message:", err.message);
    console.error("  Code:", err.code);
    console.error("  CodeName:", err.codeName);
    if (err.reason) {
      console.error("  Reason:", err.reason);
    }
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});
