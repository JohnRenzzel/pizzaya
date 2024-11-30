import { Branch } from "@/models/Branch";
import mongoose from "mongoose";
import { isAdmin } from "@/libs/auth";

export async function POST(req) {
  mongoose.connect(process.env.MONGO_URL);
  const data = await req.json();
  if (await isAdmin(data.branchId)) {
    const branchDoc = await Branch.create(data);
    return Response.json(branchDoc);
  }
  return Response.json({});
}

export async function GET() {
  mongoose.connect(process.env.MONGO_URL);
  return Response.json(await Branch.find({ isActive: true }));
}
