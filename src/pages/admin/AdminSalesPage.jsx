import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiDollarSign,
  FiEdit,
  FiFilter,
  FiPlus,
  FiSearch,
  FiShoppingBag,
  FiTrash2,
  FiTrendingUp,
  FiEye,
  FiX,
  FiArrowRight,
} from "react-icons/fi";
import { useCart } from "../../context/CartContext";
import { useProducts } from "../../context/ProductContext";
import AddOfflineSaleModal from "../../components/admin/AddOfflineSaleModal";
import toast from "react-hot-toast";
import { db } from "../../firebase/firebase.config";
import { collection, doc, deleteDoc, onSnapshot } from "firebase/firestore";

const COLOR_PALETTE = [
  "#84cc16", // Lime
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#a855f7", // Purple
  "#ec4899", // Magenta/Pink
  "#6366f1", // Indigo
  "#3b82f6", // Sky Blue
  "#10b981", // Emerald
];

// Helper component for rendering high-end SVG Area & Line charts
function PremiumAreaChart({
  title,
  subtitle,
  badgeText,
  badgeColorClass,
  data = [],
  dataKey = "revenue",
  valuePrefix = "₹",
  valueSuffix = "",
  strokeColor = "#84cc16",
  gradientId = "limeGradient",
  gradientFrom = "#84cc16",
  gradientTo = "#84cc1600",
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const values = data.map((d) => Number(d[dataKey]) || 0);
  const maxVal = Math.max(...values, 10);
  const minVal = 0;

  // Chart dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const padLeft = 55;
  const padRight = 25;
  const padTop = 30;
  const padBottom = 35;

  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  const points = data.map((d, i) => {
    const x =
      data.length > 1
        ? padLeft + (i / (data.length - 1)) * chartWidth
        : padLeft + chartWidth / 2;
    const val = Number(d[dataKey]) || 0;
    const y = padTop + chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight;
    return { x, y, val, label: d.dateKey };
  });

  // Construct SVG path string for smooth area & line
  const buildSmoothPath = (pts) => {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const current = pts[i];
      const next = pts[i + 1];
      const controlX = (current.x + next.x) / 2;
      path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
    }
    return path;
  };

  const linePathD = buildSmoothPath(points);

  const areaPathD =
    points.length > 0
      ? `${linePathD} L ${points[points.length - 1].x} ${svgHeight - padBottom} L ${points[0].x} ${svgHeight - padBottom} Z`
      : "";

  // Grid Y ticks
  const yTicks = [0, 0.33, 0.66, 1].map((pct) => ({
    val: Math.round(minVal + pct * (maxVal - minVal)),
    y: padTop + chartHeight - pct * chartHeight,
  }));

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="p-5 rounded-3xl bg-[#141813] border border-neutral-800 space-y-4 shadow-xl relative overflow-hidden flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
        <div>
          <h3 className="font-heading text-base font-bold text-white">{title}</h3>
          <p className="text-[11px] text-neutral-400 mt-0.5">{subtitle}</p>
        </div>
        <span
          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badgeColorClass}`}
        >
          {badgeText}
        </span>
      </div>

      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-xs text-neutral-500">
          No transactions recorded for the selected filter period.
        </div>
      ) : (
        <div className="relative w-full overflow-hidden select-none">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={gradientFrom} stopOpacity="0.4" />
                <stop offset="100%" stopColor={gradientTo} stopOpacity="0.0" />
              </linearGradient>

              <filter id={`glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Horizontal Grid Lines & Y Axis Labels */}
            {yTicks.map((tick, idx) => (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={tick.y}
                  x2={svgWidth - padRight}
                  y2={tick.y}
                  stroke="#262f25"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 10}
                  y={tick.y + 4}
                  fill="#737373"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="end"
                >
                  {valuePrefix}
                  {tick.val.toLocaleString("en-IN")}
                </text>
              </g>
            ))}

            {/* Gradient Area Fill */}
            <path d={areaPathD} fill={`url(#${gradientId})`} />

            {/* Smooth Glowing Line */}
            <path
              d={linePathD}
              fill="none"
              stroke={strokeColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#glow-${gradientId})`}
            />

            {/* Data Points & X Axis Date Labels */}
            {points.map((pt, idx) => {
              const isHovered = hoveredIdx === idx;
              return (
                <g key={idx}>
                  {/* X Axis Date Label */}
                  <text
                    x={pt.x}
                    y={svgHeight - 10}
                    fill={isHovered ? "#ffffff" : "#a3a3a3"}
                    fontSize="10"
                    fontWeight={isHovered ? "bold" : "normal"}
                    textAnchor="middle"
                  >
                    {pt.label}
                  </text>

                  {/* Vertical Guide Line on Hover */}
                  {isHovered && (
                    <line
                      x1={pt.x}
                      y1={padTop}
                      x2={pt.x}
                      y2={svgHeight - padBottom}
                      stroke={strokeColor}
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                      opacity="0.6"
                    />
                  )}

                  {/* Circle Point */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? "6" : "4"}
                    fill="#141813"
                    stroke={strokeColor}
                    strokeWidth={isHovered ? "3" : "2"}
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                </g>
              );
            })}
          </svg>

          {/* Interactive Floating Tooltip */}
          {activePoint && (
            <div
              className="absolute pointer-events-none bg-neutral-950/95 border rounded-xl px-3 py-1.5 shadow-2xl z-20 transition-all text-xs"
              style={{
                borderColor: strokeColor,
                left: `${(activePoint.x / svgWidth) * 100}%`,
                top: `${(activePoint.y / svgHeight) * 100}%`,
                transform: "translate(-50%, -125%)",
              }}
            >
              <span className="text-[10px] font-bold text-neutral-400 block uppercase">
                {activePoint.label}
              </span>
              <span className="font-heading font-black text-sm block" style={{ color: strokeColor }}>
                {valuePrefix}
                {activePoint.val.toLocaleString("en-IN")}
                {valueSuffix}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminSalesPage() {
  const navigate = useNavigate();
  const { products, restoreProductStock } = useProducts();
  const { orders: cartContextOrders } = useCart();

  const scrollToTable = () => {
    document.getElementById("sales-transactions-table")?.scrollIntoView({ behavior: "smooth" });
  };

  // Firestore & Unified State
  const [firestoreOrders, setFirestoreOrders] = useState([]);
  const [offlineSales, setOfflineSales] = useState([]);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState(null);

  // Filters State
  const [dateFilter, setDateFilter] = useState("this_month"); // "today", "yesterday", "this_week", "this_month", "this_year", "custom"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saleTypeFilter, setSaleTypeFilter] = useState("all"); // "all", "online", "offline"
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Lock background body scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen = Boolean(selectedSaleDetail) || Boolean(isAddModalOpen);
    if (isAnyModalOpen) {
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
  }, [selectedSaleDetail, isAddModalOpen]);

  // 1. Live Listener for Firestore `orders` (Online Sales)
  useEffect(() => {
    let unsub = () => { };
    try {
      unsub = onSnapshot(collection(db, "orders"), (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setFirestoreOrders(list);
      });
    } catch (e) {
      console.warn("Firestore orders listener warning:", e);
    }
    return () => unsub();
  }, []);

  // 2. Live Listener for Firestore `sales` (Offline Sales)
  useEffect(() => {
    const loadLocalStorageOfflineSales = () => {
      try {
        const saved = JSON.parse(localStorage.getItem("frd_offline_sales_v1") || "[]");
        return Array.isArray(saved) ? saved : [];
      } catch {
        return [];
      }
    };

    let unsub = () => { };
    try {
      unsub = onSnapshot(collection(db, "sales"), (snapshot) => {
        const fbOffline = [];
        snapshot.forEach((docSnap) => {
          fbOffline.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Merge with localStorage fallback
        const localOffline = loadLocalStorageOfflineSales();
        const map = new Map();
        fbOffline.forEach((item) => map.set(item.id, item));
        localOffline.forEach((item) => {
          if (!map.has(item.id)) map.set(item.id, item);
        });

        const merged = Array.from(map.values());
        setOfflineSales(merged);
        localStorage.setItem("frd_offline_sales_v1", JSON.stringify(merged));
      });
    } catch (e) {
      setOfflineSales(loadLocalStorageOfflineSales());
    }

    const handleUpdate = () => {
      setOfflineSales(loadLocalStorageOfflineSales());
    };
    window.addEventListener("frd_sales_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      unsub();
      window.removeEventListener("frd_sales_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Combine and normalize all sales transactions (Online + Offline)
  const allSalesTransactions = useMemo(() => {
    const CANCELLED_STATUSES = ["cancelled", "rejected", "refunded", "returned"];
    const transactions = [];

    // 1. Process Online Website Orders
    const orderMap = new Map();
    firestoreOrders.forEach((o) => {
      if (o && o.id) orderMap.set(o.id, o);
    });
    if (Array.isArray(cartContextOrders)) {
      cartContextOrders.forEach((o) => {
        if (o && o.id && !orderMap.has(o.id)) orderMap.set(o.id, o);
      });
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.toLowerCase().includes("order")) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key) || "[]");
          const list = Array.isArray(parsed) ? parsed : [parsed];
          list.forEach((o) => {
            if (o && o.id && !orderMap.has(o.id)) orderMap.set(o.id, o);
          });
        } catch (e) { }
      }
    }

    Array.from(orderMap.values()).forEach((order) => {
      const status = (order.status || "").toLowerCase().trim();
      if (CANCELLED_STATUSES.some((st) => status.includes(st))) return;

      const items = Array.isArray(order.items)
        ? order.items.map((it) => ({
          productId: it.productId || it.product?.id || it.id,
          name: it.name || it.product?.name || "Supplement",
          category: it.category || it.product?.category || "Supplements",
          price: Number(it.price || it.product?.price) || 0,
          quantity: Number(it.quantity) || 1,
          itemDiscount: 0,
          total: (Number(it.price || it.product?.price) || 0) * (Number(it.quantity) || 1),
          image: it.image || it.product?.image || "",
        }))
        : [];

      const totalQuantity = items.reduce((acc, it) => acc + it.quantity, 0);
      const rawTotal = Number(order.totalAmount || order.total || order.subtotal) || 0;
      const discount = Number(order.discount || order.discountAmount) || 0;
      const finalAmount = rawTotal > 0 ? rawTotal : items.reduce((a, b) => a + b.total, 0);

      const custName =
        order.customer?.name ||
        order.shippingAddress?.fullName ||
        order.userEmail?.split("@")[0] ||
        "Online Customer";
      const custPhone =
        order.customer?.phone ||
        order.shippingAddress?.phone ||
        order.phone ||
        "N/A";

      const pmRaw = String(order.paymentMethod || "").toLowerCase();
      const paymentMethod = pmRaw.includes("cod") || pmRaw.includes("cash")
        ? "Cash on Delivery"
        : "Online / Prepaid";

      const dateObj = order.createdAt
        ? new Date(order.createdAt)
        : order.orderDate
          ? new Date(order.orderDate)
          : new Date();

      transactions.push({
        id: order.id,
        saleType: "online",
        customer: { name: custName, phone: custPhone },
        items,
        totalQuantity,
        subtotal: finalAmount + discount,
        discount,
        totalAmount: finalAmount,
        paymentMethod,
        saleDate: dateObj.toISOString(),
        status: order.status || "Completed",
        originalOrder: order,
      });
    });

    // 2. Process Offline Physical Store Sales
    offlineSales.forEach((sale) => {
      const items = Array.isArray(sale.items)
        ? sale.items.map((it) => ({
          productId: it.productId,
          name: it.name,
          category: it.category || "Supplements",
          price: Number(it.price) || 0,
          quantity: Number(it.quantity) || 1,
          itemDiscount: Number(it.itemDiscount) || 0,
          total: Number(it.total) || (Number(it.price) * Number(it.quantity)),
          image: it.image || "",
        }))
        : [];

      const totalQuantity = Number(sale.totalQuantity) || items.reduce((a, b) => a + b.quantity, 0);
      const dateObj = sale.saleDate ? new Date(sale.saleDate) : new Date();

      transactions.push({
        id: sale.id,
        saleType: "offline",
        customer: {
          name: sale.customer?.name || "Walk-in Customer",
          phone: sale.customer?.phone || "N/A",
        },
        items,
        totalQuantity,
        subtotal: Number(sale.subtotal) || Number(sale.totalAmount) || 0,
        discount: Number(sale.discount) || 0,
        totalAmount: Number(sale.totalAmount) || 0,
        paymentMethod: sale.paymentMethod || "Cash",
        saleDate: dateObj.toISOString(),
        notes: sale.notes || "",
        status: sale.status || "Completed",
        originalSale: sale,
      });
    });

    return transactions.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
  }, [firestoreOrders, cartContextOrders, offlineSales]);

  // Helper date matchers
  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const getWeekRange = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diffToMon));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
  };

  // Dashboard Metrics Calculation
  const metrics = useMemo(() => {
    const now = new Date();
    const weekRange = getWeekRange(now);

    let todaySales = 0;
    let todayProducts = 0;
    let weekSales = 0;
    let weekProducts = 0;
    let monthSales = 0;
    let monthProducts = 0;
    let yearSales = 0;
    let yearProducts = 0;

    let onlineSalesTotal = 0;
    let offlineSalesTotal = 0;
    let totalRevenue = 0;

    allSalesTransactions.forEach((tx) => {
      const txDate = new Date(tx.saleDate);
      const amount = Number(tx.totalAmount) || 0;
      const units = Number(tx.totalQuantity) || 0;

      if (tx.saleType === "online") {
        onlineSalesTotal += amount;
      } else {
        offlineSalesTotal += amount;
      }
      totalRevenue += amount;

      if (isSameDay(txDate, now)) {
        todaySales += amount;
        todayProducts += units;
      }

      if (txDate >= weekRange.start && txDate <= weekRange.end) {
        weekSales += amount;
        weekProducts += units;
      }

      if (txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth()) {
        monthSales += amount;
        monthProducts += units;
      }

      if (txDate.getFullYear() === now.getFullYear()) {
        yearSales += amount;
        yearProducts += units;
      }
    });

    return {
      todaySales,
      todayProducts,
      weekSales,
      weekProducts,
      monthSales,
      monthProducts,
      yearSales,
      yearProducts,
      onlineSalesTotal,
      offlineSalesTotal,
      totalRevenue,
      totalTransactions: allSalesTransactions.length,
    };
  }, [allSalesTransactions]);

  // Date & Type Filtered Transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();

    return allSalesTransactions.filter((tx) => {
      const txDate = new Date(tx.saleDate);

      if (saleTypeFilter === "online" && tx.saleType !== "online") return false;
      if (saleTypeFilter === "offline" && tx.saleType !== "offline") return false;

      if (dateFilter === "today") {
        if (!isSameDay(txDate, now)) return false;
      } else if (dateFilter === "yesterday") {
        const yest = new Date(now);
        yest.setDate(now.getDate() - 1);
        if (!isSameDay(txDate, yest)) return false;
      } else if (dateFilter === "this_week") {
        const weekRange = getWeekRange(now);
        if (txDate < weekRange.start || txDate > weekRange.end) return false;
      } else if (dateFilter === "this_month") {
        if (txDate.getFullYear() !== now.getFullYear() || txDate.getMonth() !== now.getMonth())
          return false;
      } else if (dateFilter === "this_year") {
        if (txDate.getFullYear() !== now.getFullYear()) return false;
      } else if (dateFilter === "custom") {
        if (startDate) {
          const s = new Date(startDate);
          s.setHours(0, 0, 0, 0);
          if (txDate < s) return false;
        }
        if (endDate) {
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          if (txDate > e) return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const custName = (tx.customer?.name || "").toLowerCase();
        const custPhone = (tx.customer?.phone || "").toLowerCase();
        const saleId = (tx.id || "").toLowerCase();
        const itemNames = tx.items.map((i) => (i.name || "").toLowerCase()).join(" ");

        if (!custName.includes(q) && !custPhone.includes(q) && !saleId.includes(q) && !itemNames.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [allSalesTransactions, saleTypeFilter, dateFilter, startDate, endDate, searchQuery]);

  // Paginated Table Data
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  // ----------------------------------------------------
  // CHARTS DATA CALCULATIONS (From filteredTransactions)
  // ----------------------------------------------------

  // 1 & 2: Daily Sales Revenue & Products Sold Over Time Chart Data
  const dailyTrendsData = useMemo(() => {
    const map = new Map();

    filteredTransactions.forEach((tx) => {
      const d = new Date(tx.saleDate);
      const dateKey = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const current = map.get(dateKey) || { dateKey, revenue: 0, units: 0 };
      map.set(dateKey, {
        dateKey,
        revenue: current.revenue + Number(tx.totalAmount),
        units: current.units + Number(tx.totalQuantity),
      });
    });

    const arr = Array.from(map.values()).reverse().slice(0, 10).reverse();
    return arr;
  }, [filteredTransactions]);

  // Delete Offline Sale Handler
  const handleDeleteOfflineSale = async (sale) => {
    if (sale.saleType !== "offline") {
      toast.error("Online website orders cannot be deleted from offline POS. Manage in Customer Orders.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete offline sale #${sale.id}? This will restore the product stock.`)) {
      return;
    }

    try {
      if (Array.isArray(sale.items)) {
        restoreProductStock(sale.items);
      }

      await deleteDoc(doc(db, "sales", sale.id));

      try {
        const saved = JSON.parse(localStorage.getItem("frd_offline_sales_v1") || "[]");
        const updated = saved.filter((s) => s.id !== sale.id);
        localStorage.setItem("frd_offline_sales_v1", JSON.stringify(updated));
      } catch (e) { }

      window.dispatchEvent(new CustomEvent("frd_sales_updated"));
      toast.success(`Offline sale #${sale.id} deleted and stock restored successfully!`);
    } catch (err) {
      console.error("Error deleting offline sale:", err);
      toast.error("Failed to delete offline sale.");
    }
  };

  const handleEditOfflineSale = (sale) => {
    if (sale.saleType !== "offline") {
      toast.error("Online orders cannot be edited in POS. Use Customer Orders tab.");
      return;
    }
    setEditingSale(sale.originalSale || sale);
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-8 text-white">
      {/* Top Header Bar & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
              Sales Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-lime-500/10 border border-lime-500/30 text-lime-400 text-[10px] font-black uppercase">
              Unified Reporting
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Complete sales overview combining Online Website Orders &amp; Physical Store/Gym Sales
          </p>
        </div>

        <button
          onClick={() => {
            setEditingSale(null);
            setIsAddModalOpen(true);
          }}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-lime-500 text-neutral-950 font-black hover:bg-lime-400 transition cursor-pointer flex items-center justify-center gap-2 text-xs shadow-lg shadow-lime-500/20 uppercase tracking-wider"
        >
          <FiPlus size={18} />
          <span>Add Offline Store Sale</span>
        </button>
      </div>

      {/* SUMMARY METRIC CARDS GRID (CLICKABLE TO OPEN SECTION OR FILTER) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Today's Sales */}
        <button
          type="button"
          onClick={() => {
            setDateFilter("today");
            setSaleTypeFilter("all");
            setCurrentPage(1);
            scrollToTable();
          }}
          className={`p-5 rounded-3xl text-left space-y-3 shadow-xl transition-all cursor-pointer transform hover:-translate-y-1 active:translate-y-0 ${dateFilter === "today" && saleTypeFilter === "all"
              ? "bg-[#141813] border-2 border-lime-500 shadow-lime-500/10"
              : "bg-[#141813] border border-neutral-800 hover:border-lime-500/50"
            }`}
          title="Click to view Today's sales log"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-semibold text-neutral-300">Today's Sales</span>
            <span className="w-8 h-8 rounded-xl bg-lime-500/10 text-lime-400 flex items-center justify-center font-bold">
              ₹
            </span>
          </div>
          <div>
            <span className="font-heading font-black text-2xl text-white block">
              ₹{metrics.todaySales.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] font-bold text-lime-400">
              {metrics.todayProducts} products sold today
            </span>
          </div>
        </button>

        {/* Weekly Sales */}
        <button
          type="button"
          onClick={() => {
            setDateFilter("this_week");
            setSaleTypeFilter("all");
            setCurrentPage(1);
            scrollToTable();
          }}
          className={`p-5 rounded-3xl text-left space-y-3 shadow-xl transition-all cursor-pointer transform hover:-translate-y-1 active:translate-y-0 ${dateFilter === "this_week" && saleTypeFilter === "all"
              ? "bg-[#141813] border-2 border-amber-500 shadow-amber-500/10"
              : "bg-[#141813] border border-neutral-800 hover:border-amber-500/50"
            }`}
          title="Click to view This Week's sales log"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-semibold text-neutral-300">This Week's Sales</span>
            <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <FiTrendingUp size={16} />
            </span>
          </div>
          <div>
            <span className="font-heading font-black text-2xl text-white block">
              ₹{metrics.weekSales.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] font-bold text-amber-400">
              {metrics.weekProducts} products sold this week
            </span>
          </div>
        </button>

        {/* Monthly Sales */}
        <button
          type="button"
          onClick={() => {
            setDateFilter("this_month");
            setSaleTypeFilter("all");
            setCurrentPage(1);
            scrollToTable();
          }}
          className={`p-5 rounded-3xl text-left space-y-3 shadow-xl transition-all cursor-pointer transform hover:-translate-y-1 active:translate-y-0 ${dateFilter === "this_month" && saleTypeFilter === "all"
              ? "bg-[#141813] border-2 border-cyan-500 shadow-cyan-500/10"
              : "bg-[#141813] border border-neutral-800 hover:border-cyan-500/50"
            }`}
          title="Click to view This Month's sales log"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-semibold text-neutral-300">This Month's Sales</span>
            <span className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
              <FiCalendar size={16} />
            </span>
          </div>
          <div>
            <span className="font-heading font-black text-2xl text-white block">
              ₹{metrics.monthSales.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] font-bold text-cyan-400">
              {metrics.monthProducts} products sold this month
            </span>
          </div>
        </button>

        {/* Yearly Sales */}
        <button
          type="button"
          onClick={() => {
            setDateFilter("this_year");
            setSaleTypeFilter("all");
            setCurrentPage(1);
            scrollToTable();
          }}
          className={`p-5 rounded-3xl text-left space-y-3 shadow-xl transition-all cursor-pointer transform hover:-translate-y-1 active:translate-y-0 ${dateFilter === "this_year" && saleTypeFilter === "all"
              ? "bg-[#141813] border-2 border-purple-500 shadow-purple-500/10"
              : "bg-[#141813] border border-neutral-800 hover:border-purple-500/50"
            }`}
          title="Click to view This Year's sales log"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-semibold text-neutral-300">This Year's Sales</span>
            <span className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
              <FiDollarSign size={16} />
            </span>
          </div>
          <div>
            <span className="font-heading font-black text-2xl text-white block">
              ₹{metrics.yearSales.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] font-bold text-purple-400">
              {metrics.yearProducts} products sold this year
            </span>
          </div>
        </button>
      </div>

      {/* Online vs Offline & Grand Total Revenue Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Online Revenue Card -> OPENS CUSTOMER ORDERS PAGE */}
        <button
          type="button"
          onClick={() => navigate("/admin/orders")}
          className="p-5 rounded-3xl text-left space-y-2 transition-all cursor-pointer transform hover:-translate-y-1 active:translate-y-0 bg-neutral-900/90 border border-neutral-800 hover:border-blue-500/50 group"
          title="Click to open Customer Orders Page"
        >
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1.5 font-bold text-neutral-300 group-hover:text-blue-400 transition">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span>Online Website Revenue</span>
            </span>
            <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
              <span>
                {metrics.totalRevenue > 0
                  ? ((metrics.onlineSalesTotal / metrics.totalRevenue) * 100).toFixed(1)
                  : 0}%
              </span>
              <FiArrowRight size={10} className="group-hover:translate-x-0.5 transition" />
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-heading font-black text-2xl text-blue-400 block">
              ₹{metrics.onlineSalesTotal.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-blue-400 font-bold underline opacity-0 group-hover:opacity-100 transition">
              View Orders Page →
            </span>
          </div>
        </button>

        {/* Offline Store Revenue Card -> FILTERS OFFLINE TRANSACTIONS & SCROLLS */}
        <button
          type="button"
          onClick={() => {
            setSaleTypeFilter("offline");
            setCurrentPage(1);
            scrollToTable();
          }}
          className={`p-5 rounded-3xl text-left space-y-2 transition-all cursor-pointer transform hover:-translate-y-1 active:translate-y-0 ${saleTypeFilter === "offline"
              ? "bg-neutral-900 border-2 border-lime-500 shadow-lime-500/10"
              : "bg-neutral-900/90 border border-neutral-800 hover:border-lime-500/50"
            }`}
          title="Click to view Offline Store Sales"
        >
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1.5 font-bold text-neutral-300">
              <span className="w-2.5 h-2.5 rounded-full bg-lime-500"></span>
              <span>Offline Store Revenue</span>
            </span>
            <span className="text-[10px] font-mono bg-lime-500/10 text-lime-400 px-2 py-0.5 rounded-full border border-lime-500/20">
              {metrics.totalRevenue > 0
                ? ((metrics.offlineSalesTotal / metrics.totalRevenue) * 100).toFixed(1)
                : 0}%
            </span>
          </div>
          <span className="font-heading font-black text-2xl text-lime-400 block">
            ₹{metrics.offlineSalesTotal.toLocaleString("en-IN")}
          </span>
        </button>

        {/* Grand Total Revenue Card */}
        <button
          type="button"
          onClick={() => {
            setSaleTypeFilter("all");
            setDateFilter("this_month");
            setCurrentPage(1);
            scrollToTable();
          }}
          className={`p-5 rounded-3xl text-left space-y-2 transition-all cursor-pointer transform hover:-translate-y-1 active:translate-y-0 ${saleTypeFilter === "all"
              ? "bg-gradient-to-r from-lime-500/20 via-neutral-900 to-amber-500/20 border-2 border-lime-500 shadow-lime-500/10"
              : "bg-gradient-to-r from-lime-500/10 via-neutral-900 to-amber-500/10 border border-lime-500/30 hover:border-lime-500"
            }`}
          title="Click to view All Sales Log"
        >
          <div className="flex items-center justify-between text-xs text-neutral-300">
            <span className="font-bold">Grand Total Revenue</span>
            <span className="text-[10px] text-lime-400 font-extrabold uppercase tracking-wider">
              {metrics.totalTransactions} Transactions
            </span>
          </div>
          <span className="font-heading font-black text-2xl text-white block">
            ₹{metrics.totalRevenue.toLocaleString("en-IN")}
          </span>
        </button>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="p-5 rounded-3xl bg-[#141813] border border-neutral-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <span className="text-xs font-black uppercase tracking-wider text-lime-400 flex items-center gap-2">
            <FiFilter size={14} />
            <span>Sales Reporting Filters</span>
          </span>
          <span className="text-[11px] font-semibold text-neutral-400">
            Showing {filteredTransactions.length} of {allSalesTransactions.length} transactions
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Date Filter */}
          <div>
            <label className="block text-neutral-400 font-bold mb-1">Date Period</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-lime-500"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Custom Date Pickers */}
          {dateFilter === "custom" ? (
            <div className="flex items-center gap-2 col-span-1">
              <div>
                <label className="block text-neutral-400 font-bold mb-1">From</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 font-bold mb-1">To</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-2 text-white"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-neutral-400 font-bold mb-1">Sale Channel</label>
              <select
                value={saleTypeFilter}
                onChange={(e) => setSaleTypeFilter(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-lime-500"
              >
                <option value="all">All Sales (Online + Offline)</option>
                <option value="online">Online Orders Only</option>
                <option value="offline">Offline Physical Store Only</option>
              </select>
            </div>
          )}

          {/* Search Box */}
          <div className={dateFilter === "custom" ? "lg:col-span-2" : "lg:col-span-2"}>
            <label className="block text-neutral-400 font-bold mb-1">Search Transactions</label>
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-3 text-neutral-500" size={15} />
              <input
                type="text"
                placeholder="Search by customer name, phone, order ID, product..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-lime-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* PREMIUM AREA & LINE CHARTS GRID (6 CHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Daily Sales Revenue Trend (Smooth Area Chart) */}
        <PremiumAreaChart
          title="Daily Sales Revenue (₹)"
          subtitle="Smooth area trajectory of daily revenue generation"
          badgeText="Revenue Trajectory"
          badgeColorClass="bg-lime-500/10 text-lime-400 border-lime-500/30"
          data={dailyTrendsData}
          dataKey="revenue"
          valuePrefix="₹"
          strokeColor="#84cc16"
          gradientId="limeRevGradient"
          gradientFrom="#84cc16"
          gradientTo="#84cc1600"
        />

        {/* Chart 2: Products Sold Over Time (Smooth Area Chart) */}
        <PremiumAreaChart
          title="Products Sold Over Time (Units)"
          subtitle="Volume of supplement product units sold daily"
          badgeText="Unit Volume"
          badgeColorClass="bg-amber-500/10 text-amber-400 border-amber-500/30"
          data={dailyTrendsData}
          dataKey="units"
          valuePrefix=""
          valueSuffix=" Units"
          strokeColor="#f59e0b"
          gradientId="amberUnitsGradient"
          gradientFrom="#f59e0b"
          gradientTo="#f59e0b00"
        />
      </div>

      {/* SALES TRANSACTIONS TABLE */}
      <div id="sales-transactions-table" className="bg-[#141813] border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
              <span>Sales Transactions Log</span>
              <span className="text-xs text-neutral-400 font-normal">
                ({filteredTransactions.length} records)
              </span>
            </h2>
            <p className="text-xs text-neutral-400">
              Full log of online orders and offline physical store transactions
            </p>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-xs text-neutral-300">
            <thead className="bg-neutral-900 text-neutral-400 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="p-3">Date / Time</th>
                <th className="p-3">Sale ID</th>
                <th className="p-3">Type</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Products Purchased</th>
                <th className="p-3 text-center">Qty</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-neutral-500 text-xs">
                    No sales transactions found matching selected filters.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => {
                  const d = new Date(tx.saleDate);
                  const dateStr = d.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  const timeStr = d.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr key={tx.id} className="hover:bg-neutral-900/50 transition">
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-bold text-white block">{dateStr}</span>
                        <span className="text-[10px] text-neutral-400 block">{timeStr}</span>
                      </td>

                      <td className="p-3 font-mono font-bold text-neutral-300 whitespace-nowrap">
                        #{tx.id}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        {tx.saleType === "online" ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Online Order
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-lime-500/10 text-lime-400 border border-lime-500/20">
                            Offline ORDER
                          </span>
                        )}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span className="font-bold text-white block">{tx.customer?.name}</span>
                        <span className="text-[10px] text-neutral-400 block">{tx.customer?.phone}</span>
                      </td>

                      <td className="p-3">
                        <div className="space-y-1 max-w-xs">
                          {tx.items.map((it, idx) => (
                            <span key={idx} className="block text-[11px] truncate text-neutral-300">
                              • <strong className="text-white">{it.name}</strong> × {it.quantity} (₹{it.price})
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-3 text-center font-bold text-lime-400 font-mono">
                        {tx.totalQuantity}
                      </td>

                      <td className="p-3 whitespace-nowrap font-bold text-neutral-300">
                        {tx.paymentMethod}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span className="font-heading font-black text-sm text-lime-400 block">
                          ₹{tx.totalAmount.toLocaleString("en-IN")}
                        </span>
                        {tx.discount > 0 && (
                          <span className="text-[10px] text-amber-400 font-semibold block">
                            Disc: ₹{tx.discount}
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedSaleDetail(tx)}
                            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer"
                            title="View Full Details"
                          >
                            <FiEye size={15} />
                          </button>

                          {tx.saleType === "offline" && (
                            <>
                              <button
                                onClick={() => handleEditOfflineSale(tx)}
                                className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-lime-400 hover:text-lime-300 transition cursor-pointer"
                                title="Edit Offline Sale"
                              >
                                <FiEdit size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteOfflineSale(tx)}
                                className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-red-400 hover:text-red-300 transition cursor-pointer"
                                title="Delete Offline Sale & Restore Stock"
                              >
                                <FiTrash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-800 pt-4 text-xs text-neutral-400">
            <span>
              Page <strong className="text-white">{currentPage}</strong> of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 disabled:opacity-40 text-neutral-300 hover:text-white cursor-pointer"
              >
                <FiChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 disabled:opacity-40 text-neutral-300 hover:text-white cursor-pointer"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Offline Sale Modal Drawer */}
      {isAddModalOpen && (
        <AddOfflineSaleModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingSale(null);
          }}
          editingSale={editingSale}
        />
      )}

      {/* Transaction Detail View Modal */}
      {selectedSaleDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[#141813] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-5 text-white my-auto max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="font-heading text-lg font-bold text-white">
                  Sale Transaction #{selectedSaleDetail.id}
                </h3>
                <span className="text-xs text-neutral-400">
                  {selectedSaleDetail.saleType === "online" ? "Online Website Order" : "Physical Store Offline Sale"}
                </span>
              </div>
              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-1">
                <span className="text-neutral-400 font-bold block">Customer Details</span>
                <span className="text-white font-bold block">{selectedSaleDetail.customer?.name}</span>
                <span className="text-neutral-400 block">{selectedSaleDetail.customer?.phone}</span>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-neutral-300 block">Items Purchased</span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {selectedSaleDetail.items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/60 border border-neutral-800">
                      <div>
                        <span className="font-bold text-white block">{it.name}</span>
                        <span className="text-[10px] text-neutral-400">₹{it.price} × {it.quantity}</span>
                      </div>
                      <span className="font-bold text-lime-400">₹{it.total}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Subtotal:</span>
                  <span className="font-mono text-white">₹{selectedSaleDetail.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Discount:</span>
                  <span className="font-mono text-amber-400">-₹{selectedSaleDetail.discount}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-800 pt-1 font-bold text-sm">
                  <span className="text-white">Total Amount:</span>
                  <span className="text-lime-400">₹{selectedSaleDetail.totalAmount}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="px-5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-bold text-white hover:bg-neutral-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
