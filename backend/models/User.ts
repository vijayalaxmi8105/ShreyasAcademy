import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

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
  
  // Weekly marks tracking
  weeklyMarks: Array<{
    week: number;
    date: Date;
    biologyMarks: number;
    physicsMarks: number;
    chemistryMarks: number;
    totalMarks: number;
  }>;
  
  // Latest/current marks (for quick display)
  biologyMarks?: number;
  physicsMarks?: number;
  chemistryMarks?: number;
  totalMarks?: number;
  
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["student", "admin"], default: "student" },
    
    rollNumber: String,
    courseName: String,
    courseStartDate: String,
    courseEndDate: String,
    mentorName: String,
    mentorContactNumber: String,
    
    weeklyMarks: [{
      week: Number,
      date: { type: Date, default: Date.now },
      biologyMarks: { type: Number, default: 0 },
      physicsMarks: { type: Number, default: 0 },
      chemistryMarks: { type: Number, default: 0 },
      totalMarks: { type: Number, default: 0 }
    }],
    
    biologyMarks: { type: Number, default: 0 },
    physicsMarks: { type: Number, default: 0 },
    chemistryMarks: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

export default mongoose.model<IUser>("User", userSchema);