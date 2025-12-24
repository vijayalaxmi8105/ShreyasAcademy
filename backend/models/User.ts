import mongoose from "mongoose";
import bcrypt from "bcrypt";

interface IUser extends mongoose.Document {
  name: string;
  email: string;
  phone: string;
  password: string;
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true },
    password: {
      type: String,
      required: true,
      select: false,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function(this: any) {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

export default mongoose.model<IUser>("User", userSchema);

