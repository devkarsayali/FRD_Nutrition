import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiCreditCard,
  FiDownload,
  FiEdit3,
  FiExternalLink,
  FiGlobe,
  FiHeart,
  FiLogOut,
  FiMapPin,
  FiPackage,
  FiRefreshCw,
  FiSave,
  FiShield,
  FiShoppingBag,
  FiTruck,
  FiUser,
  FiXCircle,
  FiArrowRight,
  FiZap,
} from "react-icons/fi";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useCart } from "../../context/CartContext";
import { useProducts } from "../../context/ProductContext";
import { useUserAuth } from "../../context/UserAuthContext";
import { db } from "../../firebase/firebase.config";
import { collection, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { isValidPhone } from "../../utils/validation";

const STATUS_STEPS = [
  "Ordered",
  "Packed",
  "Out for Delivery",
  "Delivered",
];

const getStatusStepIndex = (status) => {
  if (!status) return 0;
  const s = status.toLowerCase().trim();
  if (s.includes("delivered")) return 3;
  if (s.includes("out") || s.includes("delivery")) return 2;
  if (s.includes("packed")) return 1;
  return 0; // Ordered
};

const getStatusBadgeConfig = (status) => {
  const s = (status || "").toLowerCase();

  if (s.includes("delivered")) {
    return {
      style: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10",
      Icon: FiCheckCircle,
      pulse: "bg-emerald-400",
    };
  }
  if (s.includes("out") || s.includes("delivery")) {
    return {
      style: "bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-amber-500/10",
      Icon: FiTruck,
      pulse: "bg-amber-400",
    };
  }
  if (s.includes("packed")) {
    return {
      style: "bg-cyan-500/15 text-cyan-400 border-cyan-500/40 shadow-cyan-500/10",
      Icon: FiPackage,
      pulse: "bg-cyan-400",
    };
  }
  if (s.includes("returned")) {
    return {
      style: "bg-orange-500/15 text-orange-400 border-orange-500/40 shadow-orange-500/10",
      Icon: FiRefreshCw,
      pulse: "bg-orange-400",
    };
  }
  if (s.includes("refunded")) {
    return {
      style: "bg-purple-500/15 text-purple-400 border-purple-500/40 shadow-purple-500/10",
      Icon: FiZap,
      pulse: "bg-purple-400",
    };
  }
  if (s.includes("cancel")) {
    return {
      style: "bg-rose-500/15 text-rose-400 border-rose-500/40 shadow-rose-500/10",
      Icon: FiXCircle,
      pulse: "bg-rose-400",
    };
  }

  return {
    style: "bg-indigo-500/15 text-indigo-400 border-indigo-500/40 shadow-indigo-500/10",
    Icon: FiPackage,
    pulse: "bg-indigo-400",
  };
};

export default function UserDashboardPage() {
  const { user, logoutUser, updateUserProfile } = useUserAuth();
  const { wishlist, addToCart, setIsCartOpen, orders } = useCart();
  const { products } = useProducts();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialTab = searchParams.get("tab") || "orders";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["orders", "wishlist", "profile"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Wishlisted product objects
  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  // Dynamic user-specific orders dataset based on logged-in user email
  const getUserOrders = () => {
    try {
      const email = user?.email ? user.email.toLowerCase().trim() : "";
      if (!email) return [];

      const orderMap = new Map();

      const addOrder = (o) => {
        if (!o || !o.id) return;
        orderMap.set(o.id, o);
      };

      // 1. Context orders (scoped to logged-in user via CartContext)
      if (Array.isArray(orders)) {
        orders.forEach((o) => {
          const oEmail = (
            o.customer?.email ||
            o.shippingAddress?.email ||
            ""
          ).toLowerCase().trim();

          if (oEmail && oEmail === email) {
            addOrder(o);
          }
        });
      }

      // 2. Orders stored under user's specific email keys in localStorage
      const userOrdersKey = `frd_orders_${email}`;
      const userOrdersAltKey = `frd_user_orders_${email}`;
      const rawUserOrders = localStorage.getItem(userOrdersKey) || localStorage.getItem(userOrdersAltKey);
      if (rawUserOrders) {
        try {
          const parsed = JSON.parse(rawUserOrders);
          if (Array.isArray(parsed)) {
            parsed.forEach(addOrder);
          }
        } catch (e) { }
      }

      // 3. Scan all localStorage orders and filter strictly matching user email
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.toLowerCase().includes("order")) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || "[]");
            const list = Array.isArray(data) ? data : [data];
            list.forEach((o) => {
              const oEmail = (
                o.customer?.email ||
                o.shippingAddress?.email ||
                ""
              ).toLowerCase().trim();

              if (oEmail && oEmail === email) {
                addOrder(o);
              }
            });
          } catch (e) { }
        }
      }

      return Array.from(orderMap.values());
    } catch (e) {
      return [];
    }
  };

  const [ordersList, setOrdersList] = useState(getUserOrders);

  useEffect(() => {
    const updateOrders = () => setOrdersList(getUserOrders());
    updateOrders();

    let unsubscribe = () => {};
    try {
      unsubscribe = onSnapshot(
        collection(db, "orders"),
        (snapshot) => {
          const firestoreOrders = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const orderEmail = (data.customer?.email || data.shippingAddress?.email || "").toLowerCase();
            const currentUserEmail = (user?.email || "").toLowerCase();

            if (!user?.email || orderEmail === currentUserEmail || currentUserEmail.includes("admin")) {
              firestoreOrders.push({ id: docSnap.id, ...data });
            }
          });

          // Merge with local storage orders
          const local = getUserOrders();
          const map = new Map();
          firestoreOrders.forEach((o) => map.set(o.id, o));
          local.forEach((o) => {
            if (!map.has(o.id)) map.set(o.id, o);
          });

          setOrdersList(Array.from(map.values()));
        },
        () => {}
      );
    } catch (e) {}

    window.addEventListener("frd_orders_updated", updateOrders);
    window.addEventListener("storage", updateOrders);

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
      window.removeEventListener("frd_orders_updated", updateOrders);
      window.removeEventListener("storage", updateOrders);
    };
  }, [user?.email, orders]);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    pincode: user?.pincode || "",
    country: user?.country || "India",
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        pincode: user.pincode || "",
        country: user.country || "India",
      });
    }
  }, [user]);

  const { restoreProductStock } = useProducts();

  const canCancelOrder = (order) => {
    return false;
  };

  const canReturnOrder = (order) => {
    if (!order) return false;
    const s = (order.status || "").toLowerCase().trim();
    return s === "delivered";
  };

  const handleCancelOrder = (targetOrder) => {
    if (!targetOrder || !targetOrder.id) return;
    const normStatus = (targetOrder.status || "").toLowerCase().trim();

    if (normStatus.includes("out") || normStatus.includes("delivery") || normStatus.includes("delivered")) {
      toast.error("Orders cannot be cancelled once they are Out for Delivery or Delivered.");
      return;
    }

    if (["cancelled", "rejected", "refunded", "returned"].includes(normStatus)) {
      toast.error(`This order is already ${targetOrder.status}.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to cancel Order #${targetOrder.id}? Item stock will be restored automatically.`)) {
      return;
    }

    // 1. Restore product stock automatically
    if (!targetOrder.stockRestored) {
      restoreProductStock(targetOrder.items || []);
    }

    // 2. Update order status across all localStorage order keys
    const updateFn = (o) => {
      if (!o || o.id !== targetOrder.id) return o;
      return {
        ...o,
        status: "Cancelled",
        stockRestored: true,
        trackingSteps: (o.trackingSteps || []).map((step) => ({ ...step, completed: false })),
      };
    };

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.toLowerCase().includes("order")) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || "[]");
          if (Array.isArray(data)) {
            const updated = data.map(updateFn);
            localStorage.setItem(key, JSON.stringify(updated));
          } else if (data && typeof data === "object" && data.id === targetOrder.id) {
            localStorage.setItem(key, JSON.stringify(updateFn(data)));
          }
        } catch (e) {
          // ignore non-json
        }
      }
    }

    window.dispatchEvent(new CustomEvent("frd_orders_updated"));
    toast.success(`Order #${targetOrder.id} cancelled. Item stock automatically restored!`);
  };

  const handleReturnOrder = (targetOrder) => {
    if (!targetOrder || !targetOrder.id) return;
    const normStatus = (targetOrder.status || "").toLowerCase().trim();

    if (normStatus !== "delivered") {
      toast.error("Return requests can only be placed for Delivered orders.");
      return;
    }

    const reason = window.prompt(
      `Request Return for Order #${targetOrder.id}\n\nPlease enter the reason for your return (e.g. wrong size, damaged packaging, item not needed):`,
      "Item not needed / Size issue"
    );

    if (reason === null) return; // User cancelled prompt

    // Restore product stock upon return
    if (!targetOrder.stockRestored) {
      restoreProductStock(targetOrder.items || []);
    }

    const updateFn = (o) => {
      if (!o || o.id !== targetOrder.id) return o;
      return {
        ...o,
        status: "Returned",
        returnReason: reason || "Customer Return",
        stockRestored: true,
      };
    };

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.toLowerCase().includes("order")) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || "[]");
          if (Array.isArray(data)) {
            const updated = data.map(updateFn);
            localStorage.setItem(key, JSON.stringify(updated));
          } else if (data && typeof data === "object" && data.id === targetOrder.id) {
            localStorage.setItem(key, JSON.stringify(updateFn(data)));
          }
        } catch (e) {
          // ignore non-json
        }
      }
    }

    window.dispatchEvent(new CustomEvent("frd_orders_updated"));
    toast.success(`Return request submitted for Order #${targetOrder.id}!`);
  };

  // Track expanded order card IDs
  const [expandedOrderId, setExpandedOrderId] = useState(ordersList[0]?.id || null);

  const toggleOrderDetails = (orderId) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    if (profileForm.phone && !isValidPhone(profileForm.phone)) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    updateUserProfile(profileForm);
    setIsEditingProfile(false);
    toast.success("Profile details updated successfully!");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#070a12] text-white flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-20 h-20 bg-amber-500/10 rounded-3xl border border-amber-500/20 text-[#f5b800] flex items-center justify-center shadow-xl">
          <FiUser size={38} />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="font-heading text-3xl font-extrabold text-white">
            Please Log In to Access Portal
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Access your personal HR Sports & Nutrition Athlete Hub, view live shipment tracking, manage orders, and view saved items.
          </p>
        </div>
        <Link
          to="/user/login"
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#f5b800] via-amber-400 to-yellow-500 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/25 hover:scale-105 transition-transform flex items-center gap-2"
        >
          <span>Go to User Login Page</span>
          <FiArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#070a12] text-white min-h-[calc(100vh-80px)] py-6 sm:py-12 overflow-y-auto">
      <div className="container-custom max-w-6xl space-y-6 sm:space-y-8">
        {/* Full-width Main Content Panel */}
        <div className="w-full">
          {/* MY ORDERS TAB */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f172a] p-6 rounded-3xl border border-slate-800/90 shadow-2xl">
                <div>
                  <h3 className="text-xl font-black font-heading text-white flex items-center gap-2.5">
                    <FiPackage className="text-[#f5b800]" size={22} />
                    <span>My Orders History & Tracking</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Track live shipment progress, view purchase details, or download invoices.
                  </p>
                </div>
                <span className="px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-extrabold text-amber-400 text-center self-start sm:self-auto">
                  {ordersList.length} {ordersList.length === 1 ? "Order" : "Orders"}
                </span>
              </div>

              {ordersList.length === 0 ? (
                <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 text-slate-600 flex items-center justify-center mx-auto border border-slate-800">
                    <FiPackage size={32} />
                  </div>
                  <h4 className="font-bold text-lg text-white">No Orders Found</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    You haven't placed any supplement orders yet. Check out our store catalog!
                  </p>
                  <Link
                    to="/supplements"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#f5b800] via-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform"
                  >
                    <span>Explore Supplements</span>
                    <FiArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-5">
                  {ordersList.map((order) => {
                    const isExpanded = expandedOrderId === order.id;
                    const badgeConfig = getStatusBadgeConfig(order.status);
                    const BadgeIcon = badgeConfig.Icon;

                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-3xl border transition-all duration-300 overflow-hidden shadow-2xl ${isExpanded
                          ? "bg-gradient-to-b from-[#0f172a] via-[#111927] to-[#0c1220] border-amber-500/40 shadow-amber-500/5"
                          : "bg-[#0f172a] border-slate-800/90 hover:border-slate-700/90"
                          }`}
                      >
                        {/* Order Header Summary Card */}
                        <div className="p-5 sm:p-6 select-none space-y-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            {/* Left Order Info & Status */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="font-heading font-black text-white text-lg tracking-tight">
                                  #{order.id}
                                </span>

                                {/* Dynamic Status Badge */}
                                <span
                                  className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border flex items-center gap-1.5 shadow-sm ${badgeConfig.style}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${badgeConfig.pulse} animate-pulse`} />
                                  <BadgeIcon size={13} />
                                  <span>{order.status}</span>
                                </span>

                                <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-bold">
                                  {order.items?.length || 1} {(order.items?.length || 1) === 1 ? "Item" : "Items"}
                                </span>
                              </div>

                              <p className="text-xs text-slate-400 flex items-center gap-2">
                                <FiClock size={13} className="text-slate-500" />
                                <span>Placed on {order.orderDate} at {order.orderTime}</span>
                              </p>
                            </div>

                            {/* Right Pricing & Expand Controls */}
                            <div className="flex items-center justify-between w-full sm:w-auto gap-5 border-t sm:border-t-0 border-slate-800/60 pt-3 sm:pt-0">
                              <div className="text-left sm:text-right">
                                <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">
                                  Total Amount
                                </span>
                                <span className="font-heading font-black text-xl text-[#f5b800]">
                                  ₹{order.totalAmount}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {canReturnOrder(order) && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReturnOrder(order);
                                    }}
                                    className="px-3 py-2 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-extrabold transition flex items-center gap-1 cursor-pointer shadow-sm"
                                    title="Request return for this delivered order"
                                  >
                                    <FiRefreshCw size={15} />
                                    <span>Return Order</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleOrderDetails(order.id);
                                  }}
                                  className={`p-2.5 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center gap-1.5 text-xs font-bold ${isExpanded
                                    ? "bg-[#f5b800] text-slate-950 border-amber-400 font-extrabold shadow-lg shadow-amber-500/20"
                                    : "bg-slate-900 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700"
                                    }`}
                                  aria-label={isExpanded ? "Collapse Order Details" : "Expand Order Details"}
                                >
                                  <span>{isExpanded ? "Hide Details" : "View Details"}</span>
                                  <motion.div
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <FiChevronDown size={18} />
                                  </motion.div>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Item Thumbnail Strip */}
                          {order.items && order.items.length > 0 && (
                            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                              <div className="flex items-center gap-2 overflow-x-auto py-1">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-1">
                                  Items:
                                </span>
                                {order.items.slice(0, 4).map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2 bg-slate-950/80 px-2 py-1 rounded-xl border border-slate-800 shrink-0"
                                    title={item.name}
                                  >
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="w-7 h-7 object-contain bg-slate-900 rounded-lg p-0.5"
                                    />
                                    <span className="text-[11px] font-bold text-slate-200 line-clamp-1 max-w-[120px]">
                                      {item.name}
                                    </span>
                                  </div>
                                ))}
                                {order.items.length > 4 && (
                                  <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                                    +{order.items.length - 4} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Order Expanded Details Section */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="border-t border-slate-800/90 p-6 sm:p-8 space-y-8 bg-slate-950/80"
                            >
                              {/* Live Delivery Progress Tracker */}
                              <div className="space-y-4 bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-xl">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
                                  <span className="font-bold text-slate-200 flex items-center gap-2 text-sm">
                                    <FiTruck className="text-[#f5b800]" size={18} />
                                    <span>Shipment Tracking Status</span>
                                  </span>
                                  <span className="font-extrabold text-[#f5b800] bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 text-xs">
                                    {order.status === "Delivered"
                                      ? `Delivered on ${order.deliveryDate || "Completed"}`
                                      : `Expected Delivery: ${order.deliveryDate || "In 4-8 Business Days"}`}
                                  </span>
                                </div>

                                {/* Progress bar line with Step Badges */}
                                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-3">
                                  {STATUS_STEPS.map((stepTitle, idx) => {
                                    const currentStatusIdx = getStatusStepIndex(order.status);
                                    const isCompleted =
                                      order.status === "Delivered" ||
                                      (order.status !== "Cancelled" && idx <= currentStatusIdx);
                                    const isCurrent = currentStatusIdx === idx && order.status !== "Cancelled";

                                    return (
                                      <div key={idx} className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <div
                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${isCompleted
                                              ? "bg-gradient-to-r from-[#f5b800] to-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                                              : "bg-slate-900 text-slate-600 border border-slate-800"
                                              }`}
                                          >
                                            {isCompleted ? "✓" : idx + 1}
                                          </div>
                                          <div
                                            className={`h-1.5 flex-1 rounded-full ${isCompleted
                                              ? "bg-gradient-to-r from-[#f5b800] to-amber-500"
                                              : "bg-slate-800"
                                              }`}
                                          />
                                        </div>
                                        <span
                                          className={`text-[10px] font-bold block ${isCurrent
                                            ? "text-[#f5b800] font-black"
                                            : isCompleted
                                              ? "text-slate-300"
                                              : "text-slate-500"
                                            }`}
                                        >
                                          {stepTitle}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Courier Partner & AWB Tracking Details */}
                                {(order.courierName || order.awbTrackingNumber) && (
                                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs gap-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-400 font-bold">Courier Partner:</span>
                                      <span className="text-white font-extrabold bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                                        {order.courierName || "Standard Express"}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-400 font-bold">AWB Tracking No:</span>
                                      <span className="text-[#f5b800] font-mono font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                                        {order.awbTrackingNumber || "AWB-89304190"}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Purchased Items List */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs text-slate-400">
                                  <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                                    Purchased Items ({order.items?.length || 1})
                                  </span>
                                  <span>Select Reorder to quickly add item back to cart</span>
                                </div>

                                <div className="space-y-3">
                                  {(order.items || []).map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                    >
                                      <div className="flex items-center gap-4">
                                        <img
                                          src={item.image}
                                          alt={item.name}
                                          className="w-14 h-14 object-contain rounded-xl bg-slate-950 p-2 border border-slate-800 shrink-0"
                                        />
                                        <div className="space-y-1">
                                          <h5 className="font-bold text-sm text-white line-clamp-1">
                                            {item.name}
                                          </h5>
                                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                            <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                              Flavor: {item.flavor || item.selectedFlavor || "Standard"}
                                            </span>
                                            <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                              Size: {item.size || item.selectedSize || "Standard"}
                                            </span>
                                            <span className="font-bold text-amber-400">
                                              Qty: {item.quantity || 1}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 border-slate-800/60 pt-2 sm:pt-0">
                                        <span className="font-black text-sm text-[#f5b800]">
                                          ₹{item.price * (item.quantity || 1)}
                                        </span>

                                        <div className="flex items-center gap-2">
                                          <Link
                                            to="/supplements"
                                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-1"
                                          >
                                            <FiExternalLink size={13} />
                                            <span>View</span>
                                          </Link>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              addToCart(item);
                                              setIsCartOpen(true);
                                              toast.success(`Reordered ${item.name}!`);
                                            }}
                                            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-extrabold text-[#f5b800] transition flex items-center gap-1 cursor-pointer"
                                          >
                                            <FiRefreshCw size={13} />
                                            <span>Reorder</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Two Columns: Payment Info & Price Breakdown */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                {/* Payment Details Box */}
                                <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
                                  <h6 className="font-bold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                    <FiCreditCard className="text-[#f5b800]" size={16} />
                                    <span>Payment Details</span>
                                  </h6>

                                  <div className="space-y-2 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Payment Method:</span>
                                      <span className="font-bold text-white uppercase">
                                        {order.customer?.paymentMethod || "Prepaid Online Pay"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Payment Status:</span>
                                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                                        <FiShield size={12} />
                                        <span>Paid & Verified</span>
                                      </span>
                                    </div>
                                    <div className="flex justify-between font-mono text-[11px]">
                                      <span className="text-slate-400 font-sans">Transaction ID:</span>
                                      <span className="text-slate-300 font-bold">
                                        {order.transactionId || `TXN-${order.id.slice(-8)}`}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Order Price Breakdown & Invoice */}
                                <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h6 className="font-bold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                      <FiZap className="text-[#f5b800]" size={16} />
                                      <span>Order Price Breakdown</span>
                                    </h6>

                                    <button
                                      type="button"
                                      onClick={() => toast.success(`Downloading Official Tax Invoice for Order #${order.id}...`)}
                                      className="text-[11px] font-bold text-[#f5b800] bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 hover:bg-amber-500/20 transition flex items-center gap-1 cursor-pointer"
                                    >
                                      <FiDownload size={13} />
                                      <span>Download Invoice</span>
                                    </button>
                                  </div>

                                  <div className="space-y-1.5 text-xs pt-1">
                                    <div className="flex justify-between text-slate-400">
                                      <span>Items Subtotal:</span>
                                      <span className="text-white font-medium">₹{order.subtotal || order.totalAmount}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                      <span>GST Tax (18% Included):</span>
                                      <span className="text-slate-300">₹{Math.round((order.totalAmount || 0) * 0.18)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                      <span>Express Courier Delivery:</span>
                                      <span className="text-emerald-400 font-bold">
                                        {order.shippingFee ? `₹${order.shippingFee}` : "FREE"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
                                      <span>Total Paid:</span>
                                      <span className="text-[#f5b800]">₹{order.totalAmount}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SAVED WISHLIST TAB */}
          {activeTab === "wishlist" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f172a] p-6 rounded-3xl border border-slate-800/90 shadow-2xl">
                <div>
                  <h3 className="text-xl font-black font-heading text-white flex items-center gap-2.5">
                    <FiHeart className="text-[#f5b800]" size={22} />
                    <span>My Saved Wishlist</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Your saved favorite supplements for quick future purchasing.
                  </p>
                </div>
                <span className="px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-extrabold text-amber-400 text-center self-start sm:self-auto">
                  {wishlist.length} {wishlist.length === 1 ? "Item" : "Items"}
                </span>
              </div>

              {wishlistedProducts.length === 0 ? (
                <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 text-slate-600 flex items-center justify-center mx-auto border border-slate-800">
                    <FiHeart size={32} />
                  </div>
                  <h4 className="font-bold text-lg text-white">Your Wishlist is Empty</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    You haven't saved any supplements to your wishlist yet.
                  </p>
                  <Link
                    to="/supplements"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#f5b800] via-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform"
                  >
                    <span>Browse Store Catalog</span>
                    <FiArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlistedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-[#0f172a] border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-slate-700 transition flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="relative bg-slate-950 rounded-2xl p-4 aspect-square flex items-center justify-center border border-slate-800">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-contain"
                          />
                          {product.badge && (
                            <span className="absolute top-2 left-2 bg-gradient-to-r from-[#f5b800] to-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-md uppercase">
                              {product.badge}
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                            {product.category}
                          </span>
                          <h5 className="font-bold text-sm text-white line-clamp-1">
                            {product.name}
                          </h5>
                          <span className="font-black text-base text-white mt-1 block">
                            ₹{product.price}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            addToCart(product);
                            setIsCartOpen(true);
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#f5b800] to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md hover:scale-105 transition-transform cursor-pointer"
                        >
                          <FiShoppingBag size={14} />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ACCOUNT DETAILS TAB */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f172a] p-6 rounded-3xl border border-slate-800/90 shadow-2xl">
                <div>
                  <h3 className="text-xl font-black font-heading text-white flex items-center gap-2.5">
                    <FiUser className="text-[#f5b800]" size={22} />
                    <span>Account & Delivery Details</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage your personal profile, phone number, and default delivery shipping address.
                  </p>
                </div>

                {!isEditingProfile && (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="px-5 py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-black text-[#f5b800] transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                  >
                    <FiEdit3 size={15} />
                    <span>Edit Profile Details</span>
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <form
                  onSubmit={handleProfileSave}
                  className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#f5b800]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        disabled
                        value={profileForm.email}
                        className="w-full bg-slate-900 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs text-slate-400 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        value={profileForm.phone}
                        onChange={(e) => {
                          const numericDigits = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setProfileForm({ ...profileForm, phone: numericDigits });
                        }}
                        placeholder="9876543210 (10 digits)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#f5b800]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#f5b800]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={profileForm.city}
                        onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#f5b800]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={profileForm.state}
                        onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#f5b800]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        required
                        value={profileForm.pincode}
                        onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#f5b800]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Country
                      </label>
                      <input
                        type="text"
                        disabled
                        value={profileForm.country}
                        className="w-full bg-slate-900 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs text-slate-400 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#f5b800] to-amber-500 text-slate-950 font-black text-xs shadow-lg hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer"
                    >
                      <FiSave size={15} />
                      <span>Save Profile Changes</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-3">
                      <h5 className="font-bold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <FiUser size={16} />
                        <span>Personal Details</span>
                      </h5>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Full Name:</span>
                          <span className="font-bold text-white">{profileForm.name || "Athlete"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Email:</span>
                          <span className="font-bold text-white">{profileForm.email || "Not specified"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Phone:</span>
                          <span className="font-bold text-white">{profileForm.phone || "Not added yet"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-3">
                      <h5 className="font-bold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <FiMapPin size={16} />
                        <span>Default Shipping Address</span>
                      </h5>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Address:</span>
                          <span className="font-bold text-white text-right max-w-xs">{profileForm.address || "Not added yet"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">City / State:</span>
                          <span className="font-bold text-white">
                            {profileForm.city || profileForm.state
                              ? `${profileForm.city || ""}${profileForm.city && profileForm.state ? ", " : ""}${profileForm.state || ""}`
                              : "Not added yet"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Pincode:</span>
                          <span className="font-bold text-amber-400">{profileForm.pincode || "Not added yet"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
