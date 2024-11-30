"use client";

import UserTabs from "@/components/layout/UserTabs";
import useProfile from "@/components/UseProfile";
import Link from "next/link";
import { useEffect, useState } from "react";
import Spinner from "@/components/layout/Spinner";
import { useBranch } from "@/components/BranchContext";
import RouteGuard from "@/components/layout/RouteGuard";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const { loading, data: profile } = useProfile();
  const { selectedBranch } = useBranch();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (selectedBranch || profile?.superAdmin) {
      fetch("/api/users").then((response) => {
        if (response.ok) {
          response.json().then((users) => {
            const filteredUsers = users.filter((user) => {
              // Hide all super admin accounts from the list
              if (user.superAdmin) {
                return false;
              }

              // For super admin
              if (profile?.superAdmin) {
                if (selectedBranch) {
                  // If branch selected, show only that branch's staff and admin
                  return (
                    user.branchId === selectedBranch._id || // Show branch staff and admin
                    (!user.isAdmin && !user.isStaff && !user.branchId) // Show customers
                  );
                } else {
                  // If no branch selected, show all users
                  return true;
                }
              }

              // For branch admin
              if (profile?.isAdmin) {
                return (
                  selectedBranch &&
                  ((user.isAdmin && user.branchId === selectedBranch._id) ||
                    (user.isStaff && user.branchId === selectedBranch._id) ||
                    (!user.isAdmin && !user.isStaff && !user.branchId))
                );
              }

              // For branch staff, show only customers
              if (profile?.isStaff) {
                return !user.isAdmin && !user.isStaff && !user.branchId;
              }

              return false;
            });
            setUsers(filteredUsers);
          });
        }
      });
    }
  }, [selectedBranch, profile]);

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

  return (
    <RouteGuard requiredAuth={true}>
      <section className="max-w-2xl mx-auto mt-8">
        <UserTabs isAdmin={true} />
        <div className="text-center mt-4">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4 p-2 border rounded"
          />
          {selectedBranch && (
            <h2 className="text-sm text-gray-500">
              Users for branch: {selectedBranch.name}
            </h2>
          )}
          {isSuperAdmin && !selectedBranch && (
            <h2 className="text-sm text-gray-500">All Users (Super Admin)</h2>
          )}
        </div>
        <div className="mt-8">
          {users?.length > 0 &&
            users
              .filter(
                (user) =>
                  user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  user.email?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((user) => (
                <div
                  key={user._id}
                  className="bg-gray-100 rounded-lg mb-2 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                >
                  <div className="flex flex-col sm:flex-row gap-4 grow w-full">
                    <div className="w-full sm:w-1/4 min-w-0 sm:min-w-[150px] text-gray-900">
                      <div className="font-medium mb-1 sm:mb-0">
                        {!!user.name && <span>{user.name}</span>}
                        {!user.name && <span className="italic">No name</span>}
                      </div>
                      <div className="text-sm text-gray-500 sm:hidden">
                        {user.email}
                      </div>
                    </div>
                    <div className="hidden sm:block w-1/3 min-w-[200px] text-gray-500 truncate">
                      {user.email}
                    </div>
                    <div className="w-full sm:w-1/4 min-w-0 sm:min-w-[120px] text-gray-500 mt-2 sm:mt-0">
                      <span className="inline-block px-2 py-1 rounded-full text-sm bg-gray-200">
                        {user.superAdmin && "Super Admin"}
                        {user.branchId && user.isAdmin && "Branch Admin"}
                        {user.branchId && user.isStaff && "Branch Staff"}
                        {!user.superAdmin && !user.branchId && "Customer"}
                      </span>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto mt-4 sm:mt-0">
                    <Link
                      className="button w-full sm:w-auto text-center whitespace-nowrap"
                      href={"/users/" + user._id}
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
        </div>
      </section>
    </RouteGuard>
  );
}
