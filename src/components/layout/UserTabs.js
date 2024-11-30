"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useBranch } from "@/components/BranchContext";
import useProfile from "@/components/UseProfile";
import { Suspense, useEffect } from "react";

export default function UserTabs() {
  const path = usePathname();
  const router = useRouter();
  const { selectedBranch } = useBranch();
  const { data: profile } = useProfile();

  // Prefetch the routes when component mounts
  useEffect(() => {
    // Prefetch orders for all users
    router.prefetch("/orders");

    // Prefetch admin routes only for admin/staff users
    if (profile?.isAdmin || profile?.superAdmin || profile?.isStaff) {
      router.prefetch("/categories");
      router.prefetch("/menu-items");
      router.prefetch("/users");
      router.prefetch("/sales");
    }
  }, [profile, router]);

  // Don't render anything until profile is loaded
  if (!profile) {
    return null;
  }

  const isSuperAdmin = profile?.superAdmin;
  const isBranchAdmin = profile?.isAdmin && selectedBranch;
  const showAdminTabs = isSuperAdmin || isBranchAdmin;
  const isBranchStaff =
    profile?.branchId === selectedBranch?._id &&
    !profile?.isAdmin &&
    !profile?.superAdmin;
  const showUsersAndOrders = showAdminTabs || isBranchStaff;
  const isRegularUser = !isSuperAdmin && !isBranchAdmin && !isBranchStaff;

  // Only check branch selection for staff and admin users
  if (
    !selectedBranch &&
    !isSuperAdmin &&
    (profile?.isAdmin || profile?.isStaff)
  ) {
    return null;
  }

  return (
    <Suspense
      fallback={
        <div className="flex mx-auto gap-2 tabs justify-center flex-wrap">
          Loading...
        </div>
      }
    >
      <div className="flex mx-auto gap-2 tabs justify-center flex-wrap">
        <Link
          className={path === "/profile" ? "active" : ""}
          href={"/profile"}
          prefetch={true}
        >
          Profile
        </Link>

        {/* Show Orders tab for all users */}
        <Link
          className={path === "/orders" ? "active" : ""}
          href={"/orders"}
          prefetch={true}
        >
          Orders
        </Link>

        {showAdminTabs && (
          <>
            <Link
              href={"/categories"}
              className={path === "/categories" ? "active" : ""}
              prefetch={true}
            >
              Categories
            </Link>
            <Link
              className={path.includes("/menu-items") ? "active" : ""}
              href={"/menu-items"}
              prefetch={true}
            >
              Menu Items
            </Link>
          </>
        )}

        {showUsersAndOrders && (
          <Link
            className={path.includes("/users") ? "active" : ""}
            href={"/users"}
            prefetch={true}
          >
            Users
          </Link>
        )}

        {showAdminTabs && (
          <Link
            className={path === "/sales" ? "active" : ""}
            href={"/sales"}
            prefetch={true}
          >
            Sales
          </Link>
        )}
      </div>
    </Suspense>
  );
}
