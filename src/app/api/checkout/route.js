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

    let productPrice = productInfo.basePrice;
    if (cartProduct.size) {
      const size = productInfo.sizes.find(
        (size) => size?._id?.toString() === cartProduct?.size?._id?.toString()
      );
      productPrice += size?.price || 0;
    }
    if (cartProduct.extras?.length > 0) {
      for (const cartProductExtraThing of cartProduct.extras) {
        const productExtras = productInfo.extraIngredientPrices;
        const extraThingInfo = productExtras.find(
          (extra) =>
            extra._id.toString() === cartProductExtraThing._id.toString()
        );
        productPrice += extraThingInfo.price;
      }
    }

    totalPrice += productPrice;

    const productName = cartProduct.name;

    stripeLineItems.push({
      quantity: cartProduct.quantity || 1,
      price_data: {
        currency: "PHP",
        product_data: {
          name: productName,
        },
        unit_amount: productPrice * 100,
      },
    });
  }

  const deliveryFee = 2000;
  totalPrice += deliveryFee / 100;

  const orderProducts = await Promise.all(
    cartProducts.map(async (cartProduct) => {
      const productInfo = await MenuItem.findById(cartProduct._id);
      if (!productInfo) {
        throw new Error(`Product not found: ${cartProduct._id}`);
      }

      let price = productInfo.basePrice;

      if (cartProduct.size) {
        const size = productInfo.sizes.find(
          (size) => size?._id?.toString() === cartProduct?.size?._id?.toString()
        );
        price += size?.price || 0;
      }

      if (cartProduct.extras?.length > 0) {
        for (const extraThing of cartProduct.extras) {
          const productExtras = productInfo.extraIngredientPrices;
          const extraThingInfo = productExtras.find(
            (extra) => extra._id.toString() === extraThing._id.toString()
          );
          price += extraThingInfo?.price || 0;
        }
      }

      return {
        _id: productInfo._id.toString(),
        name: productInfo.name,
        image: productInfo.image,
        basePrice: productInfo.basePrice,
        size: cartProduct.size,
        extras: cartProduct.extras,
        price: price,
        quantity: cartProduct.quantity || 1,
      };
    })
  );

  console.log("Order Products:", orderProducts);

  const orderDoc = await Order.create({
    userEmail,
    ...address,
    cartProducts: orderProducts,
    branchId,
    paid: false,
    totalPrice,
  });

  console.log("Created Order:", orderDoc);

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
