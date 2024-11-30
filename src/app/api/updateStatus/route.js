import { Order } from "@/models/Order";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { User } from "@/models/User";

async function checkStaffOrAdmin(branchId) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  if (!userEmail) {
    return false;
  }
  const user = await User.findOne({ email: userEmail });
  if (!user) {
    return false;
  }
  return (
    user.superAdmin ||
    ((user.isAdmin || user.isStaff) && user.branchId?.toString() === branchId)
  );
}

export async function POST(req) {
  try {
    mongoose.connect(process.env.MONGO_URL);
    const { orderId, status, totalSeconds } = await req.json();

    // Verify authorization
    const isAuthorized = await checkStaffOrAdmin();
    if (!isAuthorized) {
      return new Response(JSON.stringify({ message: "Not authorized" }), {
        status: 403,
      });
    }

    // Update order with new status and countdown
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        status: status,
        updatedAt: new Date(),
        // Set the countdown when updating status
        $set: {
          "countdown.currentTime": totalSeconds,
          "countdown.lastUpdated": new Date(),
          "countdown.totalDuration": totalSeconds,
        },
      },
      { new: true }
    );

    return new Response(JSON.stringify({ order: updatedOrder }), {
      status: 200,
    });
  } catch (error) {
    console.error("Failed to update order status:", error);
    return new Response(
      JSON.stringify({ message: "Failed to update order status" }),
      { status: 500 }
    );
  }
}
