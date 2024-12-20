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

function getStatusColor(status) {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-800";
    case "Delivering":
      return "bg-blue-100 text-blue-800";
    case "Preparing":
      return "bg-yellow-100 text-yellow-800";
    case "Processing":
      return "bg-gray-200 text-gray-800";
    case "Pending":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
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
    <section className="max-w-7xl mx-auto mt-8 px-4">
      <div className="mb-8 text-center">
        <SectionHeaders mainHeader="Your order" />
        <div className="mt-6 mb-8 space-y-2 max-w-md mx-auto">
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
        </div>
      </div>

      {canManageOrders && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-800">Order Status</h3>
                <span
                  className={`px-2 py-1 rounded-full text-sm ${
                    orderStatus === "Completed"
                      ? "bg-green-100 text-green-800"
                      : orderStatus === "Delivering"
                      ? "bg-blue-100 text-blue-800"
                      : orderStatus === "Preparing"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {orderStatus}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${
                      orderStatus === status
                        ? "bg-primary text-white"
                        : "bg-white border hover:bg-gray-50"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-3">Cooking Time</h3>
              <div className="grid grid-cols-2 gap-2">
                {[15, 20, 25, 30].map((time) => (
                  <button
                    key={time}
                    onClick={() => handleCookingTimeUpdate(time)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium ${
                      preparationTime === time
                        ? "bg-primary text-white"
                        : "bg-white border hover:bg-gray-50"
                    }`}
                  >
                    {time} min
                  </button>
                ))}
              </div>
              {isCustomCookingTime && (
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={preparationTime}
                  onChange={(e) => setPreparationTime(parseInt(e.target.value))}
                  className="mt-2 w-full p-2 border rounded-lg"
                  placeholder="Custom minutes"
                />
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-3">Delivery Time</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {deliveryTimeRanges.slice(0, 4).map((range) => (
                    <button
                      key={range.range}
                      onClick={() => handleDeliveryTimeUpdate(range)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium ${
                        selectedTimeRange?.range === range.range
                          ? "bg-primary text-white"
                          : "bg-white border hover:bg-gray-50"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
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
                    className="mt-2 w-full p-2 border rounded-lg"
                    placeholder="Custom delivery time"
                  />
                )}
              </div>
            </div>

            <div className="md:col-span-3">
              <button
                onClick={handleSaveTotalTime}
                className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-9">
          <div className="bg-white p-2 rounded-lg shadow-sm overflow-x-auto">
            <h2 className="font-semibold text-lg mb-4">Order Status</h2>
            <div className="overflow-x-auto">
              <div className="flex gap-4 min-w-max pb-4">
                {statusOptions.map((status, index) => (
                  <div key={status} className="flex-1 min-w-[200px]">
                    <div
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        status === orderStatus
                          ? `${getStatusColor(status)} border border-gray-200`
                          : ""
                      }`}
                    >
                      {/* Status Icon */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                          ${
                            statusIndex >= statusOptions.indexOf(status)
                              ? "bg-primary text-white"
                              : "bg-gray-100 text-gray-400"
                          }`}
                      >
                        {statusIndex >= statusOptions.indexOf(status) ? (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-current" />
                        )}
                      </div>

                      {/* Status Text */}
                      <div className="flex-grow whitespace-nowrap">
                        <div
                          className={`font-medium ${
                            statusIndex >= statusOptions.indexOf(status)
                              ? "text-gray-900"
                              : "text-gray-500"
                          }`}
                        >
                          {status}
                        </div>
                        {status === orderStatus && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {status === "Completed"
                              ? "Order delivered"
                              : status === "Delivering"
                              ? "On the way"
                              : status === "Preparing"
                              ? "In kitchen"
                              : status === "Processing"
                              ? "Order confirmed"
                              : "Order received"}
                          </div>
                        )}
                      </div>

                      {/* Progress Indicator */}
                      {status === orderStatus && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        </div>
                      )}
                    </div>

                    {/* Connector Line */}
                    {index < statusOptions.length - 1 && (
                      <div className="h-0.5 bg-gray-200 mt-6 mx-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 md:col-span-3">
          <div className="bg-white p-2 rounded-lg shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span>₱20.00</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>₱{(subtotal + 20).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 md:col-span-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Order Items</h2>
            {order?.cartProducts?.length > 0 ? (
              <div className="space-y-4">
                {order.cartProducts.map((product) => (
                  <CartProduct
                    key={product._id}
                    product={product}
                    readOnly={true}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No items in this order</p>
            )}
          </div>
        </div>

        <div className="col-span-12 md:col-span-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Delivery Details</h2>
            <AddressInputs disabled={true} addressProps={order} />
          </div>
        </div>
      </div>
    </section>
  );
}
