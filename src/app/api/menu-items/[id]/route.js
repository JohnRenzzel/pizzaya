import { MenuItem } from "@/models/MenuItem";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    const body = await req.json();

    // Detailed session logging
    console.log("Full session:", session);
    console.log("Session user:", session?.user);

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Simplified authorization check - if they have matching branchId and canManage is true
    const isAuthorized =
      body.canManage && session.user.branchId === body.selectedBranchId;

    console.log("New authorization check:", {
      canManage: body.canManage,
      sessionBranchId: session.user.branchId,
      requestBranchId: body.selectedBranchId,
      isAuthorized: isAuthorized,
    });

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update the menu item
    const updatedItem = await MenuItem.findByIdAndUpdate(
      id,
      { isAvailable: body.available },
      { new: true }
    );

    console.log("Updated item:", updatedItem);

    if (!updatedItem) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating menu item availability:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
