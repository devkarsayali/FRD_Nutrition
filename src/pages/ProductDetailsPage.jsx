import { useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiHeart,
  FiHelpCircle,
  FiMinus,
  FiPlay,
  FiPlus,
  FiShare2,
  FiShield,
  FiShoppingBag,
  FiStar,
  FiTruck,
} from "react-icons/fi";
import { Link, useNavigate, useParams } from "react-router-dom";
import PincodeChecker from "../components/common/PincodeChecker";
import toast from "react-hot-toast";
import ProductCard from "../components/common/ProductCard";
import { useCart } from "../context/CartContext";
import { useProducts } from "../context/ProductContext";
import { useUserAuth } from "../context/UserAuthContext";

export default function ProductDetailsPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { products } = useProducts();
  const { addToCart, wishlist = [], toggleWishlist } = useCart();
  const { requireAuth } = useUserAuth();

  const product = (products && products.find((p) => p.id === productId)) || (products && products[0]) || null;

  const [selectedFlavor, setSelectedFlavor] = useState("Standard");
  const [selectedSize, setSelectedSize] = useState("Standard");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  useEffect(() => {
    if (product) {
      if (Array.isArray(product.flavors) && product.flavors.length > 0) {
        setSelectedFlavor(String(product.flavors[0]));
      } else {
        setSelectedFlavor("Standard");
      }
      if (Array.isArray(product.sizes) && product.sizes.length > 0) {
        setSelectedSize(String(product.sizes[0]));
      } else {
        setSelectedSize("Standard");
      }
      setSelectedMediaIndex(0);
    }
  }, [product, productId]);

  if (!product) {
    return (
      <div className="py-20 text-center space-y-4 bg-[#10130f] text-white min-h-screen">
        <h2 className="text-2xl font-bold">Product Not Found</h2>
        <Link to="/supplements" className="text-lime-400 font-bold underline">
          Return to Supplements Catalog
        </Link>
      </div>
    );
  }

  // Media Gallery Setup (Photos & Videos combined)
  const imageMedia = (
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.image
      ? [product.image]
      : []
  ).map((url) => ({ type: "image", url: String(url || "") }));

  const videoMedia = (
    Array.isArray(product.videos) ? product.videos : []
  ).map((url) => ({ type: "video", url: String(url || "") }));

  const allMedia = [...imageMedia, ...videoMedia];

  const currentMedia = allMedia[selectedMediaIndex] || imageMedia[0] || {
    type: "image",
    url: String(product.image || ""),
  };

  const currentUrl = currentMedia?.url || "";
  const isVideo = currentMedia?.type === "video";
  const isYouTube = isVideo && (currentUrl.includes("youtube.com") || currentUrl.includes("youtu.be"));

  const isWishlisted = Array.isArray(wishlist) ? wishlist.includes(product.id) : false;
  const relatedProducts = Array.isArray(products)
    ? products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)
    : [];

  // Discount % calculation
  const productPrice = Number(product.price) || 0;
  const productOriginalPrice = Number(product.originalPrice) || 0;
  const discountPercent = productOriginalPrice > productPrice
    ? Math.round(((productOriginalPrice - productPrice) / productOriginalPrice) * 100)
    : 0;

  // Handle Flavor selection & automatically switch to flavor's photo
  const handleFlavorSelect = (flavorName, flavorIndex) => {
    setSelectedFlavor(String(flavorName));

    // 1. Explicit flavorImages map if defined
    if (product.flavorImages && product.flavorImages[flavorName]) {
      const targetUrl = String(product.flavorImages[flavorName]);
      const foundIdx = allMedia.findIndex((m) => m.url === targetUrl);
      if (foundIdx !== -1) {
        setSelectedMediaIndex(foundIdx);
        return;
      }
    }

    // 2. Direct index mapping: Flavor 1 -> Image 1, Flavor 2 -> Image 2
    if (Array.isArray(imageMedia) && imageMedia[flavorIndex]) {
      const targetUrl = imageMedia[flavorIndex].url;
      const foundIdx = allMedia.findIndex((m) => m.url === targetUrl);
      if (foundIdx !== -1) {
        setSelectedMediaIndex(foundIdx);
      }
    }
  };

  const handleAddToCart = () => {
    requireAuth(
      () => addToCart(product, quantity, selectedFlavor, selectedSize),
      "Please log in first to add items to your cart."
    );
  };

  const handleEnquireNow = () => {
    navigate(`/contact?product=${encodeURIComponent(product.name)}`, {
      state: { productName: product.name },
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: product.name || "FRD Nutrition Supplement",
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Product link copied to clipboard!");
    }
  };

  return (
    <div className="bg-[#10130f] text-white min-h-screen py-8">
      <div className="container-custom max-w-7xl mx-auto space-y-6 sm:space-y-10 px-3 sm:px-6">
        {/* Breadcrumb Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-neutral-400">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-neutral-400 hover:text-white transition shrink-0"
          >
            <FiArrowLeft size={14} />
            <span>Back</span>
          </button>
          <span>/</span>
          <Link to="/supplements" className="hover:text-lime-400 shrink-0">
            Supplements
          </Link>
          <span>/</span>
          <span className="text-lime-400 font-semibold truncate max-w-[150px] sm:max-w-none">
            {product.name}
          </span>
        </div>

        {/* Main Product Showcase Box */}
        <div className="bg-[#141813] rounded-2xl sm:rounded-3xl border border-neutral-800 p-4 sm:p-8 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-start">
            
            {/* LEFT COLUMN: Media Gallery (Main Viewport + Thumbnails) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-[#191e19] rounded-2xl border border-neutral-800 p-3 sm:p-6 relative flex items-center justify-center min-h-[280px] sm:min-h-[460px] overflow-hidden group">
                {/* Share Button Overlay */}
                <button
                  onClick={handleShare}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 sm:p-2.5 rounded-full bg-neutral-900/80 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-700/60 transition z-10"
                  title="Share Product"
                >
                  <FiShare2 size={16} />
                </button>

                {/* Badge Tag */}
                {product.badge && (
                  <span className="absolute top-3 left-3 sm:top-4 sm:left-4 px-2.5 py-1 rounded-md bg-lime-500 text-neutral-950 font-black text-[10px] sm:text-[11px] uppercase tracking-wider z-10">
                    {product.badge}
                  </span>
                )}

                {/* Active Main Display (Image or Video) */}
                {isVideo ? (
                  <div className="w-full h-full flex items-center justify-center">
                    {isYouTube ? (
                      <iframe
                        src={currentUrl.replace("watch?v=", "embed/")}
                        title="Product Video"
                        className="w-full aspect-video rounded-xl"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={currentUrl}
                        controls
                        autoPlay
                        loop
                        className="w-full max-h-[320px] sm:max-h-[420px] rounded-xl object-contain"
                      />
                    )}
                  </div>
                ) : (
                  <img
                    src={currentUrl}
                    alt={product.name || "Supplement"}
                    className="w-full max-h-[300px] sm:max-h-[420px] object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:scale-105"
                  />
                )}
              </div>

              {/* Photos & Videos Thumbnails Row */}
              {allMedia.length > 1 && (
                <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {allMedia.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedMediaIndex(idx)}
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition shrink-0 bg-[#191e19] p-1 ${
                        selectedMediaIndex === idx
                          ? "border-lime-500 ring-2 ring-lime-500/30"
                          : "border-neutral-800 hover:border-neutral-700 opacity-70 hover:opacity-100"
                      }`}
                    >
                      {item.type === "video" ? (
                        <div className="w-full h-full bg-neutral-900 flex flex-col items-center justify-center text-lime-400">
                          <FiPlay size={20} fill="currentColor" />
                          <span className="text-[9px] font-bold mt-0.5 uppercase text-white">Video</span>
                        </div>
                      ) : (
                        <img
                          src={item.url}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Product Title, Rating, Price, Options & Stock */}
            <div className="lg:col-span-6 space-y-6">
              {/* Header Title & Ratings */}
              <div className="space-y-3 border-b border-neutral-800/80 pb-5">
                <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white uppercase tracking-tight leading-tight">
                  {product.name}
                </h1>

                {/* Rating & Reviews */}
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <div className="flex items-center text-amber-400 gap-1">
                    {[...Array(5)].map((_, i) => (
                      <FiStar
                        key={i}
                        size={14}
                        fill={i < Math.floor(Number(product.rating) || 5) ? "currentColor" : "none"}
                      />
                    ))}
                    <span className="font-bold text-white ml-1">
                      {Number(product.rating || 5.0).toFixed(1)}
                    </span>
                  </div>
                  <span>({product.reviewsCount || 0})</span>
                </div>

                {/* Category & Subcategory line */}
                <div className="flex items-center gap-4 text-xs font-semibold pt-1">
                  <div>
                    <span className="text-neutral-400">Category: </span>
                    <span className="text-lime-400 hover:underline font-bold">{product.category || "Supplements"}</span>
                  </div>
                  <span className="text-neutral-600">|</span>
                  <div>
                    <span className="text-neutral-400">Subcategory: </span>
                    <span className="text-lime-400 font-bold">
                      {product.subcategory || "Popular"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price & Savings Pill Section */}
              <div className="flex items-center gap-4 py-2 border-b border-neutral-800/80">
                <span className="font-heading font-black text-3xl sm:text-4xl text-lime-400">
                  ₹{productPrice * quantity}
                </span>

                {productOriginalPrice > 0 && (
                  <span className="text-xl text-neutral-400 line-through">
                    ₹{productOriginalPrice * quantity}
                  </span>
                )}

                {discountPercent > 0 && (
                  <span className="px-3 py-1.5 rounded-md bg-[#ef4444] text-white text-xs font-black uppercase tracking-wide shadow-md shadow-red-500/20">
                    SAVE {discountPercent}%
                  </span>
                )}
              </div>

              {/* Flavor Selector (Clicking a flavor button updates selected flavor & displays corresponding flavor photo!) */}
              {Array.isArray(product.flavors) && product.flavors.length > 0 && (
                <div className="space-y-2.5">
                  <label className="block text-xs font-extrabold text-neutral-300 uppercase tracking-wider">
                    {String(selectedFlavor || "CHOCOLATE").toUpperCase()} :
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {product.flavors.map((flavor, fIdx) => (
                      <button
                        key={fIdx}
                        onClick={() => handleFlavorSelect(flavor, fIdx)}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase transition ${
                          selectedFlavor === String(flavor)
                            ? "bg-lime-500 text-neutral-950 font-black shadow-lg shadow-lime-500/20"
                            : "bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-neutral-700"
                        }`}
                      >
                        {String(flavor)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Package Sizes Selector */}
              {Array.isArray(product.sizes) && product.sizes.length > 0 && (
                <div className="space-y-2.5">
                  <label className="block text-xs font-extrabold text-neutral-300 uppercase tracking-wider">
                    Package Size:
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {product.sizes.map((size, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => setSelectedSize(String(size))}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                          selectedSize === String(size)
                            ? "border-lime-500 bg-lime-500/10 text-lime-400"
                            : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700"
                        }`}
                      >
                        {String(size)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Status Indicator */}
              {(() => {
                const rawStock = String(product.stockQuantity ?? "").trim();
                const lowerStock = rawStock.toLowerCase();
                const isNotAvailable =
                  !product.inStock ||
                  lowerStock === "0" ||
                  lowerStock === "not available" ||
                  lowerStock === "out of stock" ||
                  lowerStock === "notavailable" ||
                  lowerStock === "sold out";

                let displayStockText = rawStock;
                if (!product.inStock) {
                  displayStockText = "0 in stock";
                } else if (!displayStockText) {
                  displayStockText = isNotAvailable ? "Not Available" : "Available";
                } else if (/^\d+$/.test(displayStockText)) {
                  displayStockText = Number(displayStockText) > 0 ? `${displayStockText} in stock` : "0 in stock";
                }

                return (
                  <div className={`font-extrabold text-sm flex items-center gap-2 pt-1 ${isNotAvailable ? "text-red-400" : "text-lime-400"}`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${isNotAvailable ? "bg-red-500" : "bg-lime-500 animate-pulse"}`} />
                    <span>{displayStockText}</span>
                  </div>
                );
              })()}

              {/* Quantity Counter & ADD TO CART Button */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <div className="flex items-center justify-between border border-neutral-800 rounded-xl bg-neutral-900 px-4 py-3 shrink-0 sm:w-36">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="text-neutral-400 hover:text-white"
                  >
                    <FiMinus size={16} />
                  </button>
                  <span className="font-bold text-white text-base">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="text-neutral-400 hover:text-white"
                  >
                    <FiPlus size={16} />
                  </button>
                </div>

                {(() => {
                  const rawStock = String(product.stockQuantity ?? "").trim().toLowerCase();
                  const isOut =
                    !product.inStock ||
                    rawStock === "0" ||
                    rawStock === "not available" ||
                    rawStock === "out of stock" ||
                    rawStock === "notavailable" ||
                    rawStock === "sold out";

                  return (
                    <button
                      onClick={handleAddToCart}
                      disabled={isOut}
                      className={`flex-1 py-4 px-8 rounded-xl font-extrabold uppercase text-sm tracking-wider transition shadow-xl flex items-center justify-center gap-2 active:scale-98 ${
                        isOut
                          ? "bg-neutral-800 text-neutral-500 cursor-not-allowed shadow-none"
                          : "bg-lime-500 hover:bg-lime-400 text-neutral-950 shadow-lime-500/20"
                      }`}
                    >
                      <FiShoppingBag size={18} />
                      <span>{isOut ? "NOT AVAILABLE" : "ADD TO CART"}</span>
                    </button>
                  );
                })()}

                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`p-4 rounded-xl border transition ${
                    isWishlisted
                      ? "border-red-500/40 bg-red-500/10 text-red-400"
                      : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white"
                  }`}
                  title="Wishlist"
                >
                  <FiHeart size={20} fill={isWishlisted ? "currentColor" : "none"} />
                </button>
              </div>

              {/* Product Enquiry Button */}
              <button
                type="button"
                onClick={handleEnquireNow}
                className="w-full py-3.5 px-6 rounded-xl font-extrabold uppercase text-xs tracking-wider transition bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 hover:from-amber-500/30 hover:to-amber-500/30 text-[#f5b800] border border-amber-500/40 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 active:scale-[0.99] cursor-pointer"
              >
                <FiHelpCircle size={17} className="shrink-0" />
                <span className="truncate">Enquire Now for {product.name}</span>
              </button>

              {/* Dispatch & Security Highlights */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-800/80 text-xs">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/60">
                  <FiTruck className="text-lime-400 shrink-0" size={20} />
                  <div>
                    <span className="font-bold text-white block">Express Dispatch</span>
                    <span className="text-[11px] text-neutral-400">Delivery in 24-48 Hours</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/60">
                  <FiShield className="text-lime-400 shrink-0" size={20} />
                  <div>
                    <span className="font-bold text-white block">100% Authentic</span>
                    <span className="text-[11px] text-neutral-400">Direct Importer Seal</span>
                  </div>
                </div>
              </div>

              {/* Delivery Pincode Serviceability Checker Widget */}
              <div className="pt-2">
                <PincodeChecker />
              </div>

            </div>
          </div>
        </div>

        {/* Large Product Info Tabs ("Large Info" Section) */}
        <div className="bg-[#141813] rounded-3xl border border-neutral-800 p-6 sm:p-8 space-y-6 shadow-xl">
          {/* Tab Selection Navigation Bar */}
          <div className="flex items-center gap-4 sm:gap-8 border-b border-neutral-800 overflow-x-auto pb-3 scrollbar-thin">
            {[
              { id: "overview", label: "Product Description" },
              { id: "authenticity", label: "100% Authenticity Check" },
              { id: "reviews", label: "Verified Reviews" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`font-bold text-xs sm:text-sm whitespace-nowrap transition py-2 relative ${
                  activeTab === tab.id
                    ? "text-lime-400"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-lime-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* TAB 1: Product Description */}
          {activeTab === "overview" && (
            <div className="space-y-4 text-neutral-300 leading-relaxed text-sm max-w-4xl">
              <h3 className="font-heading font-extrabold text-lg text-white">
                Detailed Product Overview
              </h3>
              <p>{product.description || "High quality sports supplement formulated for optimal performance and muscle recovery."}</p>
              {product.subtitle && (
                <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-xs text-neutral-300 space-y-1">
                  <span className="font-bold text-lime-400 block uppercase">Formula Highlight:</span>
                  <p>{product.subtitle}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: 100% Authenticity Guarantee */}
          {activeTab === "authenticity" && (
            <div className="space-y-4 max-w-3xl">
              <h3 className="font-heading font-extrabold text-lg text-white">
                100% Direct Importer & Authenticity Seal Guarantee
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-neutral-300">
                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1.5">
                  <span className="font-bold text-lime-400 block">Direct Importer Sourced</span>
                  <p>All supplements are imported directly from authorized brand distributors with genuine hologram scratch codes.</p>
                </div>
                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1.5">
                  <span className="font-bold text-lime-400 block">Scan Scratch Code</span>
                  <p>Verify your product authenticity instant SMS/QR code on the official manufacturer website.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Verified Reviews */}
          {activeTab === "reviews" && (
            <div className="space-y-4 max-w-3xl text-xs text-neutral-300">
              <h3 className="font-heading font-extrabold text-lg text-white">
                Verified Customer Reviews & Feedback
              </h3>
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-2xl font-black text-white">{Number(product.rating || 4.9).toFixed(1)} / 5.0</span>
                  <span className="block text-[11px] text-neutral-400">Based on {product.reviewsCount || 180}+ verified buyer orders</span>
                </div>
                <button
                  onClick={() => toast.success("Review form submitted!")}
                  className="px-4 py-2 rounded-xl bg-lime-500 text-neutral-950 font-bold hover:bg-lime-400 transition"
                >
                  Write a Review
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Related Products Carousel / Grid */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6 pt-4">
            <h2 className="font-heading text-2xl font-extrabold text-white">
              Related Supplements You Might Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}