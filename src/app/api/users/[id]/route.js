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

export async function PUT(req, { params }) {
  try {
    mongoose.connect(process.env.MONGO_URL);
    const { id } = params;
    const data = await req.json();

    // Check if user is authorized
    const session = await getServerSession(authOptions);
    const adminUser = await User.findOne({ email: session?.user?.email });
    const targetUser = await User.findById(id);

    if (!adminUser) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Allow both superadmin and branch admin to update users
    const isAuthorized =
      adminUser.superAdmin ||
      (adminUser.isAdmin &&
        adminUser.branchId &&
        (!targetUser.branchId ||
          targetUser.branchId.toString() === adminUser.branchId.toString()));

    if (!isAuthorized) {
      return Response.json({ error: "Not authorized" }, { status: 401 });
    }

    // Prepare user update data
    const userUpdate = {
      name: data.name,
      image: data.image,
    };

    // Handle role updates based on user type
    if (adminUser.superAdmin) {
      // Superadmin can set any role
      userUpdate.isAdmin = data.isAdmin;
      userUpdate.isStaff = data.isStaff;
      userUpdate.branchId = data.branchId;
    } else if (adminUser.isAdmin) {
      // Branch admin can only set staff role for their branch
      userUpdate.isStaff = data.isStaff;
      if (data.isStaff) {
        userUpdate.branchId = adminUser.branchId;
      }
    }

    // Update User model
    const updatedUser = await User.findByIdAndUpdate(id, userUpdate, {
      new: true,
    });

    // Update UserInfo if it exists
    if (updatedUser) {
      await UserInfo.findOneAndUpdate(
        { email: updatedUser.email },
        {
          phone: data.phone,
          streetAddress: data.streetAddress,
          city: data.city,
          postalCode: data.postalCode,
          province: data.province,
        },
        { upsert: true }
      );
    }

    return Response.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
