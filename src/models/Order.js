import { model, models, Schema } from "mongoose";

const OrderSchema = new Schema(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    userEmail: String,
    phone: String,
    streetAddress: String,
    postalCode: String,
    city: String,
    province: String,
    cartProducts: Object,
    paid: { type: Boolean, default: false },
    status: { type: String, default: "Pending" },
    totalPrice: { type: Number, default: 0 },
    progressBar: {
      currentProgress: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now },
    },
    estimatedDeliveryTime: {
      type: Number,
      default: null,
    },
    deliveryDistance: {
      type: String,
      default: "",
    },
    totalDeliveryTime: { type: Number },
    preparationTime: { type: Number },
    deliveringTime: { type: Number },
    pendingTime: { type: Number },
    processingTime: { type: Number },
  },

  { timestamps: true }
);

export const Order = models?.Order || model("Order", OrderSchema);
