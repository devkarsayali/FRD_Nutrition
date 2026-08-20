import { useEffect, useState } from "react";
import { FiCheck, FiHelpCircle, FiShoppingBag, FiStar, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useUserAuth } from "../../context/UserAuthContext";
import { getNormalizedList } from "../../context/ProductContext";

export default function QuickViewModal({ product, onClose }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { requireAuth } = useUserAuth();

  const flavorsList = getNormalizedList(product?.flavors);
  const sizesList = getNormalizedList(product?.sizes);

  const [selectedFlavor, setSelectedFlavor] = useState(
    flavorsList.length > 0 ? flavorsList[0] : "Standard"
  );
  const [selectedSize, setSelectedSize] = useState(
    sizesList.length > 0 ? sizesList[0] : "Standard"
  );
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) {
      const fls = getNormalizedList(product.flavors);
      const szs = getNormalizedList(product.sizes);
      setSelectedFlavor(fls.length > 0 ? fls[0] : "Standard");
      setSelectedSize(szs.length > 0 ? szs[0] : "Standard");
      document.documentElement.classList.add("no-scroll");
      document.body.classList.add("no-scroll");
      document.getElementById("root")?.classList.add("no-scroll");
    } else {
      document.documentElement.classList.remove("no-scroll");
      document.body.classList.remove("no-scroll");
      document.getElementById("root")?.classList.remove("no-scroll");
    }
    return () => {
      document.documentElement.classList.remove("no-scroll");
      document.body.classList.remove("no-scroll");
      document.getElementById("root")?.classList.remove("no-scroll");
    };
  }, [product]);

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

  const handleEnquireNow = () => {
    onClose();
    navigate(`/contact?product=${encodeURIComponent(product.name)}`, {
      state: { productName: product.name },
    });
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
            {flavorsList.length > 0 && (
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Flavor: <span className="text-white font-bold">{selectedFlavor}</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {flavorsList.map((flavor) => (
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
            {sizesList.length > 0 && (
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Size: <span className="text-white font-bold">{selectedSize}</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {sizesList.map((size) => (
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

          {/* Pricing & Actions */}
          <div className="pt-4 border-t border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
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

              {(() => {
                const availStock = product?.inStock ? (Number(product.stockQuantity) || 0) : 0;
                const isOut = !product?.inStock || availStock <= 0;
                return (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${isOut ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-lime-500/20 text-lime-400 border border-lime-500/40"}`}>
                    {isOut ? "Out of Stock" : `${availStock} In Stock`}
                  </span>
                );
              })()}
            </div>

            <div className="space-y-2">
              {(() => {
                const availStock = product?.inStock ? (Number(product.stockQuantity) || 0) : 0;
                const isOut = !product?.inStock || availStock <= 0;
                return (
                  <button
                    onClick={handleAdd}
                    disabled={isOut}
                    className={`w-full py-3.5 px-4 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                      isOut
                        ? "bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed"
                        : "bg-lime-500 text-neutral-950 hover:bg-lime-400 shadow-lg shadow-lime-500/20 cursor-pointer"
                    }`}
                  >
                    <FiShoppingBag size={18} />
                    <span>{isOut ? "OUT OF STOCK" : "Add to Shopping Cart"}</span>
                  </button>
                );
              })()}

              <button
                type="button"
                onClick={handleEnquireNow}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-[#f5b800] border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer uppercase tracking-wider"
              >
                <FiHelpCircle size={15} />
                <span>Enquire Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
