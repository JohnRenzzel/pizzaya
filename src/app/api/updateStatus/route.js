import { Order } from "@/models/Order";
import mongoose from "mongoose";
import { isStaffOrAdmin } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  mongoose.connect(process.env.MONGO_URL);

  const { orderId, status } = await req.json();
  if (!orderId || !status) {
    return new Response(
      JSON.stringify({ message: "Missing orderId or status" }),
      { status: 400 }
    );
  }

  try {
    // Get the order to check the branch
    const order = await Order.findById(orderId);
    if (!order) {
      return new Response(JSON.stringify({ message: "Order not found" }), {
        status: 404,
      });
    }

    // Check if user is authorized for this branch
    const canManage = await isStaffOrAdmin(order.branchId.toString());
    if (!canManage) {
      return new Response(JSON.stringify({ message: "Not authorized" }), {
        status: 403,
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status: status },
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
