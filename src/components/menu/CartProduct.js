import { cartProductPrice } from "@/components/AppContext";
import Trash from "@/components/icons/Trash";
import Image from "next/image";

export default function CartProduct({
  product,
  onRemove,
  onQuantityChange,
  index,
  readOnly = false,
}) {
  const totalPrice = cartProductPrice(product);
  const unitPrice = cartProductPrice({ ...product, quantity: 1 });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-2 border-b py-2">
      <div className="relative w-full max-w-[200px] aspect-square sm:w-24 sm:h-24 flex-shrink-0">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 200px, 96px"
          className="object-contain rounded-lg"
          quality={85}
        />
      </div>
      <div className="flex-grow flex flex-col gap-2 w-full">
        <div className="text-center sm:text-left flex justify-between">
          <h3 className="font-semibold text-lg sm:text-md">{product.name}</h3>
          {product.size && (
            <div className="text-sm text-gray-500 px-2">
              Size: <span>{product.size.name}</span>
            </div>
          )}
          {product.extras?.length > 0 && (
            <div className="text-sm text-gray-500">
              {product.extras.map((extra) => (
                <div key={extra._id}>{extra.name}</div>
              ))}
            </div>
          )}
          <div className="text-lg font-semibold mx-4">
            ₱{totalPrice?.toFixed(2)}
          </div>
        </div>

        {/* <div className="flex justify-between items-center w-full"></div> */}

        <div className="flex items-center justify-between sm:justify-start gap-2 border-t pt-2">
          <span className="text-gray-500">Quantity:</span>
          {readOnly ? (
            <span className="font-medium">{product.quantity || 1}</span>
          ) : (
            <div className="flex items-center gap-2 flex-grow justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onQuantityChange((product.quantity || 1) - 1)}
                  className="border rounded-full w-8 h-8 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                >
                  -
                </button>

                <span className="w-6 text-center font-medium">
                  {product.quantity || 1}
                </span>
                <button
                  onClick={() => onQuantityChange((product.quantity || 1) + 1)}
                  className="border rounded-full w-8 h-8 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                >
                  +
                </button>
              </div>
              {!!onRemove && (
                <button
                  className="text-primary border border-gray-300 bg-transparent hover:bg-red-100 hover:border-red-300 rounded-full p-2 transition-colors duration-300 ease-in-out"
                  onClick={() => onRemove(index)}
                  title="Remove from cart"
                >
                  <Trash className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}
            </div>
          )}
        </div>

        {(product.quantity || 1) > 1 && (
          <div className="text-sm text-gray-500">
            Unit price: ₱{unitPrice.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
}
