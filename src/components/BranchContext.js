"use client";
import { createContext, useContext, useState, useEffect } from "react";

export const BranchContext = createContext({});

export function BranchProvider({ children }) {
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);

  useEffect(() => {
    // Load branches
    fetch("/api/branches")
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched branches:", data);
        setBranches(data);
        setLoading(false);
      });

    // Check localStorage for previously selected branch
    const savedBranch = localStorage.getItem("selectedBranch");
    if (savedBranch) {
      const branch = JSON.parse(savedBranch);
      console.log("Saved branch from localStorage:", branch);
      setSelectedBranch(branch);
      loadMenuItems(branch._id);
    }
  }, []);

  const loadMenuItems = async (branchId) => {
    setMenuLoading(true);
    try {
      const res = await fetch(`/api/menu-items?branchId=${branchId}`);
      const data = await res.json();
      setMenuItems(data);
    } catch (error) {
      console.error("Error loading menu items:", error);
    }
    setMenuLoading(false);
  };

  const selectBranch = async (branch) => {
    console.log("Selecting branch:", branch);
    setSelectedBranch(branch);
    localStorage.setItem("selectedBranch", JSON.stringify(branch));
    if (branch?._id) {
      await loadMenuItems(branch._id);
    }
  };

  return (
    <BranchContext.Provider
      value={{
        selectedBranch,
        selectBranch,
        branches,
        loading,
        menuItems,
        menuLoading,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export const useBranch = () => useContext(BranchContext);
