import { useContext, useState } from "react";
import { CartContext } from "../AppContext";
import toast from "react-hot-toast";
import MenuItemTile from "@/components/menu/MenuItemTile";
import Image from "next/image";
import FlyingButton from "react-flying-item";

export default function MenuItem(menuItem) {
  const {
    image,
    name,
    description,
    basePrice,
    sizes,
    extraIngredientPrices,
    isAvailable,
    disabled,
  } = menuItem;
  const [selectedSize, setSelectedSize] = useState(sizes?.[0] || null);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const { addToCart } = useContext(CartContext);
  const [showPopup, setShowPopup] = useState(false);

  const hasOptions = sizes?.length > 0 || extraIngredientPrices?.length > 0;

  async function handleAddToCartButtonClick() {
    if (disabled || !isAvailable) {
      toast.error("This item is currently not available");
      return;
    }

    if (!menuItem.branchId) {
      toast.error("Please select a branch first");
      return;
    }

    if (hasOptions && !showPopup) {
      setShowPopup(true);
      return;
    }

    if (!hasOptions) {
      addToCart(menuItem, selectedSize, selectedExtras, 1);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } else {
      addToCart(menuItem, selectedSize, selectedExtras, 1);
      toast.success("Added to cart!");
      setShowPopup(false);
    }
  }
  function handleExtraThingClick(ev, extraThing) {
    const checked = ev.target.checked;
    if (checked) {
      setSelectedExtras((prev) => [...prev, extraThing]);
    } else {
      setSelectedExtras((prev) => {
        return prev.filter((e) => e.name !== extraThing.name);
      });
    }
  }

  let selectedPrice =
    menuItem.discount > 0
      ? basePrice * (1 - menuItem.discount / 100)
      : basePrice;

  if (selectedSize) {
    const sizePrice = selectedSize.price * (1 - (menuItem.discount || 0) / 100);
    selectedPrice += sizePrice;
  }

  if (selectedExtras?.length > 0) {
    for (const extra of selectedExtras) {
      const extraPrice = extra.price * (1 - (menuItem.discount || 0) / 100);
      selectedPrice += extraPrice;
    }
  }

  return (
    <>
      {showPopup && (
        <div
          onClick={() => setShowPopup(false)}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        >
          <div
            onClick={(ev) => ev.stopPropagation()}
            className="my-8 bg-white p-4 rounded-lg max-w-md"
          >
            <div
              className="overflow-y-scroll p-2 relative"
              style={{ maxHeight: "calc(100vh - 100px)" }}
            >
              <Image
                className="mx-auto"
                src={image}
                alt={name}
                width={300}
                height={200}
              />
              <h2 className="text-lg font-bold text-center mb-2">{name}</h2>
              <p className="text-center text-gray-500 text-sm mb-2">
                {description}
              </p>
              {sizes?.length > 0 && (
                <div className="py-2">
                  <h3 className="text-center text-gray-700">Pick your size</h3>
                  {sizes.map((size) => {
                    const discountedSizePrice =
                      (basePrice + size.price) *
                      (1 - (menuItem.discount || 0) / 100);
                    return (
                      <label
                        key={size._id}
                        className="flex items-center gap-2 p-4 border rounded-md mb-1"
                      >
                        <input
                          type="radio"
                          name="size"
                          onChange={() => setSelectedSize(size)}
                          checked={selectedSize?.name === size.name}
                        />
                        {size.name} ₱{discountedSizePrice.toFixed(2)}
                      </label>
                    );
                  })}
                </div>
              )}
              {extraIngredientPrices?.length > 0 && (
                <div className="py-2">
                  <h3 className="text-center text-gray-700">Any extras?</h3>
                  {extraIngredientPrices.map((extraThing) => (
                    <label
                      key={extraThing._id}
                      className="flex items-center gap-2 p-4 border rounded-md mb-1"
                    >
                      <input
                        type="checkbox"
                        onChange={(ev) => handleExtraThingClick(ev, extraThing)}
                        checked={selectedExtras
                          .map((e) => e._id)
                          .includes(extraThing._id)}
                      />
                      {extraThing.name} +₱{extraThing.price}
                    </label>
                  ))}
                </div>
              )}
              <div className="sticky bottom-0 left-0 right-0 bg-white pt-4">
                <button
                  onClick={handleAddToCartButtonClick}
                  className="primary w-full"
                >
                  Add to cart ₱{selectedPrice.toFixed(2)}
                </button>
              </div>
              <button
                className="mt-4 w-full"
                onClick={() => setShowPopup(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <MenuItemTile
        onAddToCart={handleAddToCartButtonClick}
        {...menuItem}
        disabled={disabled || !isAvailable}
      />
    </>
  );
}
