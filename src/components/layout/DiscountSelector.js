import { useState } from "react";
import { toast } from "react-hot-toast";

export default function DiscountSelector({
  itemId,
  currentDiscount,
  onDiscountChange,
  canManageDiscount,
  formMode = false,
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  const discountOptions = [
    { label: "No Discount", value: 0 },
    { label: "10% Off", value: 10 },
    { label: "20% Off", value: 20 },
    { label: "30% Off", value: 30 },
    { label: "Other", value: "other" },
  ];

  const handleDiscountChange = async (e) => {
    const value = e.target.value;
    if (!canManageDiscount) {
      toast.error("You are not authorized to change discounts");
      return;
    }

    let discountValue = parseInt(value);
    if (value === "other") {
      const customDiscount = prompt("Enter discount percentage (0-100):");
      if (customDiscount === null) return;

      discountValue = parseInt(customDiscount);
      if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
        toast.error("Please enter a valid discount between 0 and 100");
        return;
      }
    }

    if (formMode) {
      onDiscountChange(discountValue);
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/menu-items/${itemId}/discount`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ discount: discountValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update discount");
      }

      onDiscountChange(discountValue);
      toast.success("Discount updated successfully");
    } catch (error) {
      console.error("Discount update error:", error);
      toast.error(error.message || "Failed to update discount");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!canManageDiscount) return null;

  return (
    <div className="flex items-center gap-2">
      <label>Discount</label>
      <select
        value={
          currentDiscount === 0
            ? "0"
            : currentDiscount === 10
            ? "10"
            : currentDiscount === 20
            ? "20"
            : currentDiscount === 30
            ? "30"
            : "other"
        }
        onChange={handleDiscountChange}
        disabled={isUpdating}
        className="p-2 border rounded-md text-sm"
      >
        {discountOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {currentDiscount > 0 && (
        <span className="text-green-600 font-semibold">
          -{currentDiscount}% Off
        </span>
      )}
    </div>
  );
}
