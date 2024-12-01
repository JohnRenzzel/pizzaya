"use client";

import useProfile from "@/components/UseProfile";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import UserTabs from "@/components/layout/UserTabs";
import Link from "next/link";
import Left from "@/components/icons/Left";
import { redirect, useParams } from "next/navigation";
import MenuItemForm from "../../../../components/layout/MenuItemForm";
import DeleteButton from "@/components/DeleteButton";
import Spinner from "@/components/layout/Spinner";
import DiscountSelector from "@/components/layout/DiscountSelector";

export default function EditMenuItemPage() {
  const { loading, data } = useProfile();
  const [redirectToItems, setRedirectToItems] = useState(false);
  const { id } = useParams();
  const [menuItem, setMenuItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("User Profile Data:", {
      isAdmin: data?.isAdmin,
      superAdmin: data?.superAdmin,
      branchId: data?.branchId,
      branchIdType: typeof data?.branchId,
    });
  }, [data]);

  useEffect(() => {
    setIsLoading(true);
    const fetchMenuItem = async () => {
      try {
        const res = await fetch(`/api/menu-items?_id=${id}`);
        if (!res.ok) {
          const error = await res.json();
          toast.error(error.error || "Failed to fetch menu item");
          return;
        }
        const item = await res.json();
        setMenuItem(item);
      } catch (error) {
        console.error("Error fetching menu item:", error);
        toast.error("Failed to fetch menu item");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuItem();
  }, [id]);

  useEffect(() => {
    if (menuItem) {
      console.log("Menu Item Data:", {
        itemBranchId: menuItem.branchId,
        itemBranchIdType: typeof menuItem.branchId,
        fullItem: menuItem,
      });
      console.log("User Data:", {
        userBranchId: data.branchId,
        userBranchIdType: typeof data.branchId,
      });
    }
  }, [menuItem, data.branchId]);

  async function handleFormSubmit(ev, data) {
    ev.preventDefault();

    if (!data.name?.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!data.description?.trim()) {
      toast.error("Description is required");
      return;
    }

    const basePrice = Number(data.basePrice);
    console.log("Parsed basePrice:", basePrice, "Type:", typeof basePrice);

    if (isNaN(basePrice) || basePrice <= 0) {
      console.log("Price validation failed:", {
        isNaN: isNaN(basePrice),
        basePrice: basePrice,
      });
      toast.error("Price must be greater than zero");
      return;
    }

    if (data.sizes && data.sizes.length > 0) {
      for (let i = 0; i < data.sizes.length; i++) {
        const size = data.sizes[i];
        if (!size.name) {
          toast.error(`Size #${i + 1} requires a name`);
          return;
        }
        if (
          size.price === undefined ||
          size.price === null ||
          size.price === ""
        ) {
          toast.error(`Size #${i + 1} requires a price (can be 0)`);
          return;
        }
        const sizePrice = parseFloat(size.price);
        if (isNaN(sizePrice)) {
          toast.error(`Size #${i + 1} requires a valid number for price`);
          return;
        }
      }
    }

    if (data.extraIngredientPrices && data.extraIngredientPrices.length > 0) {
      for (let i = 0; i < data.extraIngredientPrices.length; i++) {
        const extra = data.extraIngredientPrices[i];
        if (!extra.name) {
          toast.error(`Extra ingredient #${i + 1} requires a name`);
          return;
        }
        if (
          extra.price === undefined ||
          extra.price === null ||
          extra.price === ""
        ) {
          toast.error(`Extra ingredient #${i + 1} requires a price (can be 0)`);
          return;
        }
        const extraPrice = parseFloat(extra.price);
        if (isNaN(extraPrice)) {
          toast.error(
            `Extra ingredient #${i + 1} requires a valid number for price`
          );
          return;
        }
      }
    }

    data = {
      ...data,
      basePrice,
      _id: id,
      branchId: menuItem.branchId,
    };
    const savingPromise = new Promise(async (resolve, reject) => {
      const response = await fetch("/api/menu-items", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        resolve();
      } else {
        reject();
      }
    });
    await toast.promise(savingPromise, {
      loading: "Saving this tasty item...",
      success: "Saved",
      error: "Error",
    });

    setRedirectToItems(true);
  }

  async function handleDeleteClick() {
    if (
      !data.superAdmin &&
      data.isAdmin &&
      menuItem?.branchId?.toString() !== data?.branchId?.toString()
    ) {
      toast.error("Not authorized to delete items from other branches");
      return;
    }

    const promise = new Promise(async (resolve, reject) => {
      const res = await fetch("/api/menu-items?_id=" + id, {
        method: "DELETE",
      });
      if (res.ok) resolve();
      else reject();
    });

    await toast.promise(promise, {
      loading: "Deleting...",
      success: "Deleted successfully",
      error: "Error",
    });

    setRedirectToItems(true);
  }

  if (redirectToItems) {
    return redirect("/menu-items");
  }

  if (loading || isLoading) {
    return (
      <div className="my-4">
        <Spinner fullWidth={true} />
      </div>
    );
  }

  if (!data.superAdmin && !data.isAdmin) {
    return "Not authorized";
  }

  if (!menuItem) {
    return "Menu item not found";
  }

  if (
    data.isAdmin &&
    !data.superAdmin &&
    menuItem?.branchId?.toString() !== data?.branchId?.toString()
  ) {
    console.log("Branch Admin Check Failed Details:", {
      userIsAdmin: data.isAdmin,
      userIsSuperAdmin: data.superAdmin,
      menuItemBranchId: menuItem?.branchId?.toString(),
      userBranchId: data?.branchId?.toString(),
    });
    return "Not authorized to edit items from other branches";
  }

  return (
    <section className="mt-8">
      <UserTabs isAdmin={data.admin} />
      <div className="max-w-2xl mx-auto mt-8">
        <Link href={"/menu-items"} className="button">
          <Left />
          <span>Show all menu items</span>
        </Link>
      </div>
      <DiscountSelector menuItem={menuItem} />
      <MenuItemForm
        menuItem={menuItem}
        onSubmit={handleFormSubmit}
        onDelete={handleDeleteClick}
      />
    </section>
  );
}
