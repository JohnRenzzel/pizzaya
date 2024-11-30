import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useProfile from "../UseProfile";
import { useBranch } from "../BranchContext";
import Spinner from "../layout/Spinner";

export default function RouteGuard({ children, requiredAuth = false }) {
  const router = useRouter();
  const { loading, data: profile } = useProfile();
  const { selectedBranch } = useBranch();

  const isSuperAdmin = profile?.superAdmin;
  const isBranchAdmin =
    profile?.isAdmin &&
    selectedBranch &&
    profile?.branchId === selectedBranch._id;
  const isBranchStaff =
    profile?.isStaff &&
    selectedBranch &&
    profile?.branchId === selectedBranch._id;

  useEffect(() => {
    if (!loading && requiredAuth) {
      if (!isSuperAdmin && !isBranchAdmin && !isBranchStaff) {
        router.push("/");
      }
    }
  }, [
    requiredAuth,
    router,
    loading,
    isSuperAdmin,
    isBranchAdmin,
    isBranchStaff,
    selectedBranch,
  ]);

  if (loading) {
    return <Spinner fullWidth={true} />;
  }

  if (requiredAuth && !isSuperAdmin && !isBranchAdmin && !isBranchStaff) {
    return null;
  }

  return children;
}
