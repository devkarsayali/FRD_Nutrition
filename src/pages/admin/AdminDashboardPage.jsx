import { useEffect, useState } from "react";
import { FiAlertCircle, FiBox, FiMessageSquare, FiShoppingBag } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useProducts, isCategoryMatch } from "../../context/ProductContext";
import AdminDoughnutChart from "../../components/admin/AdminDoughnutChart";
import { db } from "../../firebase/firebase.config";
import { collection, onSnapshot } from "firebase/firestore";

const COLOR_PALETTE = [
  "#84cc16", // Lime
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#a855f7", // Purple
  "#ec4899", // Magenta/Pink
  "#6366f1", // Indigo
  "#3b82f6", // Sky Blue
  "#10b981", // Emerald
  "#f43f5e", // Rose
  "#eab308", // Yellow
  "#8b5cf6", // Violet
];

export default function AdminDashboardPage({ onOpenAddModal }) {
  const { products } = useProducts();
  const { orders } = useCart();
  const [messagesCount, setMessagesCount] = useState(0);
  const [onlineOrdersCount, setOnlineOrdersCount] = useState(0);
  const [offlineOrdersCount, setOfflineOrdersCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [activeCategories, setActiveCategories] = useState([]);

  const updateCombinedOrdersCount = (onlineMap, offlineMap) => {
    const onlineSize = onlineMap.size;
    const offlineSize = offlineMap.size;
    setOnlineOrdersCount(onlineSize);
    setOfflineOrdersCount(offlineSize);
    setOrdersCount(onlineSize + offlineSize);
  };

  useEffect(() => {
    let currentOnlineMap = new Map();
    let currentOfflineMap = new Map();

    // 1. Subscribe to Firestore orders collection for online count
    const unsubOrders = onSnapshot(collection(db, "orders"), (snap) => {
      const onlineMap = new Map();
      snap.forEach((doc) => {
        onlineMap.set(doc.id, doc.data());
      });

      if (Array.isArray(orders)) {
        orders.forEach((o) => {
          if (o && o.id && !onlineMap.has(o.id)) {
            onlineMap.set(o.id, o);
          }
        });
      }

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.toLowerCase().includes("order") && !key.includes("offline")) {
          try {
            const parsed = JSON.parse(localStorage.getItem(key) || "[]");
            const list = Array.isArray(parsed) ? parsed : [parsed];
            list.forEach((o) => {
              if (o && o.id && !onlineMap.has(o.id)) {
                onlineMap.set(o.id, o);
              }
            });
          } catch (e) {}
        }
      }

      currentOnlineMap = onlineMap;
      updateCombinedOrdersCount(currentOnlineMap, currentOfflineMap);
    });

    // 1b. Subscribe to Firestore sales collection for offline count
    const unsubSales = onSnapshot(collection(db, "sales"), (snap) => {
      const offlineMap = new Map();
      snap.forEach((doc) => {
        offlineMap.set(doc.id, doc.data());
      });

      try {
        const savedOffline = JSON.parse(localStorage.getItem("frd_offline_sales_v1") || "[]");
        if (Array.isArray(savedOffline)) {
          savedOffline.forEach((item) => {
            if (item && item.id && !offlineMap.has(item.id)) {
              offlineMap.set(item.id, item);
            }
          });
        }
      } catch (e) {}

      currentOfflineMap = offlineMap;
      updateCombinedOrdersCount(currentOnlineMap, currentOfflineMap);
    });

    // 2. Subscribe to Firestore contact_messages collection for live count
    const unsubMsgs = onSnapshot(collection(db, "contact_messages"), (snap) => {
      let count = snap.size;
      try {
        const savedMsgs = JSON.parse(localStorage.getItem("frd_contact_messages") || "[]");
        if (savedMsgs.length > count) count = savedMsgs.length;
      } catch (e) {}
      setMessagesCount(count);
    });

    // 3. Subscribe to Firestore categories collection
    const unsubCats = onSnapshot(collection(db, "categories"), (snap) => {
      const catList = [];
      snap.forEach((doc) => {
        const d = doc.data();
        if (d.name) catList.push(d.name);
      });

      try {
        const savedCats = localStorage.getItem("frd_admin_categories_v2");
        if (savedCats) {
          const parsed = JSON.parse(savedCats);
          if (Array.isArray(parsed)) {
            parsed.forEach((c) => {
              if (c.name && !catList.includes(c.name)) catList.push(c.name);
            });
          }
        }
      } catch (e) {}

      setActiveCategories(Array.from(new Set(catList)));
    });

    const handleStorage = () => {
      // triggers re-evaluation if needed
    };
    window.addEventListener("frd_orders_updated", handleStorage);
    window.addEventListener("frd_contact_messages_updated", handleStorage);
    window.addEventListener("frd_categories_updated", handleStorage);
    window.addEventListener("storage", handleStorage);

    return () => {
      unsubOrders();
      if (typeof unsubSales === "function") unsubSales();
      unsubMsgs();
      unsubCats();
      window.removeEventListener("frd_orders_updated", handleStorage);
      window.removeEventListener("frd_sales_updated", handleStorage);
      window.removeEventListener("frd_contact_messages_updated", handleStorage);
      window.removeEventListener("frd_categories_updated", handleStorage);
      window.removeEventListener("storage", handleStorage);
    };
  }, [orders, products]);

  const totalProducts = products.length;
  const inStockCount = products.filter((p) => p.inStock).length;
  const outOfStockCount = products.filter((p) => !p.inStock).length;

  const getProductCategoryKey = (prod) => {
    if (!prod || !prod.category) return "Protein";
    const cat = prod.category.toLowerCase().trim();

    // Check match against activeCategories first
    const matched = activeCategories.find((c) => {
      const cLow = c.toLowerCase();
      return cat === cLow || cat.includes(cLow) || cLow.includes(cat);
    });

    if (matched) return matched;

    if (cat.includes("creatine")) return "Creatine";
    if (cat.includes("bcaa") || cat.includes("eaa")) return "BCAA";
    if (cat.includes("mass") || cat.includes("gainer")) return "Mass Gainer";
    if (cat.includes("pre workout") || cat.includes("pre-workout") || cat.includes("pump")) return "Pre Workout";
    if (cat.includes("post workout") || cat.includes("post-workout")) return "Post Workout";
    if (cat.includes("vitamin") || cat.includes("fat burner") || cat.includes("carnitine")) return "Vitamins";
    return activeCategories[0] || "Protein";
  };

  // Dynamic Product Categories Chart Data (Automatically includes any new categories added by admin)
  const categoryChartData = activeCategories.map((catName, idx) => ({
    label: catName,
    value: products.filter((p) => isCategoryMatch(p.category, catName)).length,
    color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
    link: `/admin/products?category=${encodeURIComponent(catName)}`,
  }));

  // Dynamic Stock Status Chart Data
  const stockChartData = [
    { label: "In Stock", value: inStockCount, color: "#10b981", link: "/admin/products?stock=instock" },
    { label: "Out of Stock", value: outOfStockCount, color: "#ef4444", link: "/admin/products?stock=outofstock" },
  ];

  return (
    <div className="space-y-8 text-white">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Card 1: Total Supplements */}
        <Link
          to="/admin/products"
          className="p-3.5 sm:p-6 rounded-2xl bg-[#141813] border border-neutral-800 space-y-1.5 sm:space-y-2 hover:border-lime-500/50 hover:bg-[#181e17] hover:scale-[1.02] transition-all duration-200 group cursor-pointer block shadow-lg"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs gap-1">
            <span className="truncate">Total Supplements</span>
            <FiBox className="text-lime-400 group-hover:scale-110 transition-transform shrink-0" size={18} />
          </div>
          <span className="font-heading font-black text-2xl sm:text-3xl text-white block">
            {totalProducts}
          </span>
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-neutral-500 group-hover:text-lime-400 transition-colors gap-1">
            <span className="truncate">Live on storefront</span>
            <span className="font-bold flex items-center gap-0.5 shrink-0">Manage →</span>
          </div>
        </Link>

        {/* Card 2: Out of Stock Alerts */}
        <Link
          to="/admin/products?stock=outofstock"
          className="p-3.5 sm:p-6 rounded-2xl bg-[#141813] border border-neutral-800 space-y-1.5 sm:space-y-2 hover:border-red-500/50 hover:bg-[#1f1717] hover:scale-[1.02] transition-all duration-200 group cursor-pointer block shadow-lg"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs gap-1">
            <span className="truncate">Out of Stock Alerts</span>
            <FiAlertCircle className="text-red-400 group-hover:scale-110 transition-transform shrink-0" size={18} />
          </div>
          <span className="font-heading font-black text-2xl sm:text-3xl text-white block">
            {outOfStockCount}
          </span>
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-neutral-500 group-hover:text-red-400 transition-colors gap-1">
            <span className="truncate">Requires restocking</span>
            <span className="font-bold flex items-center gap-0.5 shrink-0"><span className="hidden sm:inline">Filter Out of Stock</span><span className="sm:hidden">Filter</span> →</span>
          </div>
        </Link>

        {/* Card 3: Customer Orders */}
        <Link
          to="/admin/orders"
          className="p-3.5 sm:p-6 rounded-2xl bg-[#141813] border border-neutral-800 space-y-1.5 sm:space-y-2 hover:border-blue-500/50 hover:bg-[#171b22] hover:scale-[1.02] transition-all duration-200 group cursor-pointer block shadow-lg"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs gap-1">
            <span className="truncate">Customer Orders</span>
            <FiShoppingBag className="text-blue-400 group-hover:scale-110 transition-transform shrink-0" size={18} />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-heading font-black text-2xl sm:text-3xl text-white block">
              {ordersCount}
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">
              🌐 {onlineOrdersCount} | 🏪 {offlineOrdersCount}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-neutral-500 group-hover:text-blue-400 transition-colors gap-1">
            <span className="truncate">Online ({onlineOrdersCount}) & Offline ({offlineOrdersCount})</span>
            <span className="font-bold flex items-center gap-0.5 shrink-0"><span className="hidden sm:inline">View Orders</span><span className="sm:hidden">View</span> →</span>
          </div>
        </Link>

        {/* Card 4: Contact Messages */}
        <Link
          to="/admin/messages"
          className="p-3.5 sm:p-6 rounded-2xl bg-[#141813] border border-neutral-800 space-y-1.5 sm:space-y-2 hover:border-purple-500/50 hover:bg-[#1a1722] hover:scale-[1.02] transition-all duration-200 group cursor-pointer block shadow-lg"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs gap-1">
            <span className="truncate">Contact Messages</span>
            <FiMessageSquare className="text-purple-400 group-hover:scale-110 transition-transform shrink-0" size={18} />
          </div>
          <span className="font-heading font-black text-2xl sm:text-3xl text-white block">
            {messagesCount}
          </span>
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-neutral-500 group-hover:text-purple-400 transition-colors gap-1">
            <span className="truncate">Customer inquiries</span>
            <span className="font-bold flex items-center gap-0.5 shrink-0"><span className="hidden sm:inline">View Messages</span><span className="sm:hidden">View</span> →</span>
          </div>
        </Link>
      </div>

      {/* Analytics Doughnut Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <AdminDoughnutChart
          title="Product Categories Breakdown"
          subtitle="Dynamic distribution of supplements across catalog categories"
          data={categoryChartData}
          centerLabel="Total Catalog"
          centerValue={totalProducts}
          unit="Supplements"
        />

        <AdminDoughnutChart
          title="Stock Availability Status"
          subtitle="Live proportion of In-Stock vs Out-Of-Stock inventory"
          data={stockChartData}
          centerLabel="Available"
          centerValue={inStockCount}
          unit="In Stock"
        />
      </div>

      {/* Quick Recent Inventory Preview */}
      <div className="bg-[#141813] border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-black text-white">
            Quick Inventory Overview
          </h2>
          <Link
            to="/admin/products"
            className="text-xs font-bold text-lime-400 hover:text-lime-300 transition"
          >
            Go to Full Inventory Management →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-left text-xs text-neutral-300">
            <thead className="bg-neutral-900 text-neutral-400 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="p-3">Product Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {products.slice(0, 5).map((prod) => (
                <tr key={prod.id} className="hover:bg-neutral-900/50">
                  <td className="p-3 font-bold text-white flex items-center gap-2">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-8 h-8 object-contain rounded bg-neutral-950 p-1"
                    />
                    <span className="truncate max-w-xs">{prod.name}</span>
                  </td>
                  <td className="p-3 font-semibold text-lime-400">{prod.category}</td>
                  <td className="p-3 font-bold text-white">₹{prod.price}</td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${prod.inStock
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                    >
                      {prod.inStock ? `${prod.stockQuantity} in stock` : "Out of Stock (0)"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
