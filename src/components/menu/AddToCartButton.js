import { toast } from "react-hot-toast";
import { useBranch } from "@/components/BranchContext";

export default function AddToCartButton({
  image,
  hasSizesOrExtras,
  onClick,
  basePrice,
  disabled = false,
  className = "",
}) {
  const { selectedBranch } = useBranch();

  if (!selectedBranch) {
    return (
      <button
        type="button"
        onClick={() => alert("Please select a branch first")}
        className="bg-gray-300 my-4 text-white rounded-full px-8 py-2 cursor-not-allowed"
      >
        Select branch to order
      </button>
    );
  }

  if (!hasSizesOrExtras) {
    return (
      <button
        onClick={(e) => {
          onClick(e);
          toast.success("Added to cart!", {
            icon: "🛒",
            position: "top-right",
          });
        }}
        className="bg-primary text-white rounded-full px-8 py-2 hover:bg-primary-dark mt-4"
      >
        Add to cart ₱{(basePrice || 0).toFixed(2)}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`bg-primary text-white rounded-full px-8 py-2 
        ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-gray-400"
            : "hover:bg-primary-dark"
        }
        ${className}`}
    >
      {disabled ? (
        <span>Not Available</span>
      ) : hasSizesOrExtras ? (
        <span>Choose Options</span>
      ) : (
        <span>Add to Cart ₱{(basePrice || 0).toFixed(2)}</span>
      )}
    </button>
  );
}
