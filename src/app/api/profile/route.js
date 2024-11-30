export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { User } from "@/models/User";
import { UserInfo } from "@/models/UserInfo";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    mongoose.connect(process.env.MONGO_URL);
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log("No session found");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Find or create UserInfo
    let userInfo = await UserInfo.findOne({ email: session.user.email });
    if (!userInfo) {
      userInfo = await UserInfo.create({ email: session.user.email });
    }

    // Combine user and userInfo data
    const userData = {
      ...user.toObject(),
      phone: userInfo?.phone || "",
      streetAddress: userInfo?.streetAddress || "",
      postalCode: userInfo?.postalCode || "",
      city: userInfo?.city || "",
      province: userInfo?.province || "",
    };

    console.log("Found user:", user);
    console.log("Found userInfo:", userInfo);
    console.log("Sending userData:", userData);

    return Response.json(userData);
  } catch (error) {
    console.error("Profile API error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req) {
  mongoose.connect(process.env.MONGO_URL);
  const data = await req.json();
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  // Find the logged-in user making the request
  const loggedInUser = await User.findOne({ email: userEmail });

  if (!loggedInUser) {
    return Response.json({ error: "Not authorized" }, { status: 401 });
  }

  // If updating someone else's profile
  if (data._id) {
    // Only allow superAdmin or branch admin to update other users
    if (!loggedInUser.superAdmin && !loggedInUser.isAdmin) {
      return Response.json({ error: "Not authorized" }, { status: 401 });
    }

    try {
      // Split the data between User and UserInfo models
      const userUpdate = {
        name: data.name,
        image: data.image,
      };

      // Handle role updates
      if (loggedInUser.superAdmin) {
        userUpdate.isAdmin = data.isAdmin;
        if (data.isAdmin) {
          userUpdate.branchId = data.branchId;
        }
      }

      if (loggedInUser.isAdmin) {
        userUpdate.isStaff = data.isStaff;
        if (data.isStaff) {
          userUpdate.branchId = loggedInUser.branchId;
        } else {
          userUpdate.branchId = null;
        }
      }

      // Update User model
      const updatedUser = await User.findByIdAndUpdate(data._id, userUpdate, {
        new: true,
      });

      // Update or create UserInfo
      const userInfoUpdate = {
        email: updatedUser.email,
        phone: data.phone,
        streetAddress: data.streetAddress,
        city: data.city,
        postalCode: data.postalCode,
        province: data.province,
      };

      const updatedUserInfo = await UserInfo.findOneAndUpdate(
        { email: updatedUser.email },
        userInfoUpdate,
        { new: true, upsert: true }
      );

      // Combine the updated data for response
      const responseData = {
        ...updatedUser.toObject(),
        phone: updatedUserInfo.phone,
        streetAddress: updatedUserInfo.streetAddress,
        city: updatedUserInfo.city,
        postalCode: updatedUserInfo.postalCode,
        province: updatedUserInfo.province,
      };

      return Response.json(responseData);
    } catch (error) {
      console.error("Error updating user:", error);
      return Response.json({ error: "Error updating user" }, { status: 500 });
    }
  }

  // If updating own profile
  try {
    // Update User model with basic info
    const userUpdate = {
      name: data.name,
      image: data.image,
    };

    const updatedUser = await User.findByIdAndUpdate(
      loggedInUser._id,
      userUpdate,
      { new: true }
    );

    // Update or create UserInfo with additional profile data
    const userInfoUpdate = {
      email: loggedInUser.email,
      phone: data.phone,
      streetAddress: data.streetAddress,
      city: data.city,
      postalCode: data.postalCode,
      province: data.province,
    };

    const updatedUserInfo = await UserInfo.findOneAndUpdate(
      { email: loggedInUser.email },
      userInfoUpdate,
      { new: true, upsert: true }
    );

    // Combine the updated data for response
    const responseData = {
      ...updatedUser.toObject(),
      phone: updatedUserInfo.phone,
      streetAddress: updatedUserInfo.streetAddress,
      city: updatedUserInfo.city,
      postalCode: updatedUserInfo.postalCode,
      province: updatedUserInfo.province,
    };

    return Response.json(responseData);
  } catch (error) {
    console.error("Error updating profile:", error);
    return Response.json({ error: "Error updating profile" }, { status: 500 });
  }
}
