"use client";

import {
  subHours,
  startOfDay,
  startOfWeek,
  startOfMonth,
  format,
} from "date-fns";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import UserTabs from "@/components/layout/UserTabs";
import Spinner from "@/components/layout/Spinner";
import { useBranch } from "@/components/BranchContext";
import useProfile from "@/components/UseProfile";
import RouteGuard from "@/components/layout/RouteGuard";
import * as XLSX from "xlsx";

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
      .toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
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

  const exportToExcel = () => {
    // Prepare data for export
    const exportData = orders
      .map((order) => {
        return order.cartProducts.map((product) => ({
          Date: format(new Date(order.createdAt), "yyyy-MM-dd HH:mm"),
          "Customer Name": order.userEmail,
          "Product Name": product.name,
          Quantity: product.quantity,
          "Unit Price": `₱${(product.basePrice || 0).toFixed(2)}`,
          Total: `₱${((product.basePrice || 0) * product.quantity).toFixed(2)}`,
        }));
      })
      .flat();

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales");

    // Save file
    XLSX.writeFile(wb, `sales_report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const printSalesTable = () => {
    const printWindow = window.open("", "_blank");
    const html = `
      <html>
        <head>
          <title>Sales Report</title>
          <style>
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Sales Report - ${format(new Date(), "yyyy-MM-dd")}</h1>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${orders
                .map((order) =>
                  order.cartProducts
                    .map(
                      (product) => `
                  <tr>
                    <td>${format(
                      new Date(order.createdAt),
                      "yyyy-MM-dd HH:mm"
                    )}</td>
                    <td>${order.userEmail}</td>
                    <td>${product.name}</td>
                    <td>${product.quantity}</td>
                    <td>₱${(product.basePrice || 0).toFixed(2)}</td>
                    <td>₱${(
                      (product.basePrice || 0) * product.quantity
                    ).toFixed(2)}</td>
                  </tr>
                `
                    )
                    .join("")
                )
                .join("")}
            </tbody>
          </table>
          <button onclick="window.print()">Print</button>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

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
              <div className="tile-number">{ordersToday.length}</div>
              <div className="tile-desc">{ordersToday.length} orders today</div>
            </div>
            <div className="tile">
              <h3 className="tile-header">This week</h3>
              <div className="tile-number">{ordersWeek.length}</div>
              <div className="tile-desc">
                {ordersWeek.length} orders this week
              </div>
            </div>
            <div className="tile">
              <h3 className="tile-header">This month</h3>
              <div className="tile-number">{ordersMonth.length}</div>
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
        <div className="mt-8 flex gap-4">
          <button onClick={exportToExcel} className="primary">
            Export to Excel
          </button>
          <button onClick={printSalesTable} className="primary">
            Print Sales Table
          </button>
        </div>
      </section>
    </RouteGuard>
  );
}
