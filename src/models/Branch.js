import { model, models, Schema } from "mongoose";

const BranchSchema = new Schema(
  {
    name: { type: String, required: true },
    image: { type: String },
    location: { type: String, required: true },
    phone: { type: String, required: true },
    about: { type: String, default: "" },
    email: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Branch = models?.Branch || model("Branch", BranchSchema);
