import Link from "next/link";
import AddToCartButton from "./AddToCartButton";
import { useBranch } from "@/components/BranchContext";
import { toast } from "react-hot-toast";
import Image from "next/image";

export default function MenuItemTile({ onAddToCart, ...item }) {
  const { image, description, name, basePrice, sizes, extraIngredientPrices } =
    item;
  const hasSizesOrExtras =
    sizes?.length > 0 || extraIngredientPrices?.length > 0;
  const { selectedBranch } = useBranch();

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!selectedBranch || !item.branchId) {
      toast.error("Please select a branch first");
      return;
    }
    onAddToCart();
  };

  return (
    <Link
      href={item.isAvailable ? `/menu/${item._id}` : "#"}
      className={`block pointer-events-${item.isAvailable ? "auto" : "none"}`}
      onClick={(e) => {
        if (!item.isAvailable) {
          e.preventDefault();
        }
      }}
    >
      <div
        className={`bg-gray-200 p-2 sm:p-4 rounded-lg text-center 
        hover:bg-white hover:shadow-md hover:shadow-black/25 transition-all 
        h-full flex flex-col min-w-0 relative
        ${!item.isAvailable ? "opacity-70 cursor-not-allowed" : ""}`}
      >
        {item.discount > 0 && (
          <div
            className="absolute top-4 left-0 bg-red-500 text-white 
            px-4 py-2 rounded-r-full text-base font-bold z-10 shadow-md
            transform -translate-y-1/2 flex items-center gap-1"
          >
            <span className="text-xl">-{item.discount}%</span>
            <span className="text-sm font-normal">OFF</span>
          </div>
        )}

        {!item.isAvailable && (
          <div
            className="absolute top-2 right-2 bg-red-200 text-red-600 
            px-2 py-1 rounded-full text-xs z-10"
          >
            Unavailable
          </div>
        )}
        <div className="text-center h-40 relative">
          <Image
            src={image}
            alt={name}
            width={200}
            height={200}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex-grow flex flex-col gap-1">
          <h4 className="font-semibold text-lg sm:text-xl break-words">
            {name}
          </h4>
          <p className="text-gray-500 text-xs sm:text-sm line-clamp-3 break-words">
            {description}
          </p>
          <div className="mt-auto pt-2">
            <AddToCartButton
              image={image}
              hasSizesOrExtras={hasSizesOrExtras}
              onClick={handleAddToCart}
              basePrice={
                item.discount > 0
                  ? item.basePrice * (1 - item.discount / 100)
                  : item.basePrice
              }
              disabled={!item.isAvailable}
              originalPrice={item.discount > 0 ? item.basePrice : null}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
