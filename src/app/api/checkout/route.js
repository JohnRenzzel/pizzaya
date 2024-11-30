import { authOptions } from "@/libs/auth";
import { MenuItem } from "@/models/MenuItem";
import { Order } from "@/models/Order";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
const stripe = require("stripe")(process.env.STRIPE_SK);

export async function POST(req) {
  mongoose.connect(process.env.MONGO_URL);

  const { cartProducts, address, branchId } = await req.json();
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  let totalPrice = 0;
  const stripeLineItems = [];

  for (const cartProduct of cartProducts) {
    const productInfo = await MenuItem.findById(cartProduct._id);

    // Calculate base price
    let productPrice = productInfo.basePrice;

    // Apply discount if exists
    if (productInfo.discount > 0) {
      productPrice = productPrice * (1 - productInfo.discount / 100);
    }

    // Add size price if selected
    if (cartProduct.size) {
      const size = productInfo.sizes.find(
        (size) => size?._id?.toString() === cartProduct?.size?._id?.toString()
      );
      productPrice += size?.price || 0;
    }

    // Add extras prices
    if (cartProduct.extras?.length > 0) {
      for (const cartProductExtraThing of cartProduct.extras) {
        const productExtras = productInfo.extraIngredientPrices;
        const extraThingInfo = productExtras.find(
          (extra) =>
            extra._id.toString() === cartProductExtraThing._id.toString()
        );
        productPrice += extraThingInfo?.price || 0;
      }
    }

    // Multiply by quantity
    const quantity = cartProduct.quantity || 1;
    totalPrice += productPrice * quantity;

    const productName = cartProduct.name;

    stripeLineItems.push({
      quantity: quantity,
      price_data: {
        currency: "PHP",
        product_data: {
          name: productName,
        },
        unit_amount: Math.round(productPrice * 100), // Convert to cents and ensure it's an integer
      },
    });
  }

  const deliveryFee = 2000; // 20 PHP in cents
  totalPrice += deliveryFee / 100;

  // Create order with correct prices
  const orderDoc = await Order.create({
    userEmail,
    ...address,
    cartProducts,
    branchId,
    paid: false,
    totalPrice,
  });

  const stripeSession = await stripe.checkout.sessions.create({
    line_items: stripeLineItems,
    mode: "payment",
    customer_email: userEmail,
    success_url:
      process.env.NEXTAUTH_URL +
      "orders/" +
      orderDoc._id.toString() +
      "?clear-cart=1",
    cancel_url: process.env.NEXTAUTH_URL + "cart?canceled=1",
    metadata: { orderId: orderDoc._id.toString() },
    payment_intent_data: {
      metadata: { orderId: orderDoc._id.toString() },
    },
    shipping_options: [
      {
        shipping_rate_data: {
          display_name: "Delivery fee",
          type: "fixed_amount",
          fixed_amount: { amount: deliveryFee, currency: "PHP" },
        },
      },
    ],
  });

  return Response.json(stripeSession.url);
}
