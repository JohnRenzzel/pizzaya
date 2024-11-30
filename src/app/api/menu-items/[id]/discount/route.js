import { MenuItem } from "@/models/MenuItem";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  try {
    mongoose.connect(process.env.MONGO_URL);
    const { id } = params;
    const { discount } = await req.json();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      );
    }

    const canManagePrice =
      session.user.superAdmin ||
      ((session.user.isAdmin || session.user.isStaff) &&
        session.user.branchId === menuItem.branchId.toString());

    if (!canManagePrice) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Calculate the new discounted price
    const discountedPrice = menuItem.basePrice * (1 - discount / 100);

    // Update both discount and discounted price
    menuItem.discount = discount;
    menuItem.discountedPrice = discountedPrice;
    await menuItem.save();

    return NextResponse.json(menuItem);
  } catch (error) {
    console.error("Error updating price:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
