"use client";

import { useEffect, useState, useContext, useCallback } from "react";
import { useParams } from "next/navigation";
import Spinner from "@/components/layout/Spinner";
import { useBranch } from "@/components/BranchContext";
import Image from "next/image";
import AddToCartButton from "@/components/menu/AddToCartButton";
import { useSession } from "next-auth/react";
import { CartContext } from "@/components/AppContext";
import toast from "react-hot-toast";
import DiscountSelector from "@/components/layout/DiscountSelector";

export default function MenuItemDetails() {
  const { id } = useParams();
  const [menuItem, setMenuItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedBranch } = useBranch();
  const { data: session } = useSession();
  const [showPopup, setShowPopup] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const { addToCart } = useContext(CartContext);

  const canManageAvailability = useCallback(() => {
    if (!session?.user) {
      return false;
    }

    if (session.user.superAdmin) {
      return true;
    }

    const isValidRole = session.user.isAdmin || session.user.isStaff;
    const hasSameBranch = session.user.branchId === selectedBranch?._id;

    return isValidRole && hasSameBranch;
  }, [session?.user, selectedBranch?._id]);

  const handleAvailabilityChange = async (e) => {
    try {
      const newAvailability = e.target.value === "available";

      const response = await fetch(`/api/menu-items/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          available: newAvailability,
          selectedBranchId: selectedBranch?._id,
          canManage: canManageAvailability(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update availability");
      }

      const responseData = await response.json();
      setMenuItem((prev) => ({
        ...prev,
        isAvailable: responseData.isAvailable,
      }));
    } catch (error) {
      console.error("Error updating availability:", error);
      alert(error.message);
    }
  };

  const AvailabilitySection = () => (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <span
          className={`inline-block w-3 h-3 rounded-full ${
            menuItem.isAvailable ? "bg-green-500" : "bg-red-500"
          }`}
        ></span>
        {canManageAvailability() ? (
          <select
            value={menuItem.isAvailable ? "available" : "not-available"}
            onChange={handleAvailabilityChange}
            className="ml-2 p-2 border rounded-md text-sm bg-white"
          >
            <option value="available">Available</option>
            <option value="not-available">Not Available</option>
          </select>
        ) : (
          <span className="text-gray-600">
            {menuItem.isAvailable ? "Available" : "Not Available"}
          </span>
        )}
      </div>
    </div>
  );

  const DiscountSection = () => {
    const canManageDiscount =
      session?.user?.superAdmin ||
      ((session?.user?.isAdmin || session?.user?.isStaff) &&
        session?.user?.branchId === selectedBranch?._id);

    if (!canManageDiscount) {
      return menuItem.discount > 0 ? (
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">Special Discount</h3>
          <p className="text-green-600 font-semibold">
            -{menuItem.discount}% Off
          </p>
        </div>
      ) : null;
    }

    return (
      <div className="mb-4">
        <h3 className="text-xl font-semibold mb-2">Manage Discount</h3>
        <DiscountSelector
          itemId={menuItem._id}
          currentDiscount={menuItem.discount}
          onDiscountChange={(newDiscount) => {
            const newDiscountedPrice =
              menuItem.basePrice * (1 - newDiscount / 100);
            setMenuItem((prev) => ({
              ...prev,
              discount: newDiscount,
              discountedPrice: newDiscountedPrice,
            }));
          }}
          canManageDiscount={canManageDiscount}
        />
      </div>
    );
  };

  useEffect(() => {
    if (id) {
      fetch(`/api/menu-items?_id=${id}`)
        .then((res) => res.json())
        .then((item) => {
          if (item) {
            setMenuItem(item);
          } else {
            setMenuItem(null);
          }
          setIsLoading(false);
        });
    }
  }, [id, session, selectedBranch]);

  useEffect(() => {
    console.log({
      userRole: session?.user?.role,
      userBranchId: session?.user?.branchId,
      selectedBranchId: selectedBranch?._id,
      canManage: canManageAvailability(),
    });
  }, [session, selectedBranch, canManageAvailability]);

  useEffect(() => {
    console.log("Full session state:", {
      isLoaded: !!session,
      user: session?.user,
      role: session?.user?.role,
      branchId: session?.user?.branchId,
    });
  }, [session]);

  const handleExtraThingClick = (ev, extraThing) => {
    const checked = ev.target.checked;
    if (checked) {
      setSelectedExtras((prev) => [...prev, extraThing]);
    } else {
      setSelectedExtras((prev) => prev.filter((e) => e._id !== extraThing._id));
    }
  };

  const calculateTotalPrice = () => {
    let total =
      menuItem.discount > 0
        ? menuItem.basePrice * (1 - menuItem.discount / 100)
        : menuItem.basePrice;

    if (selectedSize) {
      const sizePrice = selectedSize.price * (1 - menuItem.discount / 100);
      total += sizePrice;
    }

    if (selectedExtras?.length > 0) {
      for (const extra of selectedExtras) {
        const extraPrice = extra.price * (1 - menuItem.discount / 100);
        total += extraPrice;
      }
    }

    return Number(total.toFixed(2));
  };

  const handleAddToCart = () => {
    if (!selectedBranch) {
      toast.error("Please select a branch first");
      return;
    }

    const finalPrice = calculateTotalPrice();

    if (
      menuItem.sizes?.length > 0 ||
      menuItem.extraIngredientPrices?.length > 0
    ) {
      if (!showPopup) {
        setShowPopup(true);
        if (menuItem.sizes?.length > 0) {
          setSelectedSize(menuItem.sizes[0]);
        }
        return;
      }
      addToCart(menuItem, selectedSize, selectedExtras, 1, finalPrice);
      setShowPopup(false);
      toast.success("Added to cart!");
    } else {
      addToCart(menuItem, null, [], 1, calculateTotalPrice());
    }
  };

  if (isLoading) {
    return (
      <div className="my-4">
        <Spinner fullWidth={true} />
      </div>
    );
  }

  if (!menuItem) {
    return (
      <div className="mt-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Menu item not found
        </h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4">
      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="relative w-full aspect-square">
            <Image
              src={menuItem.image}
              alt={menuItem.name}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>

          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              {menuItem.name}
            </h1>
            <p className="text-gray-600 mb-4">{menuItem.description}</p>

            {AvailabilitySection()}

            {DiscountSection()}

            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">Price</h3>
              {menuItem.discount > 0 ? (
                <div>
                  <p className="text-2xl text-gray-500 line-through">
                    ₱{menuItem.basePrice}
                  </p>
                  <p className="text-2xl text-primary">
                    ₱
                    {(
                      menuItem.discountedPrice ||
                      menuItem.basePrice * (1 - menuItem.discount / 100)
                    ).toFixed(2)}
                  </p>
                </div>
              ) : (
                <p className="text-2xl text-primary">₱{menuItem.basePrice}</p>
              )}
            </div>

            {menuItem.sizes?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Available Sizes</h3>
                <div className="space-y-2">
                  {menuItem.sizes.map((size) => (
                    <div
                      key={size._id}
                      className="flex justify-between items-center bg-gray-50 p-2 rounded"
                    >
                      <span>{size.name}</span>
                      <span className="text-primary">+₱{size.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {menuItem.extraIngredientPrices?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">
                  Extra Ingredients
                </h3>
                <div className="space-y-2">
                  {menuItem.extraIngredientPrices.map((extra) => (
                    <div
                      key={extra._id}
                      className="flex justify-between items-center bg-gray-50 p-2 rounded"
                    >
                      <span>{extra.name}</span>
                      <span className="text-primary">+₱{extra.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto">
              <AddToCartButton
                image={menuItem.image}
                hasSizesOrExtras={
                  menuItem.sizes?.length > 0 ||
                  menuItem.extraIngredientPrices?.length > 0
                }
                onClick={handleAddToCart}
                basePrice={
                  menuItem.discount > 0
                    ? menuItem.basePrice * (1 - menuItem.discount / 100)
                    : menuItem.basePrice
                }
                disabled={!menuItem.isAvailable}
                className={`${
                  !menuItem.isAvailable
                    ? "opacity-50 cursor-not-allowed pointer-events-none"
                    : ""
                }`}
              />
              {!menuItem.isAvailable && (
                <p className="text-red-500 text-sm mt-2">
                  This item is currently not available
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
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
              className="overflow-y-scroll p-2"
              style={{ maxHeight: "calc(100vh - 100px)" }}
            >
              <Image
                className="mx-auto"
                src={menuItem.image}
                alt={menuItem.name}
                width={300}
                height={200}
              />
              <h2 className="text-lg font-bold text-center mb-2">
                {menuItem.name}
              </h2>
              <p className="text-center text-gray-500 text-sm mb-2">
                {menuItem.description}
              </p>
              {menuItem.sizes?.length > 0 && (
                <div className="py-2">
                  <h3 className="text-center text-gray-700">Pick your size</h3>
                  {menuItem.sizes.map((size) => (
                    <label
                      key={size._id}
                      className="flex items-center gap-2 p-4 border rounded-md mb-1"
                    >
                      <input
                        type="radio"
                        name="size"
                        onChange={() => setSelectedSize(size)}
                        checked={selectedSize?._id === size._id}
                      />
                      {size.name} ₱
                      {(
                        (menuItem.basePrice + size.price) *
                        (1 - menuItem.discount / 100)
                      ).toFixed(2)}
                    </label>
                  ))}
                </div>
              )}
              {menuItem.extraIngredientPrices?.length > 0 && (
                <div className="py-2">
                  <h3 className="text-center text-gray-700">Any extras?</h3>
                  {menuItem.extraIngredientPrices.map((extra) => (
                    <label
                      key={extra._id}
                      className="flex items-center gap-2 p-4 border rounded-md mb-1"
                    >
                      <input
                        type="checkbox"
                        onChange={(ev) => handleExtraThingClick(ev, extra)}
                        checked={selectedExtras
                          .map((e) => e._id)
                          .includes(extra._id)}
                      />
                      {extra.name} +₱{extra.price}
                    </label>
                  ))}
                </div>
              )}
              <button
                onClick={handleAddToCart}
                className="primary sticky bottom-2 w-full"
              >
                Add to cart ₱{calculateTotalPrice()}
              </button>
              <button
                className="mt-2 w-full"
                onClick={() => setShowPopup(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
