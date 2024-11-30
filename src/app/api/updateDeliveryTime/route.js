import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { Order } from "@/models/Order";
import { authOptions } from "@/libs/auth";
import { User } from "@/models/User";

export async function POST(req) {
  try {
    mongoose.connect(process.env.MONGO_URL);
    const {
      orderId,
      totalDeliveryTime,
      preparationTime,
      deliveringTime,
      pendingTime,
      processingTime,
      totalSeconds,
    } = await req.json();

    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        totalDeliveryTime,
        preparationTime,
        deliveringTime,
        pendingTime,
        processingTime,
        // Update countdown information
        countdown: {
          currentTime: totalSeconds,
          lastUpdated: new Date(),
          totalDuration: totalSeconds,
        },
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
