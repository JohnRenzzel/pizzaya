"use client";
import UserTabs from "@/components/layout/UserTabs";
import { useState, useEffect } from "react";
import useProfile from "../../components/UseProfile";
import toast from "react-hot-toast";
import DeleteButton from "@/components/DeleteButton";
import Spinner from "@/components/layout/Spinner";
import { useBranch } from "@/components/BranchContext";
import RouteGuard from "@/components/layout/RouteGuard";

const CategoriesPage = () => {
  const { loading: profileLoading, data: profileData } = useProfile();
  const { selectedBranch } = useBranch();
  const [CategoryName, setCategoryName] = useState("");
  const [categories, setCategories] = useState([]);
  const [editedCategory, setEditedCategory] = useState(null);

  useEffect(() => {
    if (selectedBranch) {
      fetchCategories();
    }
  }, [selectedBranch]);

  async function fetchCategories() {
    try {
      const res = await fetch(`/api/categories?branchId=${selectedBranch._id}`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to fetch categories");
    }
  }

  async function handleCategorySubmit(ev) {
    ev.preventDefault();
    const creationPromise = new Promise(async (resolve, reject) => {
      const data = {
        name: CategoryName,
        branchId: selectedBranch._id,
      };
      if (editedCategory) {
        data._id = editedCategory._id;
      }
      try {
        const response = await fetch("/api/categories", {
          method: editedCategory ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          await fetchCategories();
          setCategoryName("");
          setEditedCategory(null);
          resolve();
        } else {
          reject();
        }
      } catch (error) {
        reject(error);
      }
    });

    await toast.promise(creationPromise, {
      loading: editedCategory
        ? "Updating category..."
        : "Creating your new category....",
      success: editedCategory
        ? "Category updated..."
        : "Category created successfully!",
      error: "Error sorry...",
    });
  }

  async function handleDeleteClick(_id) {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(
          `/api/categories?_id=${_id}&branchId=${selectedBranch._id}`,
          {
            method: "DELETE",
          }
        );
        if (response.ok) {
          resolve();
        } else {
          const error = await response.json();
          reject(error.message);
        }
      } catch (error) {
        reject(error);
      }
    });

    try {
      await toast.promise(promise, {
        loading: "Deleting category...",
        success: "Deleted successfully!",
        error: (err) => `Error: ${err}`,
      });
      await fetchCategories();
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  }

  if (profileLoading) {
    return <Spinner fullWidth={true} />;
  }

  const isSuperAdmin = profileData?.superAdmin;
  const isBranchAdmin =
    profileData?.isAdmin &&
    selectedBranch &&
    profileData?.branchId === selectedBranch._id;

  if (!isSuperAdmin && !isBranchAdmin) {
    return "Not authorized";
  }

  if (!selectedBranch && !isSuperAdmin) {
    return "Please select a branch";
  }

  return (
    <RouteGuard requiredAuth={true}>
      <section className="mt-8 max-w-2xl mx-auto">
        <UserTabs isAdmin={true} />
        <form className="mt-8" onSubmit={handleCategorySubmit}>
          <div className="flex gap-2 items-end">
            <div className="grow">
              <label>
                {editedCategory ? "Update category" : "New category name"}
                {editedCategory && (
                  <>
                    :<b>{editedCategory.name}</b>
                  </>
                )}
              </label>
              <input
                type="text"
                value={CategoryName}
                onChange={(ev) => setCategoryName(ev.target.value)}
              />
            </div>
            <div className="pb-2 flex gap-2">
              <button type="submit">
                {editedCategory ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditedCategory(null);
                  setCategoryName("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
        <div>
          <h2 className="mt-8 text-sm text-gray-500">Existing categories:</h2>
          {categories?.length > 0 &&
            categories.map((c) => (
              <div
                key={c._id}
                className="bg-gray-100 rounded-xl mb-1 p-2 px-4 flex gap-1 items-center"
              >
                <div className="grow">{c.name}</div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditedCategory(c);
                      setCategoryName(c.name);
                    }}
                    type="button"
                  >
                    Edit
                  </button>
                  <DeleteButton
                    label="Delete"
                    onDelete={() => handleDeleteClick(c._id)}
                  />
                </div>
              </div>
            ))}
        </div>
      </section>
    </RouteGuard>
  );
};

export default CategoriesPage;
