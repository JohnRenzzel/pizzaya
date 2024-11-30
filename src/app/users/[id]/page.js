"use client";
import useProfile from "@/components/UseProfile";
import UserForm from "@/components/layout/UserForm";
import UserTabs from "@/components/layout/UserTabs";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Spinner from "@/components/layout/Spinner";
import { useBranch } from "@/components/BranchContext";
import RouteGuard from "@/components/layout/RouteGuard";

export default function EditUserPage() {
  const { loading, data: profile } = useProfile();
  const [user, setUser] = useState(null);
  const { id } = useParams();
  const { selectedBranch } = useBranch();

  useEffect(() => {
    if (!id || loading) return;

    fetch("/api/users/" + id)
      .then((res) => res.json())
      .then((user) => {
        if (!user) {
          toast.error("User not found");
          return;
        }

        // Check permissions after we have the user data
        const canEdit =
          profile?.superAdmin ||
          (profile?.isAdmin &&
            (!user.branchId || user.branchId === profile.branchId)) ||
          (profile?.isStaff &&
            selectedBranch &&
            !user.branchId &&
            !user.isAdmin &&
            !user.isStaff &&
            !user.superAdmin &&
            profile.branchId === selectedBranch._id);

        if (canEdit) {
          setUser(user);
        } else {
          toast.error("You don't have permission to edit this user");
        }
      })
      .catch((err) => {
        toast.error("Error loading user");
        console.error(err);
      });
  }, [id, profile, selectedBranch, loading]);

  async function handleSaveButtonClick(ev, data) {
    ev.preventDefault();
    const promise = new Promise(async (resolve, reject) => {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...data, _id: id }),
      });
      if (res.ok) resolve();
      else reject();
    });
    await toast.promise(promise, {
      loading: "Saving...",
      success: "Profile saved successfully!",
      error: "An error occurred while saving",
    });
  }

  if (loading) {
    return (
      <div className="my-4">
        <Spinner fullWidth={true} />
      </div>
    );
  }

  const isSuperAdmin = profile?.superAdmin;
  const isBranchAdmin =
    profile?.isAdmin &&
    selectedBranch &&
    profile?.branchId === selectedBranch._id;
  const isBranchStaff =
    profile?.isStaff &&
    selectedBranch &&
    profile?.branchId === selectedBranch._id;

  if (!isSuperAdmin && !isBranchAdmin && !isBranchStaff) {
    return "Not authorized";
  }

  if (!selectedBranch && !isSuperAdmin) {
    return "Please select a branch";
  }

  if (!user) {
    return "User not found or you don't have permission to edit this user";
  }

  return (
    <RouteGuard requiredAuth={true}>
      <section className="mt-8 mx-auto max-w-2xl">
        <UserTabs isAdmin={true} />
        <div className="text-center mt-4">
          <h2 className="text-sm text-gray-500">
            {selectedBranch
              ? `Editing user for branch: ${selectedBranch.name}`
              : "Editing user (Super Admin)"}
          </h2>
        </div>
        <div className="mt-8">
          <UserForm user={user} onSave={handleSaveButtonClick} />
        </div>
      </section>
    </RouteGuard>
  );
}
