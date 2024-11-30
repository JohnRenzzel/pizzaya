"use client";
import Right from "@/components/icons/Right";
import UserTabs from "@/components/layout/UserTabs";
import useProfile from "@/components/UseProfile";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import Spinner from "@/components/layout/Spinner";
import { useBranch } from "@/components/BranchContext";
import RouteGuard from "@/components/layout/RouteGuard";

export default function MenuItemsPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { loading, data: profile } = useProfile();
  const { selectedBranch } = useBranch();

  useEffect(() => {
    if (profile?.superAdmin) {
      // Fetch all menu items for superadmin
      fetch("/api/menu-items").then((response) => {
        if (response.ok) {
          response.json().then((menuItems) => {
            setMenuItems(menuItems);
          });
        }
      });
    } else if (profile?.isAdmin && selectedBranch) {
      // Fetch branch-specific menu items
      fetch(`/api/menu-items?branchId=${selectedBranch._id}`).then(
        (response) => {
          if (response.ok) {
            response.json().then((menuItems) => {
              setMenuItems(menuItems);
            });
          }
        }
      );
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

  if (!isSuperAdmin && !isBranchAdmin) {
    return "Not authorized";
  }

  if (!selectedBranch && !isSuperAdmin) {
    return "Please select a branch";
  }

  const filteredMenuItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <RouteGuard requiredAuth={true}>
      <section className="mt-8 max-w-2xl mx-auto">
        <UserTabs isAdmin={true} />
        <div className="text-center mt-4">
          {selectedBranch && (
            <h2 className="text-sm text-gray-500">
              Menu items for branch: {selectedBranch.name}
            </h2>
          )}
          {isSuperAdmin && !selectedBranch && (
            <h2 className="text-sm text-gray-500">
              All Menu Items (Super Admin)
            </h2>
          )}
        </div>
        <div className="mt-8">
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
          <Link className="button flex mt-4" href={"/menu-items/new"}>
            <span>Create new menu item</span>
            <Right />
          </Link>
        </div>
        <div>
          <h2 className="text-sm text-gray-500 mt-8">Edit menu item:</h2>
          <div className="grid grid-cols-3 gap-2">
            {filteredMenuItems.length > 0 ? (
              filteredMenuItems.map((item) => (
                <Link
                  key={item._id}
                  href={"/menu-items/edit/" + item._id}
                  className={`bg-gray-200 rounded-lg p-4 relative flex flex-col h-full ${
                    !item.isAvailable ? "opacity-70" : ""
                  }`}
                >
                  {!item.isAvailable && (
                    <div className="absolute top-2 right-2 bg-red-200 text-red-600 px-2 py-1 rounded-full text-xs">
                      Unavailable
                    </div>
                  )}
                  {item.discount > 0 && (
                    <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded-full text-xs">
                      -{item.discount}% OFF
                    </div>
                  )}
                  <div className="text-center h-40 relative">
                    <Image
                      className="rounded-md"
                      src={item.image}
                      alt={item.name || ""}
                      fill
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                  <div className="text-center mt-2">{item.name}</div>
                </Link>
              ))
            ) : (
              <div className="text-center text-gray-500">
                No menu items found
              </div>
            )}
          </div>
        </div>
      </section>
    </RouteGuard>
  );
}
