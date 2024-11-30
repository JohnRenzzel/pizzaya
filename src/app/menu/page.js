"use client";

import SectionHeaders from "@/components/layout/SectionHeaders";
import MenuItem from "@/components/menu/MenuItem";
import { useEffect, useState } from "react";
import Spinner from "@/components/layout/Spinner";
import { useBranch } from "@/components/BranchContext";
import { useSession } from "next-auth/react";

export default function MenuPage() {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedBranch } = useBranch();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: session } = useSession();

  useEffect(() => {
    if (selectedBranch?._id) {
      fetch(`/api/categories?branchId=${selectedBranch._id}`).then((res) => {
        res.json().then((categories) => setCategories(categories));
      });

      fetch(`/api/menu-items?branchId=${selectedBranch._id}`).then((res) => {
        res.json().then((menuItems) => {
          const itemsWithPromo = menuItems.map((item) => ({
            ...item,
            currentPrice: item.promoPrice || item.basePrice,
          }));
          setMenuItems(itemsWithPromo);
          setIsLoading(false);
        });
      });
    }
  }, [selectedBranch, session]);

  if (!selectedBranch) {
    return (
      <section className="mt-8 text-center">
        <SectionHeaders mainHeader="Menu" />
        <p className="mt-4 text-gray-500">
          Please select a branch to view the menu
        </p>
      </section>
    );
  }

  if (isLoading) {
    return (
      <div className="my-4">
        <Spinner fullWidth={true} />
      </div>
    );
  }

  return (
    <section className="mt-8">
      <input
        type="text"
        placeholder="Search menu items..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
        className="mb-4 p-2 border rounded"
      />
      {categories?.length > 0 ? (
        categories.map((c) => (
          <div key={c._id}>
            <div className="text-center">
              <SectionHeaders mainHeader={c.name} />
            </div>
            <div className="grid sm:grid-cols-3 gap-4 mt-6 mb-12">
              {menuItems
                .filter(
                  (item) =>
                    item.category === c._id &&
                    item.name.toLowerCase().includes(searchQuery)
                )
                .map((item) => (
                  <MenuItem key={item._id} {...item} />
                ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500">
          No menu items available for this branch
        </div>
      )}
    </section>
  );
}
