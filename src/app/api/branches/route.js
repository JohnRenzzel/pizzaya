import { Branch } from "@/models/Branch";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { User } from "@/models/User";

async function checkIsAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return false;
  }
  const user = await User.findOne({ email: session.user.email });
  return user?.superAdmin || user?.isAdmin;
}

export async function POST(req) {
  mongoose.connect(process.env.MONGO_URL);
  const data = await req.json();
  if (await checkIsAdmin()) {
    const branchDoc = await Branch.create(data);
    return Response.json(branchDoc);
  }
  return Response.json({});
}

export async function GET() {
  mongoose.connect(process.env.MONGO_URL);
  return Response.json(await Branch.find({ isActive: true }));
}
