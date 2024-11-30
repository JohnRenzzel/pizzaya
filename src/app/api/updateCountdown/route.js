import { Order } from "@/models/Order";

export async function POST(req) {
  const body = await req.json();
  const { orderId, totalSeconds, totalDuration, status } = body;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    order.countdown = {
      currentTime: totalSeconds,
      lastUpdated: new Date(),
      totalDuration:
        totalDuration || order.countdown?.totalDuration || totalSeconds,
    };

    if (status) {
      order.status = status;
    }

    await order.save();

    return Response.json({
      success: true,
      remainingTime: order.getRemainingTime(),
      countdown: order.countdown,
    });
  } catch (error) {
    console.error("Error updating countdown:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
