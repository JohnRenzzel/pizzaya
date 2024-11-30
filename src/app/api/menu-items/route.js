import mongoose from "mongoose";
import { MenuItem } from "../../../models/MenuItem";
import { authOptions } from "@/libs/auth";
import { getServerSession } from "next-auth/next";
import { User } from "../../../models/User";
import { authOptions } from "@/libs/auth";

export async function POST(req) {
  mongoose.connect(process.env.MONGO_URL);
  const data = await req.json();
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await User.findOne({ email: userEmail });

  // Check if user is superadmin or the branch admin of the specified branch
  const isAuthorized =
    user?.superAdmin ||
    (user?.isAdmin && user.branchId?.toString() === data.branchId);

  if (!isAuthorized) {
    return Response.json({ error: "Not authorized" }, { status: 401 });
  }

  try {
    // Ensure discount is a number and calculate discounted price
    const discount = parseInt(data.discount) || 0;
    const basePrice = parseFloat(data.basePrice);
    const discountedPrice =
      discount > 0 ? basePrice * (1 - discount / 100) : basePrice;

    const menuItemData = {
      ...data,
      discount: discount,
      discountedPrice: discountedPrice,
    };

    const menuItemDoc = await MenuItem.create(menuItemData);
    return Response.json(menuItemDoc);
  } catch (error) {
    console.error("Error creating menu item:", error);
    return Response.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  mongoose.connect(process.env.MONGO_URL);
  const { _id, ...data } = await req.json();
  const menuItem = await MenuItem.findById(_id);

  const session = await getServerSession(authOptions);
  const user = await User.findOne({ email: session?.user?.email });

  const isAuthorized =
    user?.superAdmin ||
    (user?.isAdmin &&
      user.branchId?.toString() === menuItem.branchId.toString());

  if (!isAuthorized) {
    return Response.json({ error: "Not authorized" }, { status: 401 });
  }

  await MenuItem.findByIdAndUpdate(_id, data);
  return Response.json(true);
}

export async function GET(req) {
  mongoose.connect(process.env.MONGO_URL);
  const url = new URL(req.url);
  const _id = url.searchParams.get("_id");

  if (_id) {
    const menuItem = await MenuItem.findById(_id);
    console.log("API GET MenuItem:", {
      itemId: _id,
      branchId: menuItem?.branchId?.toString(),
      fullItem: menuItem,
    });
    return Response.json(menuItem);
  }

  const branchId = url.searchParams.get("branchId");

  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  const user = await User.findOne({ email: userEmail });

  if (branchId) {
    // If branchId is specified, return menu items for that branch
    return Response.json(await MenuItem.find({ branchId }));
  }

  if (user?.superAdmin) {
    // Superadmin can see all menu items
    return Response.json(await MenuItem.find());
  } else if (user?.isAdmin && user.branchId) {
    // Branch admin can only see their branch's menu items
    return Response.json(await MenuItem.find({ branchId: user.branchId }));
  }

  return Response.json([]);
}

export async function DELETE(req) {
  mongoose.connect(process.env.MONGO_URL);
  const url = new URL(req.url);
  const _id = url.searchParams.get("_id");

  const session = await getServerSession(authOptions);
  const user = await User.findOne({ email: session?.user?.email });

  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const menuItem = await MenuItem.findById(_id);
  if (!menuItem) {
    return Response.json({ error: "Menu item not found" }, { status: 404 });
  }

  const isAuthorized =
    user.superAdmin ||
    (user.isAdmin &&
      user.branchId?.toString() === menuItem.branchId?.toString());

  if (!isAuthorized) {
    return Response.json({ error: "Not authorized" }, { status: 401 });
  }

  await MenuItem.deleteOne({ _id });
  return Response.json({ success: true });
}
