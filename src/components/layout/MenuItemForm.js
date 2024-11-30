import EditableImage from "@/components/layout/EditableImage";
import MenuItemPriceProps from "@/components/layout/MenuItemPriceProps";
import DeleteButton from "@/components/DeleteButton";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import DiscountSelector from "@/components/layout/DiscountSelector";

export default function MenuItemForm({ onSubmit, menuItem, onDelete }) {
  const [image, setImage] = useState(menuItem?.image || "");
  const [name, setName] = useState(menuItem?.name || "");
  const [description, setDescription] = useState(menuItem?.description || "");
  const [basePrice, setBasePrice] = useState(menuItem?.basePrice || "");
  const [sizes, setSizes] = useState(menuItem?.sizes || []);
  const [category, setCategory] = useState(menuItem?.category || "");
  const [categories, setCategories] = useState([]);
  const [extraIngredientPrices, setExtraIngredientPrices] = useState(
    menuItem?.extraIngredientPrices || []
  );
  const [isAvailable, setIsAvailable] = useState(
    menuItem?.isAvailable === undefined ? true : Boolean(menuItem.isAvailable)
  );
  const [discount, setDiscount] = useState(menuItem?.discount || 0);

  useEffect(() => {
    fetch("/api/categories").then((res) => {
      res.json().then((categories) => {
        setCategories(categories);
      });
    });
  }, []);

  const handleSubmit = (ev) => {
    if (!image) {
      ev.preventDefault();
      toast.error("Please add an image");
      return;
    }

    onSubmit(ev, {
      image,
      name,
      description,
      basePrice,
      sizes,
      extraIngredientPrices,
      category,
      isAvailable,
      discount,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-2xl mx-auto">
      <div
        className="md:grid items-start gap-4"
        style={{ gridTemplateColumns: ".3fr .7fr" }}
      >
        <div>
          <EditableImage link={image} setLink={setImage} />
        </div>
        <div className="grow">
          <label>Item name</label>
          <input
            type="text"
            value={name}
            onChange={(ev) => setName(ev.target.value)}
          />
          <label>Description</label>
          <input
            type="text"
            value={description}
            onChange={(ev) => setDescription(ev.target.value)}
          />
          <label>Category</label>
          <select
            value={category}
            onChange={(ev) => setCategory(ev.target.value)}
            required
          >
            <option value="">Choose a category</option>
            {categories?.length > 0 &&
              categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
          </select>
          <label>Base price</label>
          <input
            type="text"
            value={basePrice}
            onChange={(ev) => setBasePrice(ev.target.value)}
          />
          <MenuItemPriceProps
            name={"Sizes"}
            addLabel={"Add item size"}
            props={sizes}
            setProps={setSizes}
          />
          <MenuItemPriceProps
            name={"Extra ingredients"}
            addLabel={"Add ingredients prices"}
            props={extraIngredientPrices}
            setProps={setExtraIngredientPrices}
          />
          <div>
            <label className="mb-2 text-sm text-gray-500">Availability</label>
            <select
              value={isAvailable.toString()}
              onChange={(ev) => setIsAvailable(ev.target.value === "true")}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="true">Available</option>
              <option value="false">Not Available</option>
            </select>
          </div>
          <div className="grow">
            <DiscountSelector
              currentDiscount={discount}
              onDiscountChange={setDiscount}
              canManageDiscount={true}
              formMode={true}
            />
          </div>

          <button type="submit">Save</button>
          {menuItem && onDelete && (
            <div className="mt-2">
              <DeleteButton label="Delete" onDelete={onDelete} />
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
