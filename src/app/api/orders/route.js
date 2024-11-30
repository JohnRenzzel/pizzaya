import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { Order } from "@/models/Order";
import {
  authOptions,
  isAdmin,
  isStaffOrAdmin,
} from "@/app/api/auth/[...nextauth]/route";
import { User } from "@/models/User";

export async function GET(req) {
  mongoose.connect(process.env.MONGO_URL);
  const session = await getServerSession(authOptions);
  const url = new URL(req.url);
  const _id = url.searchParams.get("_id");
  const user = await User.findOne({ email: session?.user?.email });

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  try {
    let orders;
    if (_id) {
      // If specific order ID is requested
      orders = await Order.findById(_id).populate({
        path: "cartProducts._id",
        model: "MenuItem",
        select: "name image basePrice",
      });
    } else {
      // For listing orders
      if (user.superAdmin) {
        // Super admin can see all orders or branch-specific orders
        const branchId = url.searchParams.get("branchId");
        orders = await Order.find(branchId ? { branchId } : {});
      } else if (user.isAdmin || user.isStaff) {
        // Branch admin/staff can only see their branch orders
        orders = await Order.find({ branchId: user.branchId });
      } else {
        // Regular users see their own orders from the selected branch
        const branchId = url.searchParams.get("branchId");
        const query = { userEmail: session.user.email };
        if (branchId) {
          query.branchId = branchId;
        }
        orders = await Order.find(query);
      }
    }

    return Response.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
export async function POST(req) {
  const staffOrAdmin = await isStaffOrAdmin();
  if (!staffOrAdmin) {
    return Response.status(403).json({ error: "Unauthorized" });
  }
  const { orderId, status } = req.body;
  await Order.updateOne({ _id: orderId }, { $set: { status } });
  return Response.json({ message: "Order status updated" });
}
export async function DELETE(req) {
  try {
    mongoose.connect(process.env.MONGO_URL);
    const url = new URL(req.url);
    const _id = url.searchParams.get("_id");

    // Get the current user's session
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user details
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Get the order
    const order = await Order.findById(_id);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    // Check authorization
    const isAuthorized =
      user.superAdmin ||
      ((user.isAdmin || user.isStaff) &&
        user.branchId?.toString() === order.branchId?.toString());

    if (!isAuthorized) {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }

    // Delete the order
    await Order.findByIdAndDelete(_id);

    return Response.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    return Response.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
