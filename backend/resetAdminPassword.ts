import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User";

dotenv.config();

const resetAdminPassword = async () => {
  try {
    // 1. Connection
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shreyas";
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected to:", uri.includes("mongodb+srv") ? "Atlas/Remote" : "Localhost");

    const newPassword = "Admin@123"; 
    const adminEmail = "shreyasacademy2025@gmail.com";

    // 2. Find User
    const user = await User.findOne({ email: adminEmail });

    if (!user) {
      console.log(`❌ Admin (${adminEmail}) not found! Check your email spelling.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    // 3. Update & Save (Triggers bcrypt hash in User.ts)
    user.password = newPassword;
    user.role = "admin"; 
    await user.save();

    console.log("\n🎉 Admin credentials updated!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email:   ", adminEmail);
    console.log("🔑 Password:", newPassword);
    console.log("🎭 Role:    ", user.role);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    await mongoose.disconnect();
    console.log("\n👋 Disconnected. You can now log in.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    process.exit(1);
  }
};

resetAdminPassword();