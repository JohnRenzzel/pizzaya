import mongoose, { model, models, Schema } from "mongoose";

const ExtraPriceSchema = new Schema({
  name: String,
  price: Number,
});
const MenuItemSchema = new Schema(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    image: { type: String },
    name: { type: String },
    description: { type: String },
    category: { type: mongoose.Types.ObjectId },
    basePrice: { type: Number, required: true },
    sizes: { type: [ExtraPriceSchema] },
    extraIngredientPrices: { type: [ExtraPriceSchema] },
    isAvailable: { type: Boolean, default: true },
    discount: { type: Number, default: 0 },
    discountedPrice: { type: Number },
  },
  { timestamps: true }
);

// Add a pre-save middleware to always calculate discounted price
MenuItemSchema.pre("save", function (next) {
  if (this.basePrice && this.discount) {
    this.discountedPrice = this.basePrice * (1 - this.discount / 100);
  } else {
    this.discountedPrice = this.basePrice;
  }
  next();
});

export const MenuItem = models?.MenuItem || model("MenuItem", MenuItemSchema);
