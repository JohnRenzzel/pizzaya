import { User } from "@/models/User";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { isSuperAdmin } from "@/libs/auth";

export async function GET() {
  mongoose.connect(process.env.MONGO_URL);
  const session = await getServerSession(authOptions);
  const user = await User.findOne({ email: session?.user?.email });

  if (!user?.isAdmin && !user?.superAdmin && !user?.isStaff) {
    return Response.json({ error: "Not authorized" }, { status: 401 });
  }

  if (user.superAdmin) {
    // Super admin can see all users
    return Response.json(await User.find());
  } else if (user.isAdmin) {
    // Branch admin can see staff and customers, but not other admins
    return Response.json(
      await User.find({
        $or: [
          {
            branchId: user.branchId,
            isAdmin: { $ne: true }, // Exclude other branch admins
          },
          { branchId: { $exists: false } }, // Customers (no branchId)
          { branchId: null }, // Customers (null branchId)
        ],
      })
    );
  } else if (user.isStaff) {
    // Branch staff can only see customers
    return Response.json(
      await User.find({
        $and: [
          { branchId: { $in: [null, undefined] } }, // Only customers
          { superAdmin: { $ne: true } },
          { isAdmin: { $ne: true } },
          { isStaff: { $ne: true } },
        ],
      })
    );
  }
}
