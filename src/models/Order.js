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
    countdown: {
      currentTime: { type: Number, default: null },
      lastUpdated: { type: Date },
      totalDuration: { type: Number },
    },
  },
  { timestamps: true }
);

OrderSchema.methods.getRemainingTime = function () {
  if (!this.countdown?.currentTime || this.status === "Completed") {
    return 0;
  }

  const lastUpdate = new Date(
    this.countdown.lastUpdated || this.updatedAt || this.createdAt
  );
  const now = new Date();
  const elapsedSeconds = Math.floor((now - lastUpdate) / 1000);

  // Calculate remaining time based on the last stored time minus elapsed time
  const remainingTime = Math.max(
    0,
    this.countdown.currentTime - elapsedSeconds
  );

  // Update the stored values
  this.countdown.currentTime = remainingTime;
  this.countdown.lastUpdated = now;

  return remainingTime;
};

OrderSchema.methods.initializeCountdown = function (totalSeconds) {
  this.countdown = {
    currentTime: totalSeconds,
    lastUpdated: new Date(),
    totalDuration: totalSeconds,
  };
};

OrderSchema.methods.toJSON = function () {
  const obj = this.toObject();
  if (obj.countdown) {
    obj.remainingTime = this.getRemainingTime();
  }
  return obj;
};

export const Order = models?.Order || model("Order", OrderSchema);
