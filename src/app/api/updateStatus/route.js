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

    // First, get the order to check its branchId
    const order = await Order.findById(orderId);
    if (!order) {
      return new Response(JSON.stringify({ message: "Order not found" }), {
        status: 404,
      });
    }

    // Verify authorization with the order's branchId
    const isAuthorized = await checkStaffOrAdmin(order.branchId.toString());
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
