"use client";
import useProfile from "@/components/UseProfile";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import UserTabs from "@/components/layout/UserTabs";
import Link from "next/link";
import Left from "@/components/icons/Left";
import { useRouter } from "next/navigation";
import MenuItemForm from "@/components/layout/MenuItemForm";
import Spinner from "@/components/layout/Spinner";
import { useBranch } from "@/components/BranchContext";

export default function NewMenuItemPage() {
  const { loading, data } = useProfile();
  const router = useRouter();
  const { selectedBranch } = useBranch();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (mounted && !selectedBranch) {
      router.push("/");
    }
  }, [selectedBranch, router, mounted]);

  // Check if user is authorized (superadmin or branch admin)
  const isAuthorized =
    data?.superAdmin ||
    (data?.isAdmin && data?.branchId === selectedBranch?._id);

  async function handleFormSubmit(ev, data) {
    ev.preventDefault();

    // Validate required fields
    if (!data.name || !data.description) {
      toast.error("Name and description are required");
      return;
    }

    // Validate price is a number and greater than 0
    const price = parseFloat(data.basePrice);
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    // Calculate discounted price if discount exists
    const discount = parseInt(data.discount) || 0;
    const discountedPrice = discount > 0 ? price * (1 - discount / 100) : price;

    const savingPromise = new Promise(async (resolve, reject) => {
      const response = await fetch("/api/menu-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          basePrice: price,
          discount: discount,
          discountedPrice: discountedPrice,
          branchId: selectedBranch._id,
        }),
      });
      if (response.ok) {
        resolve();
      } else {
        const error = await response.json();
        reject(error.error);
      }
    });

    try {
      await toast.promise(savingPromise, {
        loading: "Saving this tasty item...",
        success: "Saved",
        error: (err) => err || "Error saving menu item",
      });
      router.push("/menu-items");
    } catch (error) {
      console.error("Error saving menu item:", error);
    }
  }

  if (loading) {
    return (
      <div className="my-4">
        <Spinner fullWidth={true} />
      </div>
    );
  }

  if (!isAuthorized) {
    return "Not authorized to create menu items for this branch";
  }

  return (
    <section className="mt-8">
      <UserTabs isAdmin={true} />
      <div className="max-w-2xl mx-auto mt-8">
        <Link href={"/menu-items"} className="button">
          <Left />
          <span>Show all menu items</span>
        </Link>
      </div>
      <div className="text-center mb-4">
        <h2 className="text-sm text-gray-500">
          Creating menu item for branch: {selectedBranch.name}
        </h2>
      </div>
      <MenuItemForm menuItem={null} onSubmit={handleFormSubmit} />
    </section>
  );
}
