import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { Order } from "@/models/Order";
import { authOptions } from "@/libs/auth";
import { User } from "@/models/User";

export async function POST(req) {
  try {
    mongoose.connect(process.env.MONGO_URL);
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      orderId,
      totalDeliveryTime,
      preparationTime,
      deliveringTime,
      pendingTime,
      processingTime,
    } = body;

    // Check if user is authorized
    const user = await User.findOne({ email: session.user.email });
    const order = await Order.findById(orderId);

    if (!order) {
      return Response.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    const canManage =
      user?.superAdmin ||
      ((user?.isAdmin || user?.isStaff) &&
        user.branchId?.toString() === order.branchId?.toString());

    if (!canManage) {
      return Response.json(
        { success: false, message: "Not authorized" },
        { status: 403 }
      );
    }

    // Update the order with all time fields
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        totalDeliveryTime,
        preparationTime,
        deliveringTime,
        pendingTime,
        processingTime,
        estimatedDeliveryTime: totalDeliveryTime,
      },
      { new: true }
    );

    return Response.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating delivery time:", error);
    return Response.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
