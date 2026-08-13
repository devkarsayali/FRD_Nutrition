import { useEffect, useState } from "react";
import { FiEdit2, FiFolderPlus, FiGrid, FiPackage, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { INITIAL_PRODUCTS } from "../../data/initialProducts";
import { db } from "../../firebase/firebase.config";
import { doc, setDoc, deleteDoc } from "firebase/firestore";

export default function AdminCategoriesPage() {
  const navigate = useNavigate();
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
    try {
      const savedProducts = localStorage.getItem("frd_products_inventory_v7");
      const products = savedProducts ? JSON.parse(savedProducts) : INITIAL_PRODUCTS;
      return products.filter((p) => {
        const cat = (p.category || "").toLowerCase();
        const name = (p.name || "").toLowerCase();
        const target = categoryName.toLowerCase();

        if (target.includes("creatine")) return name.includes("creatine") || cat.includes("creatine");
        if (target.includes("bcaa")) return name.includes("bcaa") || name.includes("eaa") || cat.includes("bcaa");
        if (target.includes("mass") || target.includes("gainer")) return name.includes("mass") || name.includes("gainer") || cat.includes("mass");
        if (target.includes("pre workout")) return name.includes("pre") || cat.includes("pre");
        if (target.includes("post workout")) return name.includes("post") || cat.includes("post");
        if (target.includes("vitamin")) return name.includes("vitamin") || cat.includes("vitamin");
        return cat.includes(target) || name.includes(target);
      }).length;
    } catch (e) {
      return 0;
    }
  };

  const loadCategories = () => {
    const saved = localStorage.getItem("frd_admin_categories_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const nonDemo = parsed.filter(
            (c) => c && !["cat-1", "cat-2", "cat-3", "cat-4", "cat-5", "cat-6", "cat-7"].includes(c.id)
          );
          setCategories(nonDemo);
          localStorage.setItem("frd_admin_categories_v2", JSON.stringify(nonDemo));
          return;
        }
      } catch (e) {
        // ignore
      }
    }

    setCategories([]);
    localStorage.setItem("frd_admin_categories_v2", JSON.stringify([]));
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
                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                  {cat.description || "High performance nutritional supplement line."}
                </p>
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

              <div>
                <label className="block text-neutral-400 font-bold mb-1">
                  Description:
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of products in this category..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-3 text-white placeholder-neutral-600 focus:border-lime-500 focus:outline-none"
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
