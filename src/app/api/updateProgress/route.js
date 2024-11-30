import { Order } from "@/models/Order";
import mongoose from "mongoose";

export async function POST(req) {
  mongoose.connect(process.env.MONGO_URL);

  const { orderId, progress } = await req.json();

  if (!orderId || progress === undefined) {
    return new Response(
      JSON.stringify({ message: "Missing orderId or progress" }),
      { status: 400 }
    );
  }

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        "progressBar.currentProgress": progress,
        "progressBar.lastUpdated": new Date(),
      },
      { new: true }
    );

    if (!updatedOrder) {
      return new Response(JSON.stringify({ message: "Order not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ order: updatedOrder }), {
      status: 200,
    });
  } catch (error) {
    console.error("Failed to update progress:", error);
    return new Response(
      JSON.stringify({ message: "Failed to update progress" }),
      { status: 500 }
    );
  }
}
