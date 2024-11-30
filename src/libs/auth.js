import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { User } from "@/models/User";

export async function isAdmin(branchId) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  if (!userEmail) {
    return false;
  }
  const user = await User.findOne({ email: userEmail });
  if (!user) {
    return false;
  }
  return (
    user.superAdmin || (user.isAdmin && user.branchId?.toString() === branchId)
  );
}

export async function isSuperAdmin() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  if (!userEmail) {
    return false;
  }
  const user = await User.findOne({ email: userEmail });
  return user?.superAdmin || false;
}

export async function canManageBranch(branchId) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  if (!userEmail) {
    return false;
  }
  const user = await User.findOne({ email: userEmail });
  if (!user) {
    return false;
  }
  return (
    user.superAdmin || (user.isAdmin && user.branchId.toString() === branchId)
  );
}

export async function isStaffOrAdmin(branchId) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  if (!userEmail) {
    return false;
  }
  const user = await User.findOne({ email: userEmail });
  if (!user) {
    return false;
  }
  return (
    user.superAdmin ||
    ((user.isAdmin || user.isStaff) && user.branchId?.toString() === branchId)
  );
}
