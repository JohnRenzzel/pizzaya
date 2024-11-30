import { Schema, models, model } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
    },
    image: { type: String },
    superAdmin: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    isStaff: { type: Boolean, default: false },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
    userInfo: { type: Schema.Types.ObjectId, ref: "UserInfo" },
  },
  { timestamps: true }
);

export const User = models?.User || model("User", UserSchema);
