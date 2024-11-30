"use client";
import { SessionProvider } from "next-auth/react";
import {
  createContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import toast from "react-hot-toast";
import { BranchProvider } from "./BranchContext";

export const CartContext = createContext({});

export function cartProductPrice(cartProduct) {
  let price = cartProduct.basePrice;

  if (cartProduct.size) {
    const sizePrice =
      cartProduct.size.price * (1 - (cartProduct.discount || 0) / 100);
    price += sizePrice;
  }

  if (cartProduct.extras?.length > 0) {
    for (const extra of cartProduct.extras) {
      const extraPrice = extra.price * (1 - (cartProduct.discount || 0) / 100);
      price += extraPrice;
    }
  }

  return price * (cartProduct.quantity || 1);
}
export function AppProvider({ children }) {
  const [cartProducts, setCartProducts] = useState([]);

  const ls = useMemo(() => {
    return typeof window !== "undefined" ? window.localStorage : null;
  }, []);

  useEffect(() => {
    if (ls && ls.getItem("cart")) {
      setCartProducts(JSON.parse(ls.getItem("cart")));
    }
  }, [ls]);

  const clearCart = useCallback(() => {
    setCartProducts([]);
    localStorage.removeItem("cart");
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.location.href.includes("clear-cart=1")) {
        clearCart();
      }
    }
  }, [clearCart]);

  function removeCartProduct(indexToRemove) {
    setCartProducts((prevCartProducts) => {
      const newCartProducts = prevCartProducts.filter(
        (v, index) => index !== indexToRemove
      );
      saveCartProductsToLocalStorage(newCartProducts);
      return newCartProducts;
    });
    toast.success("Product removed");
  }

  function saveCartProductsToLocalStorage(cartProducts) {
    if (!ls) return;

    try {
      const serializedCart = JSON.stringify(cartProducts);
      ls.setItem("cart", serializedCart);

      // Verify the save was successful
      const savedCart = ls.getItem("cart");
      if (savedCart !== serializedCart) {
        console.error("Cart save verification failed");
        toast.error("Failed to save cart");
      }
    } catch (error) {
      console.error("Error saving cart:", error);
      toast.error("Failed to save cart");
    }
  }

  function addToCart(product, size = null, extras = [], quantity = 1) {
    if (!product.branchId) {
      toast.error("Please select a branch first");
      return;
    }

    // Add a small delay to ensure branch context is ready
    setTimeout(() => {
      const cartProduct = {
        ...product,
        size,
        extras,
        quantity,
        branchId: product.branchId,
        basePrice:
          product.discount > 0 ? product.discountedPrice : product.basePrice,
      };

      try {
        setCartProducts((prevProducts) => {
          const existingBranchId = prevProducts?.[0]?.branchId;

          if (!prevProducts.length) {
            const newProducts = [cartProduct];
            saveCartProductsToLocalStorage(newProducts);
            return newProducts;
          }

          if (existingBranchId && existingBranchId !== product.branchId) {
            const userConfirmed = window.confirm(
              "Adding items from a different branch will clear your current cart. Continue?"
            );

            if (userConfirmed) {
              const newProducts = [cartProduct];
              saveCartProductsToLocalStorage(newProducts);
              toast.success("Cart updated with new branch items");
              return newProducts;
            } else {
              toast.error("Item not added to maintain same branch items");
              return prevProducts;
            }
          }

          const newProducts = [...prevProducts, cartProduct];
          saveCartProductsToLocalStorage(newProducts);
          return newProducts;
        });
      } catch (error) {
        console.error("Error adding to cart:", error);
        toast.error("Failed to add item to cart");
      }
    }, 100); // Small delay to ensure context is ready
  }

  function updateCartProduct(index, updatedProduct) {
    setCartProducts((prevProducts) => {
      const newProducts = [...prevProducts];
      newProducts[index] = updatedProduct;
      saveCartProductsToLocalStorage(newProducts);
      return newProducts;
    });
  }

  return (
    <SessionProvider>
      <BranchProvider>
        <CartContext.Provider
          value={{
            cartProducts,
            setCartProducts,
            addToCart,
            removeCartProduct,
            clearCart,
            updateCartProduct,
          }}
        >
          {children}
        </CartContext.Provider>
      </BranchProvider>
    </SessionProvider>
  );
}
