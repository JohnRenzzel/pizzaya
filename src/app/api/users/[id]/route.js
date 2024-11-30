import { User } from "@/models/User";
import { UserInfo } from "@/models/UserInfo";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";

export async function GET(req, { params }) {
  try {
    mongoose.connect(process.env.MONGO_URL);
    const session = await getServerSession(authOptions);
    const { id } = params;

    if (!session) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Find the requesting user to check permissions
    const requestingUser = await User.findOne({ email: session.user.email });
    if (!requestingUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Find the target user
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Find user info
    const userInfo = await UserInfo.findOne({ email: targetUser.email });

    // Combine user and userInfo data
    const userData = {
      ...targetUser.toObject(),
      phone: userInfo?.phone || "",
      streetAddress: userInfo?.streetAddress || "",
      postalCode: userInfo?.postalCode || "",
      city: userInfo?.city || "",
      province: userInfo?.province || "",
    };

    return Response.json(userData);
  } catch (error) {
    console.error("Error fetching user:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
