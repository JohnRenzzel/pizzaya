"use client";

import { subHours, startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import UserTabs from "@/components/layout/UserTabs";
import Spinner from "@/components/layout/Spinner";
import { useBranch } from "@/components/BranchContext";
import useProfile from "@/components/UseProfile";
import RouteGuard from "@/components/layout/RouteGuard";

export default function SalesPage() {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const { loading, data: profile } = useProfile();
  const { selectedBranch } = useBranch();

  const fetchOrders = useCallback(async () => {
    try {
      const url = selectedBranch
        ? `/api/orders?branchId=${selectedBranch._id}`
        : "/api/orders";
      const response = await fetch(url);
      const orders = await response.json();
      setOrders(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  }, [selectedBranch]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  function ordersTotal(orders) {
    return orders
      .reduce((total, order) => total + order.totalPrice, 0)
      .toLocaleString();
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

  if (!isSuperAdmin && !isBranchAdmin) {
    return "Not authorized";
  }

  if (!selectedBranch && !isSuperAdmin) {
    return "Please select a branch";
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const ordersToday = orders.filter(
    (order) => new Date(order.createdAt) >= todayStart
  );
  const ordersWeek = orders.filter(
    (order) => new Date(order.createdAt) >= weekStart
  );
  const ordersMonth = orders.filter(
    (order) => new Date(order.createdAt) >= monthStart
  );

  return (
    <RouteGuard requiredAuth={true}>
      <section className="mt-8 max-w-2xl mx-auto">
        <UserTabs isAdmin={true} />
        <div className="text-center mt-4">
          {selectedBranch && (
            <h2 className="text-sm text-gray-500">
              Sales statistics for branch: {selectedBranch.name}
            </h2>
          )}
          {isSuperAdmin && !selectedBranch && (
            <h2 className="text-sm text-gray-500">
              All Sales Statistics (Super Admin)
            </h2>
          )}
        </div>
        <div className="mt-8">
          <h2 className="title-header">Orders</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="tile">
              <h3 className="tile-header">Today</h3>
              <div className="tile-number">₱{ordersTotal(ordersToday)}</div>
              <div className="tile-desc">{ordersToday.length} orders today</div>
            </div>
            <div className="tile">
              <h3 className="tile-header">This week</h3>
              <div className="tile-number">₱{ordersTotal(ordersWeek)}</div>
              <div className="tile-desc">
                {ordersWeek.length} orders this week
              </div>
            </div>
            <div className="tile">
              <h3 className="tile-header">This month</h3>
              <div className="tile-number">₱{ordersTotal(ordersMonth)}</div>
              <div className="tile-desc">
                {ordersMonth.length} orders this month
              </div>
            </div>
          </div>
          <h2 className="title-header">Revenue</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="tile">
              <h3 className="tile-header">Today</h3>
              <div className="tile-number">₱{ordersTotal(ordersToday)}</div>
              <div className="tile-desc">{ordersToday.length} orders today</div>
            </div>
            <div className="tile">
              <h3 className="tile-header">This week</h3>
              <div className="tile-number">₱{ordersTotal(ordersWeek)}</div>
              <div className="tile-desc">
                {ordersWeek.length} orders this week
              </div>
            </div>
            <div className="tile">
              <h3 className="tile-header">This month</h3>
              <div className="tile-number">₱{ordersTotal(ordersMonth)}</div>
              <div className="tile-desc">
                {ordersMonth.length} orders this month
              </div>
            </div>
          </div>
        </div>
      </section>
    </RouteGuard>
  );
}
