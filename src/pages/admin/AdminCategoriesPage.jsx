import { useEffect, useState } from "react";
import { FiEdit2, FiFolderPlus, FiGrid, FiPackage, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { DEFAULT_ADMIN_CATEGORIES } from "../../data/initialProducts";
import { db } from "../../firebase/firebase.config";
import { doc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { useProducts, isCategoryMatch } from "../../context/ProductContext";

export default function AdminCategoriesPage() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    badge: "Active",
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (isModalOpen) {
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
  }, [isModalOpen]);

  const getProductCount = (categoryName) => {
    if (!Array.isArray(products)) return 0;
    return products.filter((p) => isCategoryMatch(p.category, categoryName)).length;
  };

  const loadCategories = async () => {
    try {
      let firestoreCats = [];
      try {
        const snap = await getDocs(collection(db, "categories"));
        snap.forEach((docSnap) => firestoreCats.push({ id: docSnap.id, ...docSnap.data() }));
      } catch (fErr) {
        console.warn("Firestore categories load warning:", fErr);
      }

      if (firestoreCats.length > 0) {
        setCategories(firestoreCats);
        localStorage.setItem("frd_admin_categories_v2", JSON.stringify(firestoreCats));
        return;
      }
    } catch (err) { }

    const saved = localStorage.getItem("frd_admin_categories_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed);
          return;
        }
      } catch (e) { }
    }

    setCategories(DEFAULT_ADMIN_CATEGORIES);
    localStorage.setItem("frd_admin_categories_v2", JSON.stringify(DEFAULT_ADMIN_CATEGORIES));

    // Upload defaults to Firebase Firestore if collection is empty
    try {
      for (const cat of DEFAULT_ADMIN_CATEGORIES) {
        setDoc(doc(db, "categories", cat.id), cat).catch(() => { });
      }
    } catch (e) { }
  };

  const saveCategories = async (updated) => {
    setCategories(updated);
    localStorage.setItem("frd_admin_categories_v2", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("frd_categories_updated"));

    try {
      for (const cat of updated) {
        if (cat.id) {
          await setDoc(doc(db, "categories", cat.id), cat);
        }
      }
    } catch (err) {
      console.error("Firebase store category sync error:", err);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        badge: category.badge || "Active",
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        slug: "",
        description: "",
        badge: "Active",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Category name is required!");
      return;
    }

    const slug = formData.slug.trim() || formData.name.toLowerCase().replace(/\s+/g, "-");

    if (editingCategory) {
      const updated = categories.map((cat) =>
        cat.id === editingCategory.id
          ? { ...cat, name: formData.name.trim(), slug, description: formData.description, badge: formData.badge }
          : cat
      );
      saveCategories(updated);
      toast.success("Category updated successfully!");
    } else {
      const newCat = {
        id: `cat-${Date.now()}`,
        name: formData.name.trim(),
        slug,
        description: formData.description,
        badge: formData.badge,
      };
      saveCategories([...categories, newCat]);
      toast.success("New category added!");
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the category "${name}"?`)) {
      const updated = categories.filter((c) => c.id !== id);
      saveCategories(updated);
      try {
        await deleteDoc(doc(db, "categories", id));
      } catch (err) {
        console.error("Firebase delete category sync error:", err);
      }
      toast.success(`Category "${name}" removed.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}


      <button
        onClick={() => handleOpenModal()}
        className="px-5 py-2.5 rounded-2xl bg-lime-500 hover:bg-lime-400 text-neutral-950 font-heading font-black text-xs transition cursor-pointer shadow-lg shadow-lime-500/20 flex items-center gap-2 shrink-0"
      >
        <FiPlus size={16} />
        <span>Add New Category</span>
      </button>


      {/* Categories Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const count = getProductCount(cat.name);

          return (
            <div
              key={cat.id}
              className="bg-[#141813] border border-neutral-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-neutral-700 transition group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-lime-500/10 border border-lime-500/20 text-[10px] font-extrabold text-lime-400 uppercase tracking-wider">
                    {cat.badge || "Active Category"}
                  </span>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                    <button
                      onClick={() => handleOpenModal(cat)}
                      className="p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition"
                      title="Edit Category"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-red-400 transition"
                      title="Delete Category"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="font-heading text-lg font-black text-white group-hover:text-lime-400 transition">
                  {cat.name}
                </h3>
              </div>

              {/* Action & Supplement Count */}
              <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-neutral-300 flex items-center gap-1.5">
                  <FiPackage className="text-lime-400" size={14} />
                  <span>{count} {count === 1 ? "Supplement" : "Supplements"}</span>
                </span>

                <button
                  onClick={() => navigate(`/admin/products?category=${encodeURIComponent(cat.name)}`)}
                  className="text-xs font-bold text-lime-400 hover:text-lime-300 transition flex items-center gap-1"
                >
                  <span>View Products →</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141813] border border-neutral-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-heading text-lg font-black text-white">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-neutral-400 font-bold mb-1">
                  Category Name: *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Creatine, Whey Protein"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-2.5 text-white placeholder-neutral-600 focus:border-lime-500 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-neutral-400 font-bold mb-1">
                  Category Badge / Tagline:
                </label>
                <input
                  type="text"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  placeholder="e.g. Core Lineup, Best Seller"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-2.5 text-white placeholder-neutral-600 focus:border-lime-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-300 font-bold hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-lime-500 text-neutral-950 font-heading font-black hover:bg-lime-400 transition shadow-lg shadow-lime-500/20"
                >
                  {editingCategory ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
