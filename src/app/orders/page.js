"use client";
import Spinner from "@/components/layout/Spinner";
import UserTabs from "@/components/layout/UserTabs";
import useProfile from "@/components/UseProfile";
import { dbTimeForHuman } from "@/libs/datetime";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useBranch } from "@/components/BranchContext";
import { useSession } from "next-auth/react";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { loading, data: profile } = useProfile();
  const { selectedBranch } = useBranch();
  const session = useSession();
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState(null);
  const [statusFilter, setStatusFilter] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("orderStatusFilter") || "all";
    }
    return "all";
  });

  const fetchOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);
      const url = selectedBranch
        ? `/api/orders?branchId=${selectedBranch._id}`
        : "/api/orders";
      const response = await fetch(url);
      const orders = await response.json();
      setOrders(orders.reverse());
      setLoadingOrders(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setLoadingOrders(false);
    }
  }, [selectedBranch]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders
    .filter((order) => {
      if (!order.paid) return false;

      if (statusFilter !== "all" && order.status !== statusFilter) return false;

      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        (order.userEmail?.toLowerCase() || "").includes(searchLower) ||
        order.cartProducts?.some((p) =>
          (p.name?.toLowerCase() || "").includes(searchLower)
        )
      );
    })
    .sort((a, b) => {
      // Define status priority (higher number = higher priority)
      const statusPriority = {
        Pending: 5,
        Processing: 4,
        Preparing: 3,
        Delivering: 2,
        Completed: 1,
      };

      // First sort by status priority
      const priorityDiff =
        (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0);
      if (priorityDiff !== 0) return priorityDiff;

      // If same status, sort by date
      // For Completed orders: newer first (reverse chronological)
      if (a.status === "Completed" && b.status === "Completed") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      // For other statuses: older first (chronological)
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

  function closeModal() {
    setOrderToDelete(null);
    setDeleteStatus(null);
  }

  async function handleDelete(orderId) {
    try {
      setDeleteStatus("deleting");
      const response = await fetch(`/api/orders?_id=${orderId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setDeleteStatus("success");
        setOrders((prevOrders) =>
          prevOrders.filter((order) => order._id !== orderId)
        );
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        setDeleteStatus("error");
        console.error("Failed to delete order");
      }
    } catch (error) {
      setDeleteStatus("error");
      console.error("Error deleting order:", error);
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case "Completed":
        return "bg-green-100";
      case "Delivering":
        return "bg-blue-100";
      case "Preparing":
        return "bg-yellow-100";
      case "Processing":
        return "bg-gray-200";
      case "Pending":
        return "bg-red-100";
      case "all":
        return "bg-white";
      default:
        return "bg-white";
    }
  }

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    localStorage.setItem("orderStatusFilter", status);
  };

  function StatusFilterButton({ status }) {
    const bgColor =
      status === statusFilter ? getStatusColor(status) : "bg-gray-50";
    return (
      <button
        onClick={() => handleStatusFilterChange(status)}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
          ${bgColor} hover:bg-opacity-80`}
      >
        {status}
      </button>
    );
  }

  if (loading || session.status === "loading") {
    return (
      <div className="my-4">
        <Spinner fullWidth={true} />
      </div>
    );
  }

  if (session.status === "unauthenticated") {
    return "Please login to view orders";
  }

  const isSuperAdmin = profile?.superAdmin;
  const isBranchStaff =
    profile?.isStaff &&
    selectedBranch &&
    profile?.branchId === selectedBranch._id;
  const isBranchAdmin =
    profile?.isAdmin &&
    selectedBranch &&
    profile?.branchId === selectedBranch._id;
  const isRegularUser = !isSuperAdmin && !isBranchAdmin && !isBranchStaff;

  if (!selectedBranch && (isBranchStaff || isBranchAdmin)) {
    return "Please select a branch";
  }

  const canSearch = () => {
    return isSuperAdmin || (selectedBranch && (isBranchAdmin || isBranchStaff));
  };

  const canDelete = () => {
    return isSuperAdmin || isBranchAdmin || isBranchStaff;
  };

  return (
    <section className="mt-8 max-w-2xl mx-auto">
      <UserTabs />
      <div className="text-center mt-4">
        {selectedBranch && (
          <h2 className="text-sm text-gray-500">
            Orders for branch: {selectedBranch.name}
          </h2>
        )}
        {isSuperAdmin && !selectedBranch && (
          <h2 className="text-sm text-gray-500">All Orders (Super Admin)</h2>
        )}
        {!selectedBranch && isRegularUser && (
          <h2 className="text-sm text-gray-500">Your Orders (All Branches)</h2>
        )}
      </div>
      {canSearch() && (
        <div className="mt-4">
          <input
            type="text"
            placeholder="Search by email or product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
      )}
      <div className="mt-4 flex gap-2 justify-center overflow-x-auto whitespace-nowrap">
        <StatusFilterButton status="all" />
        <StatusFilterButton status="Pending" />
        <StatusFilterButton status="Processing" />
        <StatusFilterButton status="Preparing" />
        <StatusFilterButton status="Delivering" />
        <StatusFilterButton status="Completed" />
      </div>
      <div className="mt-8">
        {loadingOrders && (
          <div className="my-4">
            <Spinner fullWidth={true} />
          </div>
        )}
        {filteredOrders.length === 0 && !loadingOrders && (
          <div className="text-center text-gray-500">
            {searchTerm ? "No matching orders found" : "No orders found"}
          </div>
        )}
        {filteredOrders.length > 0 &&
          filteredOrders.map((order) => (
            <div
              key={order._id}
              className={`mb-2 p-4 rounded-lg flex flex-col md:flex-row items-center gap-4 md:gap-6 ${getStatusColor(
                order.status
              )}`}
            >
              <div className="w-full md:grow flex flex-col md:flex-row items-center gap-3 md:gap-6">
                <div className="w-full md:w-auto flex justify-center md:justify-start">
                  {canDelete() ? (
                    <button
                      onClick={() => setOrderToDelete(order._id)}
                      className="bg-red-500 p-2 rounded-md text-white w-24 text-center hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  ) : (
                    <div
                      className={`text-sm font-medium p-2 rounded-md w-24 text-center shadow-lg 
    ${getStatusColor(order.status)} border border-gray-400
    hover:border-gray-300 transition-all duration-300 ease-in-out transform hover:-translate-y-1`}
                    >
                      {order.status}
                    </div>
                  )}
                </div>
                <div className="w-full md:grow">
                  <div className="flex flex-col md:flex-row gap-2 items-center mb-1">
                    <div className="w-full md:grow text-center md:text-left">
                      {order.userEmail}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {dbTimeForHuman(order.createdAt)}
                    </div>
                  </div>
                  <div className="text-gray-500 text-xs text-center md:text-left">
                    {order.cartProducts.map((p) => p.name).join(", ")}
                  </div>
                </div>
              </div>
              <div className="w-full md:w-auto flex justify-center md:justify-end gap-2 items-center whitespace-nowrap mt-3 md:mt-0">
                <Link href={`/orders/${order._id}`} className="button">
                  Show order
                </Link>
              </div>
            </div>
          ))}
      </div>
      {orderToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg max-w-sm mx-4 w-full">
            {deleteStatus === "deleting" && (
              <div className="text-center py-4">
                <Spinner fullWidth={true} />
                <p className="text-gray-600 mt-2">Deleting order...</p>
              </div>
            )}
            {deleteStatus === "success" && (
              <div className="text-center py-4">
                <svg
                  className="w-16 h-16 mx-auto text-green-500 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="text-gray-600">Deleted Successfully!</p>
              </div>
            )}
            {deleteStatus === "error" && (
              <div className="text-center py-4">
                <p className="text-red-500">Failed to delete order</p>
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 rounded-md mt-2"
                >
                  Close
                </button>
              </div>
            )}
            {!deleteStatus && (
              <>
                <h3 className="text-xl mb-4">Delete Order</h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete this order?
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    onClick={() => handleDelete(orderToDelete)}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
