import { Category } from "../../../models/Category";
import mongoose from "mongoose";
import { isAdmin, isSuperAdmin } from "@/libs/auth";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { User } from "../../../models/User";

export async function POST(req) {
  mongoose.connect(process.env.MONGO_URL);
  const { name, branchId } = await req.json();
  const session = await getServerSession(authOptions);
  const user = await User.findOne({ email: session?.user?.email });

  if (!user?.isAdmin && !user?.superAdmin) {
    return Response.json({ error: "Not authorized" }, { status: 401 });
  }

  const categoryDoc = await Category.create({ name, branchId });
  return Response.json(categoryDoc);
}

export async function GET(req) {
  mongoose.connect(process.env.MONGO_URL);
  const url = new URL(req.url);
  const branchId = url.searchParams.get("branchId");
  const session = await getServerSession(authOptions);
  const user = await User.findOne({ email: session?.user?.email });
  if (branchId) {
    return Response.json(await Category.find({ branchId }));
  }

  if (user?.superAdmin) {
    // Superadmin can see all categories
    return Response.json(await Category.find());
  } else if (user?.isAdmin && user.branchId) {
    // Branch admin can only see their branch categories
    return Response.json(await Category.find({ branchId: user.branchId }));
  }

  return Response.json([]);
}

export async function PUT(req) {
  mongoose.connect(process.env.MONGO_URL);
  const { _id, name, branchId } = await req.json();
  if ((await isAdmin(branchId)) || (await isSuperAdmin())) {
    await Category.updateOne({ _id }, { name });
  }
  return Response.json(true);
}

export async function DELETE(req) {
  mongoose.connect(process.env.MONGO_URL);
  const url = new URL(req.url);
  const _id = url.searchParams.get("_id");
  const branchId = url.searchParams.get("branchId");

  const session = await getServerSession(authOptions);
  const user = await User.findOne({ email: session?.user?.email });

  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Find the category first
  const category = await Category.findById(_id);
  if (!category) {
    return Response.json({ error: "Category not found" }, { status: 404 });
  }

  // Check authorization
  const isAuthorized =
    user.superAdmin ||
    (user.isAdmin &&
      user.branchId?.toString() === category.branchId?.toString());

  if (!isAuthorized) {
    return Response.json(
      { error: "Not authorized to delete this category" },
      { status: 403 }
    );
  }

  try {
    await Category.deleteOne({ _id });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
