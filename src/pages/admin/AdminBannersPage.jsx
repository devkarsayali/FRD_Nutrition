import { useEffect, useState } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiImage,
  FiEye,
  FiEyeOff,
  FiArrowUp,
  FiArrowDown,
  FiTag,
  FiType,
  FiFileText,
  FiLink,
  FiUpload,
  FiAlertTriangle,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { db } from "../../firebase/firebase.config";
import { collection, doc, getDocs, setDoc, deleteDoc } from "firebase/firestore";

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingBanner, setDeletingBanner] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    image: "",
    tagline: "",
    title: "",
    subtitle: "",
    btnText: "SHOP NOW",
    category: "All",
    displayOrder: 1,
    active: true,
  });

  // Load Banners strictly from Firestore database
  const loadBanners = async () => {
    setLoading(true);
    let loadedList = [];

    try {
      const snap = await getDocs(collection(db, "banners"));
      if (!snap.empty) {
        snap.forEach((d) => {
          loadedList.push({ id: d.id, ...d.data() });
        });
      }
    } catch (e) {
      console.warn("Firestore banners fetch warning:", e);
    }

    // Sort by display order
    loadedList.sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));

    setBanners(loadedList);
    setLoading(false);
  };

  useEffect(() => {
    loadBanners();
  }, []);

  // Prevent background website scrolling when modal is open
  useEffect(() => {
    if (isModalOpen || isDeleteModalOpen) {
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
  }, [isModalOpen, isDeleteModalOpen]);

  const saveBannersToStorage = async (updatedList) => {
    setBanners(updatedList);
    try {
      localStorage.setItem("frd_home_banners_v1", JSON.stringify(updatedList));
      window.dispatchEvent(new CustomEvent("frd_banners_updated"));
    } catch (e) { }
  };

  // Open modal for Create
  const handleOpenAddModal = () => {
    setEditingBanner(null);
    setFormData({
      image: "",
      tagline: "",
      title: "",
      subtitle: "",
      btnText: "SHOP NOW",
      category: "All",
      displayOrder: banners.length + 1,
      active: true,
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (banner) => {
    setEditingBanner(banner);
    setFormData({
      image: banner.image || "",
      tagline: banner.tagline || "",
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      btnText: banner.btnText || "SHOP NOW",
      category: banner.category || "All",
      displayOrder: banner.displayOrder ?? 1,
      active: banner.active !== false,
    });
    setIsModalOpen(true);
  };

  // Image File Upload Handler (Convert to Base64 data URL)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, image: reader.result }));
      toast.success("Banner image loaded successfully!");
    };
    reader.readAsDataURL(file);
  };

  // Submit Add / Edit Form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.image.trim()) {
      toast.error("Banner image is required.");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Banner Heading / Title is required.");
      return;
    }

    const bannerId = editingBanner ? editingBanner.id : `banner_${Date.now()}`;

    const newBanner = {
      id: bannerId,
      image: formData.image.trim(),
      tagline: formData.tagline.trim(),
      title: formData.title.trim(),
      subtitle: formData.subtitle.trim(),
      btnText: formData.btnText.trim() || "SHOP NOW",
      category: formData.category.trim() || "All",
      displayOrder: Number(formData.displayOrder) || 1,
      active: formData.active,
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, "banners", bannerId), newBanner, { merge: true });
    } catch (e) {
      console.warn("Firestore setDoc warning:", e);
    }

    let newList = [...banners];
    if (editingBanner) {
      newList = newList.map((b) => (b.id === bannerId ? newBanner : b));
    } else {
      newList.push(newBanner);
    }

    newList.sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));

    saveBannersToStorage(newList);
    toast.success(editingBanner ? "Home banner updated successfully!" : "New home banner created successfully!");
    setIsModalOpen(false);
  };

  // Toggle Active State
  const handleToggleActive = async (banner) => {
    const updatedBanner = { ...banner, active: !banner.active };

    try {
      await setDoc(doc(db, "banners", banner.id), { active: updatedBanner.active }, { merge: true });
    } catch (e) { }

    const newList = banners.map((b) => (b.id === banner.id ? updatedBanner : b));
    saveBannersToStorage(newList);
    toast.success(
      updatedBanner.active
        ? `Banner "${updatedBanner.title}" activated for Homepage!`
        : `Banner "${updatedBanner.title}" deactivated from Homepage!`
    );
  };

  // Delete Banner Confirmation
  const handleDeleteClick = (banner) => {
    setDeletingBanner(banner);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingBanner) return;

    try {
      await deleteDoc(doc(db, "banners", deletingBanner.id));
    } catch (e) {
      console.warn("Firestore deleteDoc warning:", e);
    }

    const newList = banners.filter((b) => b.id !== deletingBanner.id);
    saveBannersToStorage(newList);
    toast.success(`Banner "${deletingBanner.title}" permanently deleted.`);
    setIsDeleteModalOpen(false);
    setDeletingBanner(null);
  };

  // Change Display Order Up/Down
  const handleMoveOrder = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const newList = [...banners];
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;

    // Re-assign displayOrder numbers 1..N
    newList.forEach((b, idx) => {
      b.displayOrder = idx + 1;
      setDoc(doc(db, "banners", b.id), { displayOrder: b.displayOrder }, { merge: true }).catch(() => { });
    });

    saveBannersToStorage(newList);
    toast.success("Banner display order updated!");
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-4">


        <button
          onClick={handleOpenAddModal}
          className="px-5 py-3 rounded-2xl bg-lime-500 hover:bg-lime-400 text-neutral-950 font-black flex items-center gap-2 transition cursor-pointer text-xs shadow-lg shadow-lime-500/20 uppercase tracking-wider shrink-0"
        >
          <FiPlus size={18} />
          <span>Add New Banner</span>
        </button>
      </div>

      {/* Banners Grid / List */}
      {loading ? (
        <div className="p-12 text-center text-neutral-400 text-xs">
          Loading homepage banners from database...
        </div>
      ) : banners.length === 0 ? (
        <div className="p-12 text-center bg-[#141813] border border-neutral-800 rounded-3xl text-neutral-400 space-y-3">
          <FiImage size={36} className="mx-auto text-neutral-600" />
          <p className="font-bold text-sm text-white">No Home Banners Found</p>
          <p className="text-xs max-w-md mx-auto">
            Click "Add New Banner" above to upload and publish your hero banners for the homepage hero slider.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`relative bg-[#141813] border rounded-3xl overflow-hidden flex flex-col transition-all duration-300 ${banner.active !== false ? "border-neutral-800 hover:border-lime-500/50" : "border-neutral-800/50 opacity-60"
                }`}
            >
              {/* Image Preview */}
              <div className="relative h-44 bg-neutral-950 overflow-hidden group">
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Badge Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#141813] via-transparent to-black/60 p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-neutral-950/80 backdrop-blur-md text-lime-400 font-mono font-bold text-[10px] border border-neutral-800">
                      Order #{index + 1}
                    </span>

                    <button
                      onClick={() => handleToggleActive(banner)}
                      className={`px-3 py-1 rounded-full font-bold text-[10px] backdrop-blur-md transition cursor-pointer flex items-center gap-1.5 border ${banner.active !== false
                        ? "bg-lime-500/20 text-lime-400 border-lime-500/40"
                        : "bg-red-500/20 text-red-400 border-red-500/40"
                        }`}
                    >
                      {banner.active !== false ? <FiEye size={12} /> : <FiEyeOff size={12} />}
                      <span>{banner.active !== false ? "Active" : "Disabled"}</span>
                    </button>
                  </div>

                  {banner.tagline && (
                    <span className="px-2.5 py-1 bg-lime-500 text-neutral-950 font-bold text-[9px] uppercase tracking-wider rounded-md self-start truncate max-w-[85%] shadow-md">
                      {banner.tagline}
                    </span>
                  )}
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="font-heading font-bold text-sm text-white line-clamp-2 leading-snug">
                    {banner.title}
                  </h3>
                  {banner.subtitle && (
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {banner.subtitle}
                    </p>
                  )}
                </div>

                <div className="space-y-3 pt-2 border-t border-neutral-800/80 text-[11px]">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Button Text:</span>
                    <strong className="text-lime-400">{banner.btnText || "SHOP NOW"}</strong>
                  </div>

                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Target Link / Category:</span>
                    <span className="px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono text-[10px]">
                      {banner.category || "All"}
                    </span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
                  <div className="flex items-center gap-1">
                    <button
                      disabled={index === 0}
                      onClick={() => handleMoveOrder(index, -1)}
                      className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                      title="Move Up"
                    >
                      <FiArrowUp size={14} />
                    </button>
                    <button
                      disabled={index === banners.length - 1}
                      onClick={() => handleMoveOrder(index, 1)}
                      className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                      title="Move Down"
                    >
                      <FiArrowDown size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(banner)}
                      className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-lime-400 hover:border-lime-500/50 transition cursor-pointer text-xs flex items-center gap-1.5"
                    >
                      <FiEdit2 size={14} />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDeleteClick(banner)}
                      className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition cursor-pointer"
                      title="Delete Banner"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT BANNER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#141813] border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white my-auto max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-lime-500/20 text-lime-400 font-bold flex items-center justify-center border border-lime-500/30">
                  <FiImage size={20} />
                </div>
                <div>
                  <h2 className="font-heading text-xl font-bold text-white">
                    {editingBanner ? "Edit Home Banner" : "Add New Home Banner"}
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Configure hero slide details, image, text heading & button link
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* Image Input & Preview */}
              <div className="space-y-2">
                <label className="block text-neutral-300 font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FiUpload className="text-lime-400" size={14} />
                    <span>Banner Image <span className="text-lime-400">*</span></span>
                  </span>
                  <span className="text-[10px] text-neutral-400 font-normal">
                    High-res image (16:9 ratio recommended)
                  </span>
                </label>

                {formData.image ? (
                  <div className="relative h-44 rounded-2xl overflow-hidden border border-lime-500/40 bg-neutral-950 group">
                    <img
                      src={formData.image}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                      <label className="px-4 py-2 rounded-xl bg-lime-500 text-neutral-950 font-bold cursor-pointer hover:bg-lime-400 transition text-xs">
                        Change Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, image: "" }))}
                        className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-neutral-800 hover:border-lime-500/50 rounded-2xl p-6 text-center space-y-3 transition bg-neutral-900/50">
                    <FiUpload size={32} className="mx-auto text-lime-400" />
                    <div>
                      <p className="text-white font-bold">Click to upload banner image</p>
                      <p className="text-[10px] text-neutral-400">PNG, JPG, WEBP up to 5MB</p>
                    </div>
                    <label className="inline-block px-5 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-neutral-950 font-bold cursor-pointer transition text-xs shadow-md">
                      Browse File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <div className="pt-2 text-[10px] text-neutral-500">
                      Or paste image URL below:
                    </div>
                    <input
                      type="text"
                      placeholder="https://example.com/banner-image.jpg"
                      value={formData.image}
                      onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-lime-500 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Tagline Badge */}
              <div>
                <label className="block text-neutral-300 font-bold mb-1.5 flex items-center gap-1.5">
                  <FiTag className="text-lime-400" size={14} />
                  <span>Badge Tagline Text</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 100% PURE WHEY ISOLATE | FAST ABSORPTION"
                  value={formData.tagline}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tagline: e.target.value }))}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-lime-500"
                />
              </div>

              {/* Main Heading Title */}
              <div>
                <label className="block text-neutral-300 font-bold mb-1.5 flex items-center gap-1.5">
                  <FiType className="text-lime-400" size={14} />
                  <span>Banner Main Heading / Title <span className="text-lime-400">*</span></span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. UNLEASH YOUR ULTIMATE POWER"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-lime-500 font-bold"
                />
              </div>

              {/* Subtitle Description */}
              <div>
                <label className="block text-neutral-300 font-bold mb-1.5 flex items-center gap-1.5">
                  <FiFileText className="text-lime-400" size={14} />
                  <span>Subtitle Description</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Premium New Zealand Whey Isolate with 26g Protein for Faster Recovery..."
                  value={formData.subtitle}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-lime-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Button Text */}
                <div>
                  <label className="block text-neutral-300 font-bold mb-1.5">
                    Button CTA Text
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SHOP WHEY NOW"
                    value={formData.btnText}
                    onChange={(e) => setFormData((prev) => ({ ...prev, btnText: e.target.value }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-lime-500"
                  />
                </div>

                {/* Target Link / Category Filter */}
                <div>
                  <label className="block text-neutral-300 font-bold mb-1.5 flex items-center gap-1">
                    <FiLink className="text-lime-400" size={12} />
                    <span>Target Category</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-lime-500 cursor-pointer"
                  >
                    <option value="All">All Supplements</option>
                    <option value="Protein">Protein</option>
                    <option value="Creatine">Creatine</option>
                    <option value="Pre Workout">Pre Workout</option>
                    <option value="Mass Gainer">Mass Gainer</option>
                    <option value="BCAA">BCAA / EAA</option>
                  </select>
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-neutral-300 font-bold mb-1.5">
                    Display Order Index
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData((prev) => ({ ...prev, displayOrder: e.target.value }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-lime-500 font-mono"
                  />
                </div>
              </div>

              {/* Active Toggle Checkbox */}
              <div className="flex items-center gap-3 p-3 bg-neutral-900/60 rounded-xl border border-neutral-800">
                <input
                  type="checkbox"
                  id="activeToggle"
                  checked={formData.active}
                  onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                  className="w-4 h-4 rounded text-lime-500 focus:ring-lime-500 accent-lime-500 cursor-pointer"
                />
                <label htmlFor="activeToggle" className="text-xs text-white font-bold cursor-pointer">
                  Publish Banner Immediately to Homepage Slider
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-300 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-lime-500 text-neutral-950 font-black hover:bg-lime-400 transition cursor-pointer text-xs shadow-lg shadow-lime-500/20 uppercase tracking-wider"
                >
                  {editingBanner ? "Update Banner" : "Save Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && deletingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#141813] border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-5 text-white">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                <FiAlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-white">Delete Banner</h3>
                <p className="text-xs text-neutral-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-900 p-3 rounded-xl border border-neutral-800">
              Are you sure you want to delete banner <strong className="text-white">"{deletingBanner.title}"</strong>? It will be permanently removed from Firestore & Homepage.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-300 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition cursor-pointer text-xs shadow-lg shadow-red-500/20"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
