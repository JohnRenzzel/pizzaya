"use client";
import { CartContext, cartProductPrice } from "@/components/AppContext";
import AddressInputs from "@/components/layout/AddressInputs";
import SectionHeaders from "@/components/layout/SectionHeaders";
import CartProduct from "@/components/menu/CartProduct";
import { useParams } from "next/navigation";
import { useContext, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Spinner from "@/components/layout/Spinner";
import { calculateDeliveryTime } from "@/libs/calculateDeliveryTime";
import { getSocket } from "@/utils/socket";

function formatTime(minutes) {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} ${hours === 1 ? "hour" : "hours"}${
      remainingMinutes > 0 ? ` ${remainingMinutes} minutes` : ""
    }`;
  }
  return `${minutes} minutes`;
}

export default function OrderPage() {
  const [orderStatus, setOrderStatus] = useState("Pending");
  const { clearCart } = useContext(CartContext);
  const [order, setOrder] = useState();
  const [loadingOrder, setLoadingOrder] = useState(true);
  const { id } = useParams();
  const session = useSession();
  const [canManageOrders, setCanManageOrders] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deliveryTime, setDeliveryTime] = useState(null);
  const [calculatingTime, setCalculatingTime] = useState(true);
  const [deliveryTimeRanges, setDeliveryTimeRanges] = useState([
    { range: "0-3", label: "0-3 km", minutes: 15 },
    { range: "4-6", label: "4-6 km", minutes: 25 },
    { range: "7-8", label: "7-8 km", minutes: 30 },
    { range: "9-10", label: "9-10 km", minutes: 40 },
  ]);
  const [selectedTimeRange, setSelectedTimeRange] = useState(null);
  const [cookingTime, setCookingTime] = useState(15);
  const [isCustomCookingTime, setIsCustomCookingTime] = useState(false);
  const [pendingTime] = useState(0);
  const [processingTime] = useState(5);
  const [preparationTime, setPreparationTime] = useState(0);
  const [deliveringTime, setDeliveringTime] = useState(null);
  const [totalDeliveryTime, setTotalDeliveryTime] = useState(null);
  const [isCustomDeliveryTime, setIsCustomDeliveryTime] = useState(false);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    if (order?.progressBar?.currentProgress !== undefined) {
      setProgress(order.progressBar.currentProgress);
    } else {
      const statusPercentages = {
        Pending: 20,
        Processing: 40,
        Preparing: 70,
        Delivering: 100,
        Completed: 100,
      };
      setProgress(statusPercentages[order?.status || "Pending"] || 0);
    }
  }, [order]);

  useEffect(() => {
    if (session.status === "authenticated" && order) {
      fetch("/api/profile").then((response) => {
        response.json().then((data) => {
          const canManage =
            data.superAdmin ||
            ((data.isAdmin || data.isStaff) &&
              data.branchId === order.branchId);
          setCanManageOrders(canManage);
        });
      });
    }
  }, [session, order]);

  function handleStatusChange(newStatus) {
    if (!canManageOrders) {
      toast.error("You can only manage orders from your assigned branch");
      return;
    }

    const updatePromise = fetch("/api/updateStatus", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: id,
        status: newStatus,
        totalSeconds: (() => {
          let totalTime = 0;
          switch (newStatus) {
            case "Pending":
              totalTime =
                (pendingTime +
                  processingTime +
                  preparationTime +
                  deliveringTime) *
                60;
              break;
            case "Processing":
              totalTime =
                (processingTime + preparationTime + deliveringTime) * 60;
              break;
            case "Preparing":
              totalTime = (preparationTime + deliveringTime) * 60;
              break;
            case "Delivering":
              totalTime = deliveringTime * 60;
              break;
            case "Completed":
              totalTime = 0;
              break;
          }
          return totalTime;
        })(),
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.order) {
          setOrderStatus(newStatus);

          // Calculate new countdown based on new status
          let newTotalTime = 0;
          switch (newStatus) {
            case "Pending":
              newTotalTime =
                (pendingTime +
                  processingTime +
                  preparationTime +
                  deliveringTime) *
                60;
              break;
            case "Processing":
              newTotalTime =
                (processingTime + preparationTime + deliveringTime) * 60;
              break;
            case "Preparing":
              newTotalTime = (preparationTime + deliveringTime) * 60;
              break;
            case "Delivering":
              newTotalTime = deliveringTime * 60;
              break;
            case "Completed":
              newTotalTime = 0;
              break;
          }
          setCountdown(newTotalTime);

          const statusPercentages = {
            Pending: 20,
            Processing: 40,
            Preparing: 70,
            Delivering: 100,
            Completed: 100,
          };

          if (newStatus === "Pending") {
            setProgress(0);
            localStorage.setItem(`order_progress_${id}`, "0");
          } else {
            const statusIndex = statusOptions.indexOf(newStatus);
            const previousStatus = statusOptions[statusIndex - 1];
            const startProgress = statusPercentages[previousStatus] || 0;

            setProgress(startProgress);
            localStorage.setItem(
              `order_progress_${id}`,
              startProgress.toString()
            );
          }
          return data;
        } else {
          throw new Error(data.message);
        }
      });

    toast.promise(updatePromise, {
      loading: "Updating status...",
      success: "Status updated successfully!",
      error: "Failed to update status",
    });
  }

  useEffect(() => {
    if (session.status === "authenticated") {
      if (id) {
        setLoadingOrder(true);
        fetch("/api/orders?_id=" + id)
          .then((res) => res.json())
          .then((orderData) => {
            if (!orderData) {
              throw new Error("Order not found");
            }
            setOrder(orderData);
            setOrderStatus(orderData.status || "Pending");

            if (orderData.totalDeliveryTime) {
              setTotalDeliveryTime(orderData.totalDeliveryTime);
              setDeliveryTime(orderData.totalDeliveryTime);
            }
            if (orderData.preparationTime) {
              setPreparationTime(orderData.preparationTime);
            }
            if (orderData.deliveringTime) {
              setDeliveringTime(orderData.deliveringTime);
              const matchingRange = deliveryTimeRanges.find(
                (r) => r.minutes === orderData.deliveringTime
              );
              if (matchingRange) {
                setSelectedTimeRange(matchingRange);
              }
            }

            setLoadingOrder(false);
            setCalculatingTime(false);
          })
          .catch((error) => {
            console.error("Error fetching order:", error);
            setLoadingOrder(false);
            setCalculatingTime(false);
          });
      }
    }
  }, [id, session.status, deliveryTimeRanges]);

  useEffect(() => {
    if (order) {
      const statusPercentages = {
        Pending: 20,
        Processing: 40,
        Preparing: 70,
        Delivering: 100,
        Completed: 100,
      };

      // Define time in minutes for each status
      const statusDurations = {
        Pending: pendingTime, // 5 minutes
        Processing: processingTime, // 3 minutes
        Preparing: preparationTime, // dynamic preparation time
        Delivering: deliveringTime, // dynamic delivering time
      };

      if (orderStatus === "Completed") {
        setProgress(100);
        localStorage.setItem(`order_progress_${id}`, "100");
        return;
      }

      const targetProgress = statusPercentages[orderStatus] || 0;
      const currentProgress = progress;

      if (currentProgress < targetProgress) {
        // Get the duration for current status in milliseconds
        const currentDuration = (statusDurations[orderStatus] || 1) * 60 * 1000;

        const progressDifference = targetProgress - currentProgress;
        const stepSize = 0.1;
        const totalSteps = progressDifference / stepSize;
        const intervalTime = Math.floor(currentDuration / totalSteps) || 100;

        const intervalId = setInterval(() => {
          setProgress((prev) => {
            const newProgress = Math.min(prev + stepSize, targetProgress);

            if (newProgress >= targetProgress) {
              clearInterval(intervalId);
              fetch("/api/updateProgress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId: id,
                  progress: targetProgress,
                }),
              }).catch(console.error);
              return targetProgress;
            }

            fetch("/api/updateProgress", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: id,
                progress: newProgress,
              }),
            }).catch(console.error);

            return newProgress;
          });
        }, intervalTime);

        return () => {
          if (intervalId) clearInterval(intervalId);
        };
      }
    }
  }, [
    order,
    orderStatus,
    progress,
    id,
    pendingTime,
    processingTime,
    preparationTime,
    deliveringTime,
  ]);

  useEffect(() => {
    if (order && order.branchId) {
      setCalculatingTime(true);
      // Get branch address from order.branchId
      fetch(`/api/branches/${order.branchId}`)
        .then((res) => res.json())
        .then(async (branchData) => {
          const branchAddress = `${branchData.streetAddress}, ${branchData.city}`;
          const customerAddress = `${order.streetAddress}, ${order.city}`;

          const estimatedTime = await calculateDeliveryTime(
            branchAddress,
            customerAddress
          );
          setDeliveryTime(estimatedTime);
          setCalculatingTime(false);
        })
        .catch((error) => {
          console.error("Error calculating delivery time:", error);
          setCalculatingTime(false);
        });
    }
  }, [order]);

  function handleDeliveryTimeUpdate(selectedRange) {
    setDeliveringTime(selectedRange.minutes);
    setSelectedTimeRange(selectedRange);
  }

  function handleCookingTimeUpdate(time) {
    setPreparationTime(parseInt(time));
  }

  function handleSaveTotalTime() {
    const total =
      pendingTime + processingTime + preparationTime + (deliveringTime || 0);

    const updatePromise = fetch("/api/updateDeliveryTime", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: id,
        totalDeliveryTime: total,
        preparationTime: preparationTime,
        deliveringTime: deliveringTime,
        pendingTime: pendingTime,
        processingTime: processingTime,
        totalSeconds: total * 60,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setTotalDeliveryTime(total);
          setDeliveryTime(total);
          return data;
        } else {
          throw new Error(data.message);
        }
      });

    toast.promise(updatePromise, {
      loading: "Updating total delivery time...",
      success: "Total delivery time updated successfully!",
      error: (err) => `Failed to update total delivery time: ${err.toString()}`,
    });
  }

  const calculateRemainingTime = useCallback(() => {
    if (!order || orderStatus === "Completed") return 0;

    // Get the time elapsed since the order status was last updated
    const lastStatusUpdate = new Date(order.updatedAt || order.createdAt);
    const elapsedMinutes = Math.floor(
      (new Date() - lastStatusUpdate) / (1000 * 60)
    );

    const statusDurations = {
      Pending: pendingTime,
      Processing: processingTime,
      Preparing: preparationTime,
      Delivering: deliveringTime || 0,
    };

    // Calculate total time remaining
    let remainingTime = 0;
    let foundCurrentStatus = false;

    for (const status of Object.keys(statusDurations)) {
      if (status === orderStatus) {
        foundCurrentStatus = true;
        // Subtract elapsed time only from current status
        const statusTime = statusDurations[status];
        remainingTime += Math.max(0, statusTime - elapsedMinutes);
      } else if (foundCurrentStatus) {
        // Add full duration for upcoming statuses
        remainingTime += statusDurations[status];
      }
    }

    return remainingTime * 60; // Convert to seconds
  }, [
    order,
    orderStatus,
    pendingTime,
    processingTime,
    preparationTime,
    deliveringTime,
  ]);

  useEffect(() => {
    if (order && order.status !== "Completed") {
      const timer = setInterval(() => {
        calculateRemainingTime();
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [order, calculateRemainingTime]);

  useEffect(() => {
    if (order && orderStatus !== "Completed") {
      const calculateInitialCountdown = () => {
        const lastUpdate = new Date(
          order.countdown?.lastUpdated || order.updatedAt || order.createdAt
        );
        const now = new Date();
        const elapsedSeconds = Math.floor((now - lastUpdate) / 1000);
        const totalTime = order.countdown?.totalDuration || 0;

        return Math.max(0, totalTime - elapsedSeconds);
      };

      const initialCountdown = calculateInitialCountdown();
      setCountdown(initialCountdown);

      // Emit initial countdown to socket
      const socket = getSocket();
      socket.emit("startCountdown", {
        orderId: id,
        remainingTime: initialCountdown,
        status: orderStatus,
      });
    }
  }, [order, orderStatus, id]);

  useEffect(() => {
    if (countdown > 0 && orderStatus !== "Completed") {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [countdown, orderStatus]);

  function formatCountdown(seconds) {
    if (!seconds) return "00:00:00";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  useEffect(() => {
    const socket = getSocket();

    if (id) {
      // Join the order room
      socket.emit("joinOrderRoom", id);

      // Listen for countdown updates
      socket.on("countdownUpdate", (data) => {
        if (data.orderId === id) {
          // Add check to ensure update is for current order
          const { remainingTime } = data;
          setCountdown(remainingTime);
        }
      });

      // Cleanup function
      return () => {
        socket.off("countdownUpdate");
        socket.emit("leaveOrderRoom", id);
      };
    }
  }, [id]);

  if (session.status === "unauthenticated") {
    return "Please login to view order details";
  }

  if (loadingOrder) {
    return (
      <div className="my-4">
        <Spinner fullWidth={true} />
      </div>
    );
  }

  let subtotal = 0;
  if (order?.cartProducts) {
    for (const product of order.cartProducts) {
      subtotal += cartProductPrice(product);
    }
  }

  // Calculate status index for progress bar
  const statusOptions = [
    "Pending",
    "Processing",
    "Preparing",
    "Delivering",
    "Completed",
  ];
  const statusIndex = statusOptions.indexOf(orderStatus);

  return (
    <section className="max-w-2xl mx-auto mt-8 px-4 sm:px-6">
      <div className="text-center">
        <SectionHeaders mainHeader="Your order" />
        <div className="mt-6 mb-8 space-y-2">
          <p className="text-gray-600">Thanks for your order.</p>
          <p className="text-gray-600">
            We will call you when your order is on the way.
          </p>
          <p className="text-gray-600">
            Expected delivery time:{" "}
            {calculatingTime ? (
              <strong className="text-primary">Calculating...</strong>
            ) : orderStatus === "Completed" ? (
              <strong className="text-green-600">Delivered</strong>
            ) : orderStatus === "Pending" ? (
              <strong className="text-primary">Waiting...</strong>
            ) : (
              <>
                <strong className="text-primary">
                  {deliveryTime ? formatTime(deliveryTime) : "Waiting..."}
                </strong>
                {countdown !== null && (
                  <span className="ml-2 text-sm">
                    (Remaining:{" "}
                    <strong className="text-primary">
                      {formatCountdown(countdown)}
                    </strong>
                    )
                  </span>
                )}
              </>
            )}
          </p>
          {canManageOrders && (
            <div className="mt-8 space-y-6">
              {/* Time Breakdown Display */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">
                  Delivery Time Breakdown:
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Preparation Time:</span>
                    <span>{formatTime(preparationTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivering Time:</span>
                    <span>
                      {deliveringTime
                        ? formatTime(deliveringTime)
                        : "0 minutes"}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-medium">
                    <span>Total Estimated Time:</span>
                    <span>
                      {formatTime(
                        pendingTime +
                          processingTime +
                          preparationTime +
                          (deliveringTime || 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Time and Cooking Time Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Delivery Time Selector */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Set Delivery Time Based on Distance
                  </label>
                  <div className="space-y-3">
                    <select
                      className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                      onChange={(e) => {
                        if (e.target.value === "custom") {
                          setIsCustomDeliveryTime(true);
                        } else {
                          const selected = deliveryTimeRanges.find(
                            (r) => r.range === e.target.value
                          );
                          if (selected) {
                            setIsCustomDeliveryTime(false);
                            handleDeliveryTimeUpdate(selected);
                          }
                        }
                      }}
                      value={
                        isCustomDeliveryTime
                          ? "custom"
                          : selectedTimeRange?.range || ""
                      }
                    >
                      <option value="">Select distance range</option>
                      {deliveryTimeRanges.map((range) => (
                        <option key={range.range} value={range.range}>
                          {range.label} - {formatTime(range.minutes)}
                        </option>
                      ))}
                      <option value="custom">Other</option>
                    </select>

                    {isCustomDeliveryTime && (
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={deliveringTime || ""}
                        onChange={(e) => {
                          const minutes = parseInt(e.target.value);
                          setDeliveringTime(minutes);
                          setSelectedTimeRange({
                            range: "custom",
                            label: "Custom",
                            minutes: minutes,
                          });
                        }}
                        className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        placeholder="Minutes"
                      />
                    )}
                  </div>
                </div>

                {/* Cooking Time Selector */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Set Cooking Time
                  </label>
                  <div className="space-y-3">
                    <select
                      className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                      onChange={(e) => {
                        if (e.target.value === "custom") {
                          setIsCustomCookingTime(true);
                        } else {
                          setIsCustomCookingTime(false);
                          handleCookingTimeUpdate(e.target.value);
                        }
                      }}
                      value={isCustomCookingTime ? "custom" : preparationTime}
                    >
                      <option>Set Cooking Time</option>
                      <option value="15">Standard (15 minutes)</option>
                      <option value="20">20 minutes</option>
                      <option value="25">25 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="custom">Other</option>
                    </select>

                    {isCustomCookingTime && (
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={preparationTime}
                        onChange={(e) =>
                          setPreparationTime(parseInt(e.target.value))
                        }
                        className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        placeholder="Minutes"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Save Total Time Button */}
              <button
                onClick={handleSaveTotalTime}
                className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Save Total Delivery Time
              </button>
            </div>
          )}
        </div>
      </div>
      {order && (
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <div className="space-y-6">
            {order?.cartProducts?.length > 0 && (
              <>
                <div className="space-y-4">
                  {order.cartProducts.map((product) => (
                    <CartProduct
                      key={product._id}
                      product={product}
                      readOnly={true}
                    />
                  ))}
                </div>
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold">
                        ₱{subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Delivery:</span>
                      <span className="font-semibold">₱20</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-800 font-medium">
                          Total:
                        </span>
                        <span className="font-bold text-lg">
                          ₱{(subtotal + 20).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            {order && !order.cartProducts?.length && (
              <div className="text-center p-4 bg-gray-50 rounded-lg text-gray-500">
                No products found in this order
              </div>
            )}
            <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg text-gray-800">
                  Order Status
                </h2>
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor:
                      orderStatus === "Completed"
                        ? "#86efac" // green-300
                        : orderStatus === "Delivering"
                        ? "#93c5fd" // blue-300
                        : orderStatus === "Preparing"
                        ? "#fcd34d" // yellow-300
                        : orderStatus === "Processing"
                        ? "#cbd5e1" // slate-300
                        : "#f87171", // red-400 for Pending
                    color:
                      orderStatus === "Completed"
                        ? "#14532d" // green-900
                        : orderStatus === "Delivering"
                        ? "#1e3a8a" // blue-900
                        : orderStatus === "Preparing"
                        ? "#78350f" // yellow-900
                        : orderStatus === "Processing"
                        ? "#0f172a" // slate-900
                        : "#7f1d1d", // red-900 for Pending
                  }}
                >
                  {orderStatus}
                </span>
              </div>
              {orderStatus !== "Completed" && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 overflow-hidden">
                  <div
                    className="h-2.5 rounded-full transition-all"
                    style={{
                      width: `${progress}%`,
                      background: `linear-gradient(
                        90deg,
                        rgba(79, 70, 229, 0.8) 0%,
                        rgba(79, 70, 229, 1) 10%,
                        rgba(79, 70, 229, 0.8) 10%,
                        rgba(79, 70, 229, 1) 60%,
                        rgba(79, 70, 229, 0.8) 60%,
                        rgba(79, 70, 229, 1) 70%,
                        rgba(79, 70, 229, 0.8) 70%,
                        rgba(79, 70, 229, 1) 100%
                      )`,
                      backgroundSize: "200% 100%",
                      animation: "statusBarShimmer 4s linear infinite",
                    }}
                  />
                </div>
              )}
              {canManageOrders && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const newStatus = e.target.status.value;
                    handleStatusChange(newStatus);
                  }}
                  className="space-y-3"
                >
                  <select
                    name="status"
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Update Status
                  </button>
                </form>
              )}
            </div>
          </div>
          <div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="font-semibold text-lg mb-4">Delivery Details</h2>
              <AddressInputs disabled={true} addressProps={order} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
