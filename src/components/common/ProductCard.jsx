import { motion } from "framer-motion";
import { FiArrowRight, FiEye, FiHeart } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useUserAuth } from "../../context/UserAuthContext";

export default function ProductCard({ product, onQuickView }) {
  const { addToCart, wishlist = [], toggleWishlist } = useCart();
  const { requireAuth } = useUserAuth();
  const isWishlisted = Array.isArray(wishlist) ? wishlist.includes(product.id) : false;
  const availStock = product?.inStock ? (Number(product.stockQuantity) || 0) : 0;
  const isOutOfStock = !product.inStock || availStock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    requireAuth(
      () => addToCart(product),
      "Please log in to add items to your cart & place orders."
    );
  };

  const handleWishlistToggle = () => {
    requireAuth(
      () => toggleWishlist(product.id),
      "Please log in to save items to your wishlist."
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="group relative bg-[#131b2e] rounded-2xl sm:rounded-3xl p-2 sm:p-3.5 border border-slate-800/80 hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-[0_15px_35px_rgba(245,184,0,0.12)]"
    >
      {/* Product Image Container */}
      <div className="relative bg-[#f8fafc] rounded-xl sm:rounded-2xl p-2 sm:p-4 h-36 sm:h-56 flex items-center justify-center overflow-hidden border border-slate-200/80 shadow-inner">
        {/* Wishlist & Quick View Overlay Buttons */}
        <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-20 flex flex-col gap-1 sm:gap-2">
          <button
            onClick={handleWishlistToggle}
            className={`p-1.5 sm:p-2 rounded-full backdrop-blur-md transition cursor-pointer ${isWishlisted
                ? "bg-red-500/20 text-red-500 border border-red-500/40"
                : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/60 shadow-sm"
              }`}
            title="Wishlist"
          >
            <FiHeart size={13} fill={isWishlisted ? "currentColor" : "none"} />
          </button>

          {onQuickView && (
            <button
              onClick={() => onQuickView(product)}
              className="p-1.5 sm:p-2 rounded-full bg-slate-900/80 text-slate-300 hover:text-[#f5b800] hover:bg-slate-800 border border-slate-700/60 shadow-sm transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
              title="Quick View"
            >
              <FiEye size={13} />
            </button>
          )}
        </div>

        {/* Badge Tag */}
        {isOutOfStock ? (
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg bg-red-600 text-white font-black text-[8px] sm:text-[9px] uppercase tracking-wider shadow-md pointer-events-none">
            OUT OF STOCK
          </span>
        ) : (
          product.badge && (
            <span className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg bg-gradient-to-r from-[#f5b800] to-amber-500 text-slate-950 font-black text-[8px] sm:text-[9px] uppercase tracking-wider shadow-md pointer-events-none max-w-[65%] truncate">
              {product.badge}
            </span>
          )
        )}

        {/* Product Image */}
        <Link to={`/supplements/${product.id}`} className="block w-full h-full flex items-center justify-center">
          <img
            src={product.image}
            alt={product.name}
            className={`max-h-28 sm:max-h-44 object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] ${isOutOfStock ? "opacity-60" : ""}`}
          />
        </Link>
      </div>

      {/* Product Title & Info */}
      <div className="p-1.5 sm:p-3 space-y-1.5 sm:space-y-2 flex-1 flex flex-col justify-between mt-1 sm:mt-0">
        <Link to={`/supplements/${product.id}`} className="block">
          <h3 className="font-heading font-extrabold text-[11px] sm:text-xs text-slate-100 line-clamp-2 leading-tight sm:leading-snug uppercase group-hover:text-[#f5b800] transition">
            {product.name}
          </h3>
        </Link>

        {/* Stock status text under name */}
        <span className={`text-[10px] font-extrabold block ${isOutOfStock ? "text-red-400" : "text-lime-400"}`}>
          {isOutOfStock ? "Out of Stock" : `${availStock} units in stock`}
        </span>

        {/* Price & Action Button */}
        <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-slate-800/80 mt-1 sm:mt-2">
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-1.5">
            <span className="font-heading font-black text-sm sm:text-base text-[#f5b800]">
              ₹{product.price}
            </span>
            {product.originalPrice && (
              <span className="text-[10px] sm:text-[11px] text-slate-500 line-through">
                ₹{product.originalPrice}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 shadow-lg transition-all ${isOutOfStock
                ? "bg-slate-700 text-slate-400 cursor-not-allowed shadow-none opacity-50"
                : "bg-gradient-to-r from-[#f5b800] to-amber-500 text-slate-950 hover:scale-110 shadow-amber-500/20 cursor-pointer"
              }`}
            title={isOutOfStock ? "Out of Stock" : "Add to Cart"}
          >
            <FiArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
