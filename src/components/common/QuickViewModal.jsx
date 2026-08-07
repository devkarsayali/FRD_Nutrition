import { useState } from "react";
import { FiCheck, FiShoppingBag, FiStar, FiX } from "react-icons/fi";
import { useCart } from "../../context/CartContext";
import { useUserAuth } from "../../context/UserAuthContext";

export default function QuickViewModal({ product, onClose }) {
  const { addToCart } = useCart();
  const { requireAuth } = useUserAuth();
  const [selectedFlavor, setSelectedFlavor] = useState(
    product?.flavors ? product.flavors[0] : "Standard"
  );
  const [selectedSize, setSelectedSize] = useState(
    product?.sizes ? product.sizes[0] : "Standard"
  );
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const handleAdd = () => {
    requireAuth(
      () => {
        addToCart(product, quantity, selectedFlavor, selectedSize);
        onClose();
      },
      "Please log in first to add items to your cart."
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl bg-[#141813] text-white rounded-3xl border border-neutral-800 shadow-2xl overflow-hidden z-10 grid grid-cols-1 md:grid-cols-2">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-neutral-900/80 text-neutral-400 hover:text-white hover:bg-neutral-800"
        >
          <FiX size={20} />
        </button>

        {/* Product Image preview */}
        <div className="p-8 bg-neutral-900/60 flex items-center justify-center border-r border-neutral-800">
          <img
            src={product.image}
            alt={product.name}
            className="max-h-72 object-contain drop-shadow-2xl"
          />
        </div>

        {/* Product Information */}
        <div className="p-8 space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-lime-500/10 text-lime-400 border border-lime-500/30 text-[10px] font-extrabold uppercase">
                {product.category}
              </span>
              <div className="flex items-center text-amber-400 text-xs gap-1 font-bold">
                <FiStar size={13} fill="currentColor" />
                <span>{product.rating || 4.9}</span>
              </div>
            </div>

            <h3 className="font-heading font-extrabold text-xl text-white">
              {product.name}
            </h3>

            <p className="text-xs text-neutral-400 leading-relaxed">
              {product.description}
            </p>

            {/* Flavor Picker */}
            {product.flavors && product.flavors.length > 0 && (
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Flavor: <span className="text-white font-bold">{selectedFlavor}</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {product.flavors.map((flavor) => (
                    <button
                      key={flavor}
                      onClick={() => setSelectedFlavor(flavor)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        selectedFlavor === flavor
                          ? "border-lime-500 bg-lime-500/10 text-lime-400"
                          : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700"
                      }`}
                    >
                      {flavor}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Picker */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Size: <span className="text-white font-bold">{selectedSize}</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        selectedSize === size
                          ? "border-lime-500 bg-lime-500/10 text-lime-400"
                          : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pricing & Add to Cart */}
          <div className="pt-4 border-t border-neutral-800 space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="font-heading font-black text-2xl text-white">
                ₹{product.price}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-neutral-500 line-through">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>

            <button
              onClick={handleAdd}
              disabled={!product.inStock}
              className="w-full py-3.5 px-4 rounded-xl bg-lime-500 text-neutral-950 font-bold hover:bg-lime-400 transition shadow-lg shadow-lime-500/20 flex items-center justify-center gap-2"
            >
              <FiShoppingBag size={18} />
              <span>Add to Shopping Cart</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
