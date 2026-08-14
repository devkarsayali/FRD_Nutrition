import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FiChevronDown, FiFilter, FiRefreshCw, FiSearch, FiSliders, FiTag, FiX } from "react-icons/fi";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/common/ProductCard";
import QuickViewModal from "../components/common/QuickViewModal";
import { useProducts } from "../context/ProductContext";

export default function SupplementsPage() {
  const [searchParams] = useSearchParams();
  const {
    categories,
    tags,

    filteredProducts,
    selectedCategory,
    setSelectedCategory,
    selectedTag,
    setSelectedTag,
    maxPrice,
    setMaxPrice,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
  } = useProducts();

  const [quickViewProduct, setQuickViewProduct] = useState(null);

  useEffect(() => {
    const tagFromUrl = searchParams.get("tag");
    const catFromUrl = searchParams.get("category");
    if (tagFromUrl) {
      setSelectedTag(tagFromUrl);
    }
    if (catFromUrl) {
      const matchedCat = categories.find(
        (c) => c.toLowerCase().trim() === catFromUrl.toLowerCase().trim()
      );
      setSelectedCategory(matchedCat || catFromUrl);
    }
  }, [searchParams, categories]);

  const resetAllFilters = () => {
    setSelectedCategory("All Categories");
    setSelectedTag("All Tags");
    setMaxPrice(50000);
    setSearchQuery("");
    setSortBy("relevance");
  };

  const isFiltered =
    selectedCategory !== "All Categories" ||
    selectedTag !== "All Tags" ||
    maxPrice < 50000 ||
    searchQuery !== "";

  return (
    <div className="bg-[#090d16] text-slate-100 min-h-screen py-10">
      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container-custom space-y-8"
      >
        {/* MAIN FILTER SECTION CONTAINER (MATCHING USER SCREENSHOTS 1 & 2) */}
        <div className="bg-[#0f172a]/95 p-4 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-6">
          {/* Header Row: OUR PRODUCTS —— & Sort By Dropdown */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-wider text-slate-200 uppercase flex items-center gap-3">
                <span>OUR</span>
                <span className="font-black text-[#f5b800]">PRODUCTS</span>
                <span className="w-12 h-0.5 bg-[#f5b800]/50 inline-block" />
              </h1>
            </div>

            {/* Sort by Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs text-slate-400 font-bold hidden sm:inline">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs text-slate-200 font-bold focus:outline-none focus:border-[#f5b800] transition cursor-pointer shadow-md"
              >
                <option value="relevance">Sort by: Relevance</option>
                <option value="price-low">Sort by: Low to High</option>
                <option value="price-high">Sort by: High to Low</option>
              </select>
            </div>
          </div>

          {/* Filter Controls Row: Categories, Tags, Up to Price Slider */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* 1. All Categories Dropdown */}
            <div className="md:col-span-3">
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl px-4 py-3 text-xs text-[#f5b800] font-black focus:outline-none focus:border-[#f5b800] transition cursor-pointer appearance-none shadow-md pr-10"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-slate-900 text-slate-100 font-bold">
                      {cat}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3.5 top-3.5 text-[#f5b800] pointer-events-none" size={16} />
              </div>
            </div>

            {/* 2. All Tags Dropdown */}
            <div className="md:col-span-3">
              <div className="relative">
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl px-4 py-3 text-xs text-blue-400 font-black focus:outline-none focus:border-[#f5b800] transition cursor-pointer appearance-none shadow-md pr-10"
                >
                  {tags.map((tag) => (
                    <option key={tag} value={tag} className="bg-slate-900 text-slate-100 font-bold">
                      {tag}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3.5 top-3.5 text-blue-400 pointer-events-none" size={16} />
              </div>
            </div>

            {/* 3. Up to Price Slider (With Vibrant Gold Colored Track & Accent) */}
            <div className="md:col-span-6 bg-slate-900 p-3.5 rounded-2xl border border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2 whitespace-nowrap text-xs font-bold text-slate-200">
                <span>Up to Price:</span>
                <span className="font-black text-[#f5b800] text-sm bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                  ₹{maxPrice.toLocaleString()}
                </span>
              </div>

              <div className="w-full flex-1 flex items-center gap-3">
                <input
                  type="range"
                  min="500"
                  max="50000"
                  step="500"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #f5b800 0%, #f5b800 ${((maxPrice - 500) / (50000 - 500)) * 100
                      }%, #1e293b ${((maxPrice - 500) / (50000 - 500)) * 100
                      }%, #1e293b 100%)`,
                  }}
                  className="w-full h-2.5 rounded-lg appearance-none cursor-pointer accent-[#f5b800] transition-all shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Search Input & Reset Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="relative w-full sm:max-w-md">
              <FiSearch className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search supplements by name or formula..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#f5b800]"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
              <span className="text-xs text-slate-400 font-bold">
                Found <span className="text-[#f5b800] font-black">{filteredProducts.length}</span> supplements
              </span>

              {isFiltered && (
                <button
                  onClick={resetAllFilters}
                  className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[#f5b800] hover:bg-amber-500/20 font-bold text-xs transition flex items-center gap-1.5"
                >
                  <FiRefreshCw size={13} />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CATALOG PRODUCTS GRID */}
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-[#0f172a] rounded-[2.5rem] border border-slate-800 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-slate-900 text-slate-500 flex items-center justify-center mx-auto">
              <FiSliders size={24} />
            </div>
            <h3 className="font-heading font-bold text-base text-white">No supplements match your filters</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try increasing the price slider or resetting your selected category / tags.
            </p>
            <button
              onClick={resetAllFilters}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#f5b800] to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={(prod) => setQuickViewProduct(prod)}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}