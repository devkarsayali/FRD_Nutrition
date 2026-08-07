import { useEffect, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import WheyIsolate from "../../assets/whey-isolate.png";
import {
  FiCheck,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUpload,
  FiX,
} from "react-icons/fi";
import { useProducts } from "../../context/ProductContext";

export default function AdminProductsPage({ isAddModalOpen, setIsAddModalOpen }) {
  const [searchParams] = useSearchParams();
  const categoryUrlParam = searchParams.get("category");
  const stockUrlParam = searchParams.get("stock");

  const outletContext = useOutletContext();
  const globalSearch = outletContext?.searchQuery || "";

  const {
    products,
    categories,
    addProduct,
 updateProduct,
    deleteProduct,
    toggleStockStatus,
  } = useProducts();

  const [localSearch, setLocalSearch] = useState("");
  const search = globalSearch || localSearch;
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(
    categoryUrlParam || "All"
  );
  const [stockFilter, setStockFilter] = useState(
    stockUrlParam === "outofstock"
      ? "Out of Stock"
      : stockUrlParam === "instock"
      ? "In Stock"
      : "All"
  );
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    if (categoryUrlParam) {
      const matchedCat = categories.find(
        (c) => c.toLowerCase().trim() === categoryUrlParam.toLowerCase().trim()
      );
      if (matchedCat) {
        setSelectedCategoryFilter(matchedCat);
      } else {
        setSelectedCategoryFilter(categoryUrlParam);
      }
    }
  }, [categoryUrlParam, categories]);

  useEffect(() => {
    if (stockUrlParam === "outofstock") {
      setStockFilter("Out of Stock");
    } else if (stockUrlParam === "instock") {
      setStockFilter("In Stock");
    }
  }, [stockUrlParam]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    subtitle: "",
    category: "Protein",
    subcategory: "Popular",
    price: "",
    originalPrice: "",
    stockQuantity: 36,
    flavors: "",
    sizes: "",
    description: "",
    image: WheyIsolate,
    images: [],
    videos: [],
    howToUse: "",
    benefits: "",
    inStock: true,
    isFeatured: false,
    isLatest: false,
    isTrending: false,
    isPopular: false,
    badge: "",
  });

  const [newImageUrl, setNewImageUrl] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      subtitle: "",
      category: "Protein",
      subcategory: "Popular",
      price: "",
      originalPrice: "",
      stockQuantity: 36,
      flavors: "Rich Chocolate, Swiss Vanilla",
      sizes: "1 kg, 2 kg",
      description: "High quality sports supplement formulated for optimal performance.",
      image: WheyIsolate,
      images: [WheyIsolate],
      videos: [],
      howToUse: "Mix 1 scoop with 200ml cold water post workout.",
      benefits: "Accelerates muscle recovery\nZero added sugar\n100% Authentic direct seal verification",
      inStock: true,
      isFeatured: false,
      isLatest: true,
      isJustLaunched: true,
      isTrending: false,
      isPopular: false,
      isEditorsChoice: false,
      badge: "NEW",
    });
    setNewImageUrl("");
    setNewVideoUrl("");
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    const existingImages = Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : [WheyIsolate];

    const existingVideos = Array.isArray(product.videos) ? product.videos : [];
    const benefitsStr = Array.isArray(product.benefits)
      ? product.benefits.join("\n")
      : product.benefits || "";

    setFormData({
      name: product.name || "",
      subtitle: product.subtitle || "",
      category: product.category || "Protein",
      subcategory: product.subcategory || "Popular",
      price: product.price || "",
      originalPrice: product.originalPrice || "",
      stockQuantity: product.stockQuantity !== undefined ? product.stockQuantity : 36,
      flavors: Array.isArray(product.flavors) ? product.flavors.join(", ") : product.flavors || "",
      sizes: Array.isArray(product.sizes) ? product.sizes.join(", ") : product.sizes || "",
      description: product.description || "",
      image: product.image || existingImages[0] || WheyIsolate,
      images: existingImages,
      videos: existingVideos,
      howToUse: product.howToUse || "",
      benefits: benefitsStr,
      inStock: product.inStock ?? true,
      isFeatured: product.isFeatured ?? false,
      isLatest: product.isLatest ?? false,
      isJustLaunched: product.isJustLaunched ?? product.isLatest ?? false,
      isTrending: product.isTrending ?? false,
      isPopular: product.isPopular ?? false,
      isEditorsChoice: product.isEditorsChoice ?? false,
      badge: product.badge || "",
    });
    setNewImageUrl("");
    setNewVideoUrl("");
    setIsAddModalOpen(true);
  };

  // Image Management Handlers
  const handleAddImageUrl = () => {
    if (newImageUrl.trim()) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, newImageUrl.trim()],
        image: prev.image || newImageUrl.trim(),
      }));
      setNewImageUrl("");
    }
  };

  const handleImageFilesUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, reader.result],
          image: prev.image || reader.result,
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => {
      const updated = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: updated,
        image: updated.length > 0 ? updated[0] : "",
      };
    });
  };

  // Video Management Handlers
  const handleAddVideoUrl = () => {
    if (newVideoUrl.trim()) {
      setFormData((prev) => ({
        ...prev,
        videos: [...prev.videos, newVideoUrl.trim()],
      }));
      setNewVideoUrl("");
    }
  };

  const handleVideoFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          videos: [...prev.videos, reader.result],
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveVideo = (index) => {
    setFormData((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      alert("Please fill in required fields (Name & Price).");
      return;
    }

    const payload = {
      ...formData,
      price: Number(formData.price),
      originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
      stockQuantity: formData.inStock === false ? "0" : String(formData.stockQuantity ?? "").trim() || "0",
      image: formData.images.length > 0 ? formData.images[0] : formData.image,
      benefits: typeof formData.benefits === "string"
        ? formData.benefits.split("\n").map((b) => b.trim()).filter(Boolean)
        : formData.benefits,
    };

    if (editingProduct) {
      updateProduct({ id: editingProduct.id, ...payload });
    } else {
      addProduct(payload);
    }

    setIsAddModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this supplement?")) {
      deleteProduct(id);
    }
  };

  const getProductCategoryKey = (prod) => {
    if (!prod || !prod.category) return "Protein";
    const cat = prod.category.toLowerCase().trim();
    if (cat.includes("creatine")) return "Creatine";
    if (cat.includes("bcaa") || cat.includes("eaa")) return "BCAA";
    if (cat.includes("mass") || cat.includes("gainer")) return "Mass Gainer";
    if (cat.includes("pre workout") || cat.includes("pre-workout") || cat.includes("pump")) return "Pre Workout";
    if (cat.includes("post workout") || cat.includes("post-workout")) return "Post Workout";
    if (cat.includes("vitamin") || cat.includes("fat burner") || cat.includes("carnitine")) return "Vitamins";
    return "Protein";
  };

  // Admin filter logic
  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());

    const prodCatKey = getProductCategoryKey(p);
    const selectedCatNorm = (selectedCategoryFilter || "").toLowerCase();
    const matchesCat =
      selectedCatNorm === "all" ||
      selectedCatNorm === "all categories" ||
      prodCatKey.toLowerCase() === selectedCatNorm ||
      (p.category || "").toLowerCase().includes(selectedCatNorm);

    const matchesStock =
      stockFilter === "All"
        ? true
        : stockFilter === "Out of Stock"
        ? !p.inStock
        : p.inStock;
    return matchesSearch && matchesCat && matchesStock;
  });

  return (
    <div className="space-y-6">
      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch justify-between gap-4 bg-[#141813] p-4 rounded-2xl border border-neutral-800">
        <div className="relative flex-1 min-w-0">
          <FiSearch className="absolute left-3 top-3 text-neutral-500" size={16} />
          <input
            type="text"
            placeholder="Search supplements by title or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-lime-500"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 font-semibold focus:outline-none focus:border-lime-500 flex-1 sm:flex-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 font-semibold focus:outline-none focus:border-lime-500 flex-1 sm:flex-none cursor-pointer"
          >
            <option value="All">Stock: All</option>
            <option value="In Stock">Stock: In Stock Only</option>
            <option value="Out of Stock">Stock: Out of Stock Only</option>
          </select>

          <button
            onClick={handleOpenAdd}
            className="w-full sm:w-auto justify-center whitespace-nowrap px-5 py-2.5 sm:py-3 rounded-xl bg-lime-500 text-neutral-950 font-bold hover:bg-lime-400 transition text-xs flex items-center gap-2 shadow-lg shadow-lime-500/20"
          >
            <FiPlus size={18} />
            <span>Add New Supplement</span>
          </button>
        </div>
      </div>

      {/* Supplements CRUD Data Table */}
      <div className="bg-[#141813] rounded-3xl border border-neutral-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs text-neutral-300">
            <thead className="bg-neutral-900 text-neutral-400 uppercase text-[10px] border-b border-neutral-800">
              <tr>
                <th className="p-4">Supplement</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price (₹)</th>
                <th className="p-4">Stock Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-neutral-500">
                    No supplements found. Click "Add New Supplement" to create one.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-900/40">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-12 h-12 object-contain bg-neutral-900 p-1.5 rounded-xl border border-neutral-800 shrink-0"
                        />
                        <div>
                          <span className="font-bold text-white block text-sm">
                            {p.name}
                          </span>
                          <span className="text-[11px] text-neutral-500 line-clamp-1">
                            {p.subtitle}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-semibold text-lime-400">
                        {p.category}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-extrabold text-white text-sm">
                        ₹{p.price}
                      </span>
                      {p.originalPrice && (
                        <span className="text-[11px] text-neutral-500 line-through ml-2">
                          ₹{p.originalPrice}
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => toggleStockStatus(p.id)}
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold transition ${p.inStock
                          ? "bg-lime-500/20 text-lime-400 border border-lime-500/40"
                          : "bg-red-500/20 text-red-400 border border-red-500/40"
                          }`}
                      >
                        {p.inStock ? "IN STOCK" : "OUT OF STOCK"}
                      </button>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-2 rounded-xl bg-neutral-900 text-neutral-300 hover:text-lime-400 hover:border-lime-500/50 border border-neutral-800 transition"
                          title="Edit Supplement"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-2 rounded-xl bg-neutral-900 text-neutral-400 hover:text-red-400 hover:border-red-500/50 border border-neutral-800 transition"
                          title="Delete Supplement"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Supplement Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setIsAddModalOpen(false)}
          />

          <div className="relative w-full max-w-2xl bg-[#141813] text-white rounded-2xl sm:rounded-3xl border border-neutral-800 shadow-2xl p-4 sm:p-8 z-10 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <h3 className="font-heading text-xl font-bold">
                {editingProduct ? "Edit Supplement" : "Add New Supplement"}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-full text-neutral-400 hover:text-white"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-neutral-300 font-bold mb-1">
                    Supplement Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g. MUSCLETECH WHEY PROTEIN & CREATINE COMBO OFFER"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-lime-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-neutral-300 font-bold mb-1">
                    Subtitle / Short Tagline
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) =>
                      setFormData({ ...formData, subtitle: e.target.value })
                    }
                    placeholder="e.g. NitroTech Whey 1.8kg + Platinum Creatine 250g Stack"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-lime-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-bold mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="e.g. Protein, Pre Workout, Mass Gainer"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-lime-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-bold mb-1">
                    Subcategory / Tag
                  </label>
                  <input
                    type="text"
                    value={formData.subcategory}
                    onChange={(e) =>
                      setFormData({ ...formData, subcategory: e.target.value })
                    }
                    placeholder="e.g. Popular, Isolate, Combos"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-lime-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-bold mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="5810"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-lime-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-bold mb-1">
                    Original Price / MRP (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, originalPrice: e.target.value })
                    }
                    placeholder="8938"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-lime-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-bold mb-1">
                    Stock Quantity (Items in Stock)
                  </label>
                  <input
                    type="text"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, stockQuantity: e.target.value })
                    }
                    placeholder="e.g. Available, Not Available, 38 in stock"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-lime-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-bold mb-1">
                    Badge Tag (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) =>
                      setFormData({ ...formData, badge: e.target.value })
                    }
                    placeholder="e.g. COMBO OFFER, BEST SELLER, NEW"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-lime-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-bold mb-1">
                    Flavors (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={formData.flavors}
                    onChange={(e) =>
                      setFormData({ ...formData, flavors: e.target.value })
                    }
                    placeholder="CHOCOLATE, Vanilla, Milk Chocolate"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-lime-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-bold mb-1">
                    Sizes / Weights (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={formData.sizes}
                    onChange={(e) =>
                      setFormData({ ...formData, sizes: e.target.value })
                    }
                    placeholder="1.8 kg, 2 kg, Combo Pack"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-lime-500"
                  />
                </div>
              </div>

              {/* Product Photos Section (1 or More Photos) */}
              <div className="space-y-3 pt-3 border-t border-neutral-800">
                <div className="flex items-center justify-between">
                  <label className="block text-neutral-200 font-bold text-xs">
                    Product Photos (Add 1 or More Photos)
                  </label>
                  <span className="text-[11px] text-neutral-400">
                    {formData.images.length} Photo{formData.images.length === 1 ? "" : "s"} Added
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Paste photo URL here..."
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-lime-500 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 font-bold rounded-xl text-white text-xs shrink-0"
                  >
                    Add URL
                  </button>
                  <label className="px-3 py-2 bg-lime-500/20 hover:bg-lime-500/30 border border-lime-500/40 text-lime-400 font-bold rounded-xl cursor-pointer flex items-center gap-1 shrink-0 text-xs">
                    <FiUpload size={14} />
                    <span>Upload Photos</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageFilesUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Photos Grid Thumbnails */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-1">
                    {formData.images.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 aspect-square flex items-center justify-center p-1"
                      >
                        <img
                          src={imgUrl}
                          alt={`Product preview ${idx + 1}`}
                          className="w-full h-full object-contain"
                        />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-lime-500 text-neutral-950 font-black text-[8px] px-1 rounded uppercase">
                            Main
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                          title="Remove Photo"
                        >
                          <FiX size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Videos Section (1 or More Videos) */}
              <div className="space-y-3 pt-3 border-t border-neutral-800">
                <div className="flex items-center justify-between">
                  <label className="block text-neutral-200 font-bold text-xs">
                    Product Videos (Add 1 or More Videos)
                  </label>
                  <span className="text-[11px] text-neutral-400">
                    {formData.videos.length} Video{formData.videos.length === 1 ? "" : "s"} Added
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="Paste MP4 video URL or YouTube embed URL..."
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-lime-500 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddVideoUrl}
                    className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 font-bold rounded-xl text-white text-xs shrink-0"
                  >
                    Add Video URL
                  </button>
                  <label className="px-3 py-2 bg-lime-500/20 hover:bg-lime-500/30 border border-lime-500/40 text-lime-400 font-bold rounded-xl cursor-pointer flex items-center gap-1 shrink-0 text-xs">
                    <FiUpload size={14} />
                    <span>Upload Video File</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Videos List */}
                {formData.videos.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {formData.videos.map((vidUrl, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs"
                      >
                        <div className="flex items-center gap-2 overflow-hidden pr-2">
                          <span className="px-2 py-0.5 rounded bg-lime-500/20 text-lime-400 font-bold text-[10px]">
                            VIDEO {idx + 1}
                          </span>
                          <span className="truncate text-neutral-300 text-[11px]">
                            {vidUrl}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVideo(idx)}
                          className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/40 transition shrink-0"
                          title="Remove Video"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Large Product Info Section */}
              {/* Detailed Product Info */}
              <div className="space-y-3 pt-3 border-t border-neutral-800">
                <div>
                  <label className="block text-neutral-300 font-bold mb-1">
                    Full Description / Overview
                  </label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Detailed supplement overview and ingredient profile..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-lime-500"
                  />
                </div>
              </div>

              {/* Checkbox Switches */}
              <div className="space-y-3 pt-2 border-t border-neutral-800">
                <p className="text-neutral-400 font-bold text-[11px] uppercase tracking-widest">
                  Homepage Visibility & Status
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 hover:border-lime-500/50 transition">
                    <input
                      type="checkbox"
                      checked={formData.isLatest}
                      onChange={(e) =>
                        setFormData({ ...formData, isLatest: e.target.checked, isJustLaunched: e.target.checked })
                      }
                      className="accent-lime-500"
                    />
                    <span className="text-xs font-semibold">Just Launched</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 hover:border-lime-500/50 transition">
                    <input
                      type="checkbox"
                      checked={formData.isTrending}
                      onChange={(e) =>
                        setFormData({ ...formData, isTrending: e.target.checked })
                      }
                      className="accent-lime-500"
                    />
                    <span className="text-xs font-semibold">Trending Products</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 hover:border-lime-500/50 transition">
                    <input
                      type="checkbox"
                      checked={formData.isPopular}
                      onChange={(e) =>
                        setFormData({ ...formData, isPopular: e.target.checked })
                      }
                      className="accent-lime-500"
                    />
                    <span className="text-xs font-semibold">Popular Supplements</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 hover:border-lime-500/50 transition">
                    <input
                      type="checkbox"
                      checked={formData.isEditorsChoice}
                      onChange={(e) =>
                        setFormData({ ...formData, isEditorsChoice: e.target.checked })
                      }
                      className="accent-lime-500"
                    />
                    <span className="text-xs font-semibold">Editor's Choice</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 hover:border-lime-500/50 transition">
                    <input
                      type="checkbox"
                      checked={formData.inStock}
                      onChange={(e) =>
                        setFormData({ ...formData, inStock: e.target.checked })
                      }
                      className="accent-lime-500"
                    />
                    <span className="text-xs font-semibold">In Stock</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 hover:border-lime-500/50 transition">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) =>
                        setFormData({ ...formData, isFeatured: e.target.checked })
                      }
                      className="accent-lime-500"
                    />
                    <span className="text-xs font-semibold">Mark as Featured</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-lime-500 text-neutral-950 font-bold hover:bg-lime-400 shadow-lg shadow-lime-500/20"
                >
                  {editingProduct ? "Save Changes" : "Create Supplement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
