"use client";

import { CartContext, cartProductPrice } from "@/components/AppContext";
import { useBranch } from "@/components/BranchContext";
import SectionHeaders from "@/components/layout/SectionHeaders";
import CartProduct from "@/components/menu/CartProduct";
import { useContext, useEffect, useState } from "react";
import AddressInputs from "@/components/layout/AddressInputs";
import useProfile from "@/components/UseProfile";
import toast from "react-hot-toast";

export default function CartPage() {
  const { cartProducts, removeCartProduct, updateCartProduct } =
    useContext(CartContext);
  const { selectedBranch } = useBranch();
  const [address, setAddress] = useState({});
  const { data: profileData } = useProfile();

  // Filter cart products for the selected branch
  const branchCartProducts = cartProducts.filter(
    (product) => product.branchId === selectedBranch?._id
  );

  useEffect(() => {
    if (typeof window.console !== "undefined") {
      if (window.location.href.includes("canceled=1")) {
        toast.error("Payment failed ☹️");
      }
    }
  }, []);

  useEffect(() => {
    if (profileData?.city) {
      const { phone, streetAddress, city, postalCode, province } = profileData;
      const addressFrompProfile = {
        phone,
        streetAddress,
        city,
        postalCode,
        province,
      };
      setAddress(addressFrompProfile);
    }
  }, [profileData]);

  let subTotal = 0;
  let totalQuantity = 0;
  for (const p of branchCartProducts) {
    subTotal += cartProductPrice(p);
    totalQuantity += p.quantity || 1;
  }

  function handleAddressChange(propName, value) {
    setAddress((prevAddress) => ({ ...prevAddress, [propName]: value }));
  }

  function handleQuantityChange(index, newQuantity) {
    const product = cartProducts[index];
    if (newQuantity >= 1) {
      updateCartProduct(index, { ...product, quantity: newQuantity });
    }
  }

  async function proceedToCheckout(ev) {
    ev.preventDefault();

    // Add validation check
    const requiredFields = [
      "phone",
      "streetAddress",
      "city",
      "postalCode",
      "province",
    ];
    const missingFields = requiredFields.filter((field) => !address[field]);

    if (missingFields.length > 0) {
      toast.error("Please fill in all address fields");
      return;
    }

    const promise = new Promise((resolve, reject) => {
      fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          cartProducts: branchCartProducts,
          branchId: selectedBranch._id,
        }),
      }).then(async (response) => {
        if (response.ok) {
          resolve();
          window.location = await response.json();
        } else {
          reject();
        }
      });
    });

    await toast.promise(promise, {
      loading: "Preparing your order...",
      success: "Redirect to payment",
      error: "Something went wrong... Please try again later",
    });
  }

  if (!selectedBranch) {
    return (
      <section className="mt-8 text-center">
        <SectionHeaders mainHeader="Cart" />
        <p className="mt-4 text-red-500">
          Please select a branch to view your cart
        </p>
      </section>
    );
  }

  if (branchCartProducts?.length === 0) {
    return (
      <section className="mt-8 text-center">
        <SectionHeaders mainHeader="Cart" />
        <p className="mt-4">Your shopping cart is empty ☹️</p>
      </section>
    );
  }

  return (
    <section className="mt-8 max-w-6xl mx-auto px-4">
      <div className="text-center">
        <SectionHeaders mainHeader={`Cart - ${selectedBranch?.name}`} />
      </div>
      <div className="mt-8 grid gap-8 grid-cols-1 md:grid-cols-2">
        <div className="bg-white rounded-lg">
          {branchCartProducts?.length > 0 &&
            branchCartProducts.map((product, index) => (
              <CartProduct
                key={index}
                product={product}
                onRemove={removeCartProduct}
                onQuantityChange={(newQuantity) =>
                  handleQuantityChange(
                    cartProducts.indexOf(product),
                    newQuantity
                  )
                }
                index={cartProducts.indexOf(product)}
              />
            ))}
          <div className="py-4 flex flex-col sm:flex-row justify-center sm:justify-end items-center border-t">
            <div className="text-gray-500 text-center sm:text-left mb-2 sm:mb-0">
              <div className="flex justify-between gap-8">
                <span>Total Items:</span>
                <span className="font-semibold text-black">
                  {totalQuantity}
                </span>
              </div>
              <div className="flex justify-between gap-8">
                <span>Subtotal:</span>
                <span className="font-semibold text-black">
                  ₱{subTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between gap-8">
                <span>Delivery:</span>
                <span className="font-semibold text-black">₱20</span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="font-semibold text-black">Total:</span>
                <span className="text-primary font-semibold">
                  ₱{(subTotal + 20).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-100 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Checkout</h2>
          <form onSubmit={proceedToCheckout}>
            <AddressInputs
              addressProps={address}
              setAddressProp={handleAddressChange}
            />
            <button
              type="submit"
              className="mt-6 w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary-dark transition-colors"
            >
              Pay ₱{(subTotal + 20).toFixed(2)}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
