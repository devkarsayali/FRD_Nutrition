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
  FiZap,
} from "react-icons/fi";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import ProductCard from "../components/common/ProductCard";
import { useCart } from "../context/CartContext";
import { useProducts, getNormalizedList } from "../context/ProductContext";
import { useUserAuth } from "../context/UserAuthContext";

export default function ProductDetailsPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { products } = useProducts();
  const { addToCart, wishlist = [], toggleWishlist, setIsCheckoutOpen } = useCart();
  const { user, requireAuth } = useUserAuth();

  const product = (products && products.find((p) => p.id === productId)) || (products && products[0]) || null;

  const availableStock = product?.inStock ? (Number(product.stockQuantity) || 0) : 0;
  const isOutOfStock = availableStock <= 0;

  const flavorsList = getNormalizedList(product?.flavors);
  const sizesList = getNormalizedList(product?.sizes);

  const [selectedFlavor, setSelectedFlavor] = useState(
    flavorsList.length > 0 ? flavorsList[0] : "Standard"
  );
  const [selectedSize, setSelectedSize] = useState(
    sizesList.length > 0 ? sizesList[0] : "Standard"
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  useEffect(() => {
    if (flavorsList.length > 0) {
      if (!selectedFlavor || selectedFlavor === "Standard" || !flavorsList.includes(selectedFlavor)) {
        setSelectedFlavor(flavorsList[0]);
      }
    } else {
      setSelectedFlavor("Standard");
    }

    if (sizesList.length > 0) {
      if (!selectedSize || selectedSize === "Standard" || !sizesList.includes(selectedSize)) {
        setSelectedSize(sizesList[0]);
      }
    } else {
      setSelectedSize("Standard");
    }
  }, [product?.id, product?.flavors, product?.sizes]);

  // Dynamic Product Reviews State & Persistence
  const DEFAULT_SAMPLE_REVIEWS = [
    {
      id: "rev-sample-1",
      name: "Rahul Sharma",
      rating: 5,
      date: "12 Aug 2026",
      title: "100% Authentic & Insane Results!",
      comment: "Tastes amazing and mixes effortlessly with cold water. Noticed great recovery and strength gains within 2 weeks. Highly recommended!",
      verified: true,
    },
    {
      id: "rev-sample-2",
      name: "Vikas Patel",
      rating: 5,
      date: "05 Aug 2026",
      title: "Fast Delivery & Top Notch Quality",
      comment: "Received the package within 2 days with direct importer seal intact. Authentic product from FRD Nutrition!",
      verified: true,
    },
  ];

  const loadProductReviews = () => {
    if (!productId) return DEFAULT_SAMPLE_REVIEWS;
    try {
      const saved = localStorage.getItem(`frd_product_reviews_${productId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { }
    return DEFAULT_SAMPLE_REVIEWS;
  };

  const [reviewsList, setReviewsList] = useState(loadProductReviews);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    name: "",
    title: "",
    comment: "",
  });

  useEffect(() => {
    setReviewsList(loadProductReviews());
    setIsReviewFormOpen(false);
  }, [productId]);

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) {
      toast.error("Please enter your review comment.");
      return;
    }

    requireAuth(() => {
      const newEntry = {
        id: `rev-${Date.now()}`,
        name: reviewForm.name.trim() || user?.name || "Verified Athlete",
        rating: Number(reviewForm.rating || 5),
        date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        title: reviewForm.title.trim() || "Great Supplement!",
        comment: reviewForm.comment.trim(),
        verified: true,
      };

      const updated = [newEntry, ...reviewsList];
      setReviewsList(updated);
      try {
        localStorage.setItem(`frd_product_reviews_${productId}`, JSON.stringify(updated));
      } catch (err) { }

      setIsReviewFormOpen(false);
      setReviewForm({ rating: 5, name: "", title: "", comment: "" });
      toast.success("Thank you! Your review has been published.");
    }, "Please log in first to submit a product review.");
  };

  const avgRating = (
    reviewsList.reduce((sum, r) => sum + Number(r.rating || 5), 0) / (reviewsList.length || 1)
  ).toFixed(1);

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
    if (isOutOfStock) {
      toast.error(`"${product.name}" is currently out of stock.`);
      return;
    }
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
        .catch(() => { });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Product link copied to clipboard!");
    }
  };

  return (
    <div className="bg-[#10130f] text-white min-h-screen py-8">
      <div className="container-custom max-w-7xl mx-auto space-y-4 sm:space-y-8 px-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-neutral-400">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-neutral-400 hover:text-white transition shrink-0"
          >
            <FiArrowLeft size={13} />
            <span>Back</span>
          </button>
          <span>/</span>
          <Link to="/supplements" className="hover:text-lime-400 shrink-0">
            Supplements
          </Link>
          <span>/</span>
          <span className="text-lime-400 font-semibold truncate max-w-[140px] sm:max-w-none">
            {product.name}
          </span>
        </div>

        <div className="bg-[#141813] rounded-2xl sm:rounded-3xl border border-neutral-800 p-3.5 sm:p-8 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 lg:gap-12 items-start">

            <div className="lg:col-span-6 space-y-3 sm:space-y-4">
              <div className="bg-[#191e19] rounded-xl sm:rounded-2xl border border-neutral-800 p-2.5 sm:p-6 relative flex items-center justify-center min-h-[200px] sm:min-h-[440px] overflow-hidden group">
                <button
                  onClick={handleShare}
                  className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 p-2 sm:p-2.5 rounded-full bg-neutral-900/80 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-700/60 transition z-10"
                  title="Share Product"
                >
                  <FiShare2 size={15} />
                </button>

                {product.badge && (
                  <span className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 px-2 py-0.5 sm:px-3 sm:py-1 rounded-md bg-lime-500 text-neutral-950 font-black text-[10px] sm:text-[11px] uppercase tracking-wider z-10">
                    {product.badge}
                  </span>
                )}

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
                        className="w-full max-h-[220px] sm:max-h-[420px] rounded-xl object-contain"
                      />
                    )}
                  </div>
                ) : (
                  <img
                    src={currentUrl}
                    alt={product.name || "Supplement"}
                    className="w-full max-h-[210px] sm:max-h-[420px] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:scale-105"
                  />
                )}
              </div>

              {allMedia.length > 1 && (
                <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-thin">
                  {allMedia.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedMediaIndex(idx)}
                      className={`relative w-14 h-14 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden border-2 transition shrink-0 bg-[#191e19] p-1 ${selectedMediaIndex === idx
                          ? "border-lime-500 ring-2 ring-lime-500/30"
                          : "border-neutral-800 hover:border-neutral-700 opacity-70 hover:opacity-100"
                        }`}
                    >
                      {item.type === "video" ? (
                        <div className="w-full h-full bg-neutral-900 flex flex-col items-center justify-center text-lime-400">
                          <FiPlay size={16} fill="currentColor" />
                          <span className="text-[8px] font-bold mt-0.5 uppercase text-white">Video</span>
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

            <div className="lg:col-span-6 space-y-4 sm:space-y-6">
              <div className="space-y-2 border-b border-neutral-800/80 pb-3 sm:pb-5">
                <h1 className="font-heading text-lg sm:text-2xl lg:text-3xl font-extrabold text-white uppercase tracking-tight leading-snug">
                  {product.name}
                </h1>

                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <div className="flex items-center text-amber-400 gap-0.5 sm:gap-1">
                    {[...Array(5)].map((_, i) => (
                      <FiStar
                        key={i}
                        size={13}
                        fill={i < Math.floor(Number(product.rating) || 5) ? "currentColor" : "none"}
                      />
                    ))}
                    <span className="font-bold text-white ml-1">
                      {Number(product.rating || 5.0).toFixed(1)}
                    </span>
                  </div>
                  <span>({product.reviewsCount || 0})</span>
                </div>

                <div className="flex items-center gap-3 text-[11px] sm:text-xs font-semibold pt-0.5">
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

              <div className="flex items-center gap-3 py-1.5 border-b border-neutral-800/80">
                <span className="font-heading font-black text-2xl sm:text-4xl text-lime-400">
                  ₹{productPrice * quantity}
                </span>

                {productOriginalPrice > 0 && (
                  <span className="text-base sm:text-xl text-neutral-400 line-through">
                    ₹{productOriginalPrice * quantity}
                  </span>
                )}

                {discountPercent > 0 && (
                  <span className="px-2.5 py-1 rounded bg-[#ef4444] text-white text-[10px] sm:text-xs font-black uppercase tracking-wide shadow-md shadow-red-500/20">
                    SAVE {discountPercent}%
                  </span>
                )}
              </div>

              {flavorsList.length > 0 && (
                <div className="space-y-1.5 sm:space-y-2.5">
                  <label className="block text-[11px] sm:text-xs font-extrabold text-neutral-300 uppercase tracking-wider">
                    Flavor: <span className="text-lime-400 font-bold">{String(selectedFlavor || "").toUpperCase()}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {flavorsList.map((flavor, fIdx) => (
                      <button
                        key={fIdx}
                        onClick={() => handleFlavorSelect(flavor, fIdx)}
                        className={`px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold uppercase transition ${selectedFlavor === String(flavor)
                            ? "bg-lime-500 text-neutral-950 font-black shadow-md shadow-lime-500/20"
                            : "bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-neutral-700"
                          }`}
                      >
                        {String(flavor)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {sizesList.length > 0 && (
                <div className="space-y-1.5 sm:space-y-2.5">
                  <label className="block text-[11px] sm:text-xs font-extrabold text-neutral-300 uppercase tracking-wider">
                    Package Size: <span className="text-lime-400 font-bold">{String(selectedSize || "").toUpperCase()}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {sizesList.map((size, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => setSelectedSize(String(size))}
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold border transition ${selectedSize === String(size)
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

              <div className={`font-extrabold text-xs sm:text-sm flex items-center gap-2 pt-0.5 ${isOutOfStock ? "text-red-400" : "text-lime-400"}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${isOutOfStock ? "bg-red-500" : "bg-lime-500 animate-pulse"}`} />
                <span>{isOutOfStock ? "Out of Stock (0 units left)" : `${availableStock} Units Available in Stock`}</span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-1">
                <div className="flex items-center justify-between border border-neutral-800 rounded-xl bg-neutral-900 px-3 py-2.5 shrink-0 w-full sm:w-32">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={isOutOfStock}
                    className="text-neutral-400 hover:text-white disabled:opacity-30"
                  >
                    <FiMinus size={15} />
                  </button>
                  <span className="font-bold text-white text-sm sm:text-base">{isOutOfStock ? 0 : quantity}</span>
                  <button
                    onClick={() =>
                      setQuantity((q) => {
                        if (q >= availableStock) {
                          toast.error(`Only ${availableStock} units available in stock.`);
                          return q;
                        }
                        return q + 1;
                      })
                    }
                    disabled={isOutOfStock || quantity >= availableStock}
                    className="text-neutral-400 hover:text-white disabled:opacity-30"
                  >
                    <FiPlus size={15} />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-extrabold uppercase text-xs sm:text-sm tracking-wider transition shadow-xl flex items-center justify-center gap-2 active:scale-98 min-w-0 ${isOutOfStock
                      ? "bg-neutral-800 text-neutral-500 cursor-not-allowed shadow-none border border-neutral-700"
                      : "bg-lime-500 hover:bg-lime-400 text-neutral-950 shadow-lime-500/20 cursor-pointer"
                    }`}
                >
                  <FiShoppingBag size={17} className="shrink-0" />
                  <span className="truncate">{isOutOfStock ? "OUT OF STOCK" : "ADD TO CART"}</span>
                </button>

                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`p-3 sm:p-4 rounded-xl border transition shrink-0 ${isWishlisted
                      ? "border-red-500/40 bg-red-500/10 text-red-400"
                      : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white"
                    }`}
                  title="Wishlist"
                >
                  <FiHeart size={18} fill={isWishlisted ? "currentColor" : "none"} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleEnquireNow}
                className="w-full py-2.5 sm:py-3.5 px-4 rounded-xl font-extrabold uppercase text-xs tracking-wider transition bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 hover:from-amber-500/30 hover:to-amber-500/30 text-[#f5b800] border border-amber-500/40 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 active:scale-[0.99] cursor-pointer"
              >
                <FiHelpCircle size={16} className="shrink-0" />
                <span className="truncate">Enquire Now for {product.name}</span>
              </button>

              <div className="grid grid-cols-2 gap-2 sm:gap-4 pt-2 sm:pt-4 border-t border-neutral-800/80 text-[11px] sm:text-xs">
                <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/60">
                  <FiTruck className="text-lime-400 shrink-0" size={18} />
                  <div>
                    <span className="font-bold text-white block">Express Dispatch</span>
                    <span className="text-[10px] sm:text-[11px] text-neutral-400">Delivery in 24-48 Hours</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/60">
                  <FiShield className="text-lime-400 shrink-0" size={18} />
                  <div>
                    <span className="font-bold text-white block">100% Authentic</span>
                    <span className="text-[10px] sm:text-[11px] text-neutral-400">Direct Importer Seal</span>
                  </div>
                </div>
              </div>



            </div>
          </div>
        </div>

        <div className="bg-[#141813] rounded-2xl sm:rounded-3xl border border-neutral-800 p-4 sm:p-8 space-y-4 sm:space-y-6 shadow-xl">
          <div className="flex items-center gap-4 sm:gap-8 border-b border-neutral-800 overflow-x-auto pb-3 scrollbar-thin">
            {[
              { id: "overview", label: "Product Description" },
              { id: "authenticity", label: "100% Authenticity Check" },
              { id: "reviews", label: "Verified Reviews" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`font-bold text-xs sm:text-sm whitespace-nowrap transition py-2 relative ${activeTab === tab.id
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

          {activeTab === "overview" && (
            <div className="space-y-3 sm:space-y-4 text-neutral-300 leading-relaxed text-xs sm:text-sm max-w-4xl">
              <h3 className="font-heading font-extrabold text-base sm:text-lg text-white">
                Detailed Product Overview
              </h3>
              <p>{product.description || "High quality sports supplement formulated for optimal performance and muscle recovery."}</p>
              {product.subtitle && (
                <div className="p-3 sm:p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-xs text-neutral-300 space-y-1">
                  <span className="font-bold text-lime-400 block uppercase">Formula Highlight:</span>
                  <p>{product.subtitle}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "authenticity" && (
            <div className="space-y-3 sm:space-y-4 max-w-3xl">
              <h3 className="font-heading font-extrabold text-base sm:text-lg text-white">
                100% Direct Importer & Authenticity Seal Guarantee
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs text-neutral-300">
                <div className="p-3 sm:p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1.5">
                  <span className="font-bold text-lime-400 block">Direct Importer Sourced</span>
                  <p>All supplements are imported directly from authorized brand distributors with genuine hologram scratch codes.</p>
                </div>
                <div className="p-3 sm:p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1.5">
                  <span className="font-bold text-lime-400 block">Scan Scratch Code</span>
                  <p>Verify your product authenticity instant SMS/QR code on the official manufacturer website.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-6 max-w-4xl text-xs text-neutral-300">
              {/* Rating Overview Header Card */}
              <div className="p-4 sm:p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1">
                  <h3 className="font-heading font-extrabold text-base sm:text-lg text-white">
                    Verified Customer Reviews & Feedback
                  </h3>
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-3xl sm:text-4xl font-black font-heading text-lime-400">{avgRating}</span>
                    <div className="space-y-0.5">
                      <div className="flex items-center text-amber-400 gap-1">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            size={16}
                            fill={i < Math.round(Number(avgRating)) ? "currentColor" : "none"}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-neutral-400 font-semibold block">
                        Based on {reviewsList.length} verified buyer {reviewsList.length === 1 ? "review" : "reviews"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsReviewFormOpen(!isReviewFormOpen)}
                  className="px-5 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-neutral-950 font-black text-xs transition cursor-pointer shadow-md shadow-lime-500/20 shrink-0"
                >
                  {isReviewFormOpen ? "Cancel Review" : "Write a Review"}
                </button>
              </div>

              {/* Review Submission Form Drawer / Card */}
              {isReviewFormOpen && (
                <form onSubmit={handleReviewSubmit} className="p-5 sm:p-6 rounded-2xl bg-[#181e18] border border-lime-500/40 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                  <h4 className="font-heading text-base font-bold text-white flex items-center gap-2">
                    <FiCheckCircle className="text-lime-400" />
                    <span>Write a Product Review for {product.name}</span>
                  </h4>

                  {/* Rating Selector */}
                  <div>
                    <label className="block text-neutral-300 font-bold mb-1">Your Rating *</label>
                    <div className="flex items-center gap-1.5 cursor-pointer">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                          className="p-1 text-amber-400 transition transform hover:scale-125 cursor-pointer"
                        >
                          <FiStar
                            size={24}
                            fill={(hoverRating || reviewForm.rating) >= star ? "currentColor" : "none"}
                          />
                        </button>
                      ))}
                      <span className="ml-2 font-bold text-white text-xs">
                        {hoverRating || reviewForm.rating} / 5 Stars
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-neutral-300 font-bold mb-1">Your Name</label>
                      <input
                        type="text"
                        placeholder={user?.name || "e.g. Rahul Sharma"}
                        value={reviewForm.name}
                        onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-lime-500 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-300 font-bold mb-1">Review Headline / Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Authentic product, great taste & recovery!"
                        value={reviewForm.title}
                        onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-lime-500 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-300 font-bold mb-1">Your Detailed Review *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Share details about flavor, mixability, energy, or workout recovery results..."
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-lime-500 text-xs leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setIsReviewFormOpen(false)}
                      className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 font-bold hover:text-white transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-xl bg-lime-500 text-neutral-950 font-black hover:bg-lime-400 transition shadow-md shadow-lime-500/20 cursor-pointer"
                    >
                      Submit Review
                    </button>
                  </div>
                </form>
              )}

              {/* Published Reviews Cards List */}
              <div className="space-y-3.5">
                {reviewsList.map((rev) => (
                  <div key={rev.id} className="p-4 sm:p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2.5 shadow-lg">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-lime-500/20 text-lime-400 font-black flex items-center justify-center border border-lime-500/30 text-xs shrink-0">
                          {(rev.name || "C").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">{rev.name}</span>
                            {rev.verified && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-extrabold flex items-center gap-1">
                                <FiCheckCircle size={10} />
                                Verified Buyer
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-neutral-500 block">{rev.date}</span>
                        </div>
                      </div>

                      <div className="flex items-center text-amber-400 gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            size={13}
                            fill={i < Number(rev.rating) ? "currentColor" : "none"}
                          />
                        ))}
                      </div>
                    </div>

                    {rev.title && (
                      <h5 className="font-bold text-white text-xs sm:text-sm">{rev.title}</h5>
                    )}

                    <p className="text-xs text-neutral-300 leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {relatedProducts.length > 0 && (
          <div className="space-y-4 sm:space-y-6 pt-2 sm:pt-4">
            <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-white">
              Related Supplements You Might Like
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
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