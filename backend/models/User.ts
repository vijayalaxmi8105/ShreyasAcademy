import mongoose, { Schema, Document } from "mongoose";
import * as bcrypt from "bcrypt";

/* ================= INTERFACE ================= */
export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "student" | "admin";

  rollNumber?: string;
  courseName?: string;
  courseStartDate?: string;
  courseEndDate?: string;
  mentorName?: string;
  mentorContactNumber?: string;

  biologyMarks?: number;
  physicsMarks?: number;
  chemistryMarks?: number;
  totalMarks?: number;

  weeklyMarks?: Array<{
    week: number;
    date: Date;
    biologyMarks: number;
    physicsMarks: number;
    chemistryMarks: number;
    totalMarks: number;
  }>;

  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
}

/* ================= SCHEMA ================= */
const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },

    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },

    rollNumber: String,
    courseName: String,
    courseStartDate: String,
    courseEndDate: String,
    mentorName: String,
    mentorContactNumber: String,

    weeklyMarks: [
      {
        week: Number,
        date: { type: Date, default: Date.now },
        biologyMarks: { type: Number, default: 0 },
        physicsMarks: { type: Number, default: 0 },
        chemistryMarks: { type: Number, default: 0 },
        totalMarks: { type: Number, default: 0 },
      },
    ],

    biologyMarks: { type: Number, default: 0 },
    physicsMarks: { type: Number, default: 0 },
    chemistryMarks: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },

    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpire: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

/* ================= PASSWORD HASH ================= */
userSchema.pre("save", function(next: any) {
  // Only hash if password was changed
  if (!this.isModified("password")) {
    return next();
  }

  // Hash password with bcrypt
  bcrypt.hash(this.password, 10, (err, hash) => {
    if (err) {
      return next(err);
    }
    this.password = hash;
    next();
  });
});

const User = mongoose.model<IUser>("User", userSchema);
export default User;
