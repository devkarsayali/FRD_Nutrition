import { useEffect, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiExternalLink,
  FiEye,
  FiMail,
  FiMapPin,
  FiMessageSquare,
  FiPackage,
  FiPhone,
  FiSearch,
  FiShoppingBag,
  FiTrash2,
  FiUser,
  FiX,
} from "react-icons/fi";
import { useCart } from "../../context/CartContext";
import { useProducts } from "../../context/ProductContext";
import toast from "react-hot-toast";
import { useOutletContext, useLocation, useNavigate, useSearchParams } from "react-router-dom";

export default function AdminOrdersPage({ defaultTab }) {
  const { orders: cartContextOrders } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const outletContext = useOutletContext();
  const globalSearch = outletContext?.searchQuery || "";

  const isMessages =
    defaultTab === "messages" ||
    location.pathname.includes("/admin/messages") ||
    searchParams.get("tab") === "messages";

  const [activeTab, setActiveTab] = useState(isMessages ? "messages" : "orders");
  const [allOrders, setAllOrders] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [messageFilter, setMessageFilter] = useState("All");

  const searchTerm = globalSearch || localSearchTerm;

  useEffect(() => {
    if (selectedMessage || selectedOrder) {
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
  }, [selectedMessage, selectedOrder]);

  useEffect(() => {
    if (
      defaultTab === "messages" ||
      location.pathname.includes("/admin/messages") ||
      searchParams.get("tab") === "messages"
    ) {
      setActiveTab("messages");
    } else if (
      defaultTab === "orders" ||
      location.pathname.includes("/admin/orders") ||
      searchParams.get("tab") === "orders"
    ) {
      setActiveTab("orders");
    }
  }, [defaultTab, location.pathname, searchParams]);

  useEffect(() => {
    loadMessages();
    loadOrders();

    const handleOrdersUpdate = () => loadOrders();
    const handleMessagesUpdate = () => loadMessages();

    window.addEventListener("frd_orders_updated", handleOrdersUpdate);
    window.addEventListener("frd_contact_messages_updated", handleMessagesUpdate);
    window.addEventListener("storage", handleOrdersUpdate);
    window.addEventListener("storage", handleMessagesUpdate);

    return () => {
      window.removeEventListener("frd_orders_updated", handleOrdersUpdate);
      window.removeEventListener("frd_contact_messages_updated", handleMessagesUpdate);
      window.removeEventListener("storage", handleOrdersUpdate);
      window.removeEventListener("storage", handleMessagesUpdate);
    };
  }, [cartContextOrders]);

  const loadMessages = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("frd_contact_messages") || "[]");
      setContactMessages(saved);
    } catch (err) {
      console.error("Failed to load contact messages:", err);
    }
  };

  const loadOrders = () => {
    try {
      const orderMap = new Map();

      // Helper to add order to map cleanly
      const addOrderToMap = (o) => {
        if (!o || !o.id) return;
        // Validate order structure
        if (!o.items || o.items.length === 0) {
          if (!o.customer?.email && !o.shippingAddress?.email && !o.total && !o.totalAmount) return;
        }

        const existing = orderMap.get(o.id) || {};
        // Merge fields to ensure maximum customer info completeness
        const merged = {
          ...existing,
          ...o,
          customer: {
            fullName: o.customer?.fullName || o.shippingAddress?.name || existing.customer?.fullName || "Customer",
            phone: o.customer?.phone || o.shippingAddress?.phone || existing.customer?.phone || "N/A",
            email: o.customer?.email || existing.customer?.email || "",
            address: o.customer?.address || o.shippingAddress?.address || existing.customer?.address || "",
            paymentMethod: o.customer?.paymentMethod || o.paymentMethod || existing.customer?.paymentMethod || "Prepaid",
          },
          items: o.items || existing.items || [],
          readStatus: o.readStatus || existing.readStatus || "read",
        };
        orderMap.set(o.id, merged);
      };

      // 1. Add context orders
      if (Array.isArray(cartContextOrders)) {
        cartContextOrders.forEach(addOrderToMap);
      }

      // 2. Scan ALL localStorage keys containing 'orders' or 'order'
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.toLowerCase().includes("order")) {
          try {
            const parsed = JSON.parse(localStorage.getItem(key) || "[]");
            if (Array.isArray(parsed)) {
              parsed.forEach(addOrderToMap);
            } else if (parsed && parsed.id) {
              addOrderToMap(parsed);
            }
          } catch (e) {
            // ignore non-JSON items
          }
        }
      }

      const combined = Array.from(orderMap.values());
      setAllOrders(combined);
    } catch (err) {
      console.error("Failed to load orders:", err);
    }
  };

  const handleToggleRead = (id) => {
    const updated = contactMessages.map((msg) => {
      if (msg.id === id) {
        return { ...msg, status: msg.status === "read" ? "unread" : "read" };
      }
      return msg;
    });
    setContactMessages(updated);
    localStorage.setItem("frd_contact_messages", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("frd_contact_messages_updated"));
    toast.success("Message status updated.");
  };

  const handleDeleteMessage = (id) => {
    const updated = contactMessages.filter((msg) => msg.id !== id);
    setContactMessages(updated);
    localStorage.setItem("frd_contact_messages", JSON.stringify(updated));
    if (selectedMessage?.id === id) setSelectedMessage(null);
    window.dispatchEvent(new CustomEvent("frd_contact_messages_updated"));
    toast.success("Message deleted.");
  };

  const { decreaseProductStock, restoreProductStock } = useProducts();

  const STATUS_STEPS = [
    "Ordered",
    "Shipped",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
    "Refunded",
    "Returned",
  ];

  const ORDER_STATUS_OPTIONS = [
    "All",
    "Ordered",
    "Shipped",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
    "Refunded",
    "Returned",
  ];

  const updateOrderData = (orderId, updateFields) => {
    const updatedOrders = allOrders.map((order) => {
      if (order.id !== orderId) return order;
      return { ...order, ...updateFields };
    });
    setAllOrders(updatedOrders);

    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => ({ ...prev, ...updateFields }));
    }

    // Persist to all localStorage order keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.toLowerCase().includes("order")) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || "[]");
          if (Array.isArray(data)) {
            const updated = data.map((o) => {
              if (o.id === orderId) {
                return { ...o, ...updateFields };
              }
              return o;
            });
            localStorage.setItem(key, JSON.stringify(updated));
          }
        } catch (e) {
          // ignore non-JSON
        }
      }
    }
    window.dispatchEvent(new CustomEvent("frd_orders_updated"));
  };

  const getStatusStepIndex = (status) => {
    if (!status) return 0;
    const s = status.toLowerCase().trim();
    if (s.includes("delivered")) return 3;
    if (s.includes("out for delivery") || s.includes("out_for_delivery")) return 2;
    if (s.includes("shipped") || s.includes("transit")) return 1;
    return 0; // Ordered
  };

  const RESTORABLE_STATUSES = ["cancelled", "rejected", "refunded", "returned"];

  const handleStatusChange = (orderId, newStatus) => {
    const targetIndex = getStatusStepIndex(newStatus);
    const normNewStatus = (newStatus || "").toLowerCase().trim();
    const isNewStatusRestorable = RESTORABLE_STATUSES.includes(normNewStatus);

    const defaultSteps = [
      { title: "Ordered", time: "Order Received", completed: true },
      { title: "Shipped", time: "Dispatched", completed: false },
      { title: "Out for Delivery", time: "Local Hub", completed: false },
      { title: "Delivered", time: "Handed Over", completed: false },
    ];

    const currentOrder = allOrders.find((o) => o.id === orderId);
    if (!currentOrder) return;

    const currentSteps =
      currentOrder?.trackingSteps && currentOrder.trackingSteps.length >= 5
        ? currentOrder.trackingSteps
        : defaultSteps;

    const updatedTrackingSteps = currentSteps.map((step, idx) => ({
      ...step,
      completed: isNewStatusRestorable ? false : idx <= targetIndex,
    }));

    let nextStockRestored = currentOrder.stockRestored ?? false;

    if (isNewStatusRestorable && !currentOrder.stockRestored) {
      restoreProductStock(currentOrder.items || []);
      nextStockRestored = true;
      toast.success(`Order #${orderId} set to "${newStatus}". Product stock automatically restored!`);
    } else if (!isNewStatusRestorable && currentOrder.stockRestored) {
      decreaseProductStock(currentOrder.items || []);
      nextStockRestored = false;
      toast.success(`Order #${orderId} set to "${newStatus}". Product stock re-deducted!`);
    } else {
      toast.success(`Order #${orderId} status updated to "${newStatus}"`);
    }

    updateOrderData(orderId, {
      status: newStatus,
      stockRestored: nextStockRestored,
      trackingSteps: updatedTrackingSteps,
    });
  };

  const updateOrderInLocalStorage = (orderId, updateFn) => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.toLowerCase().includes("order")) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || "[]");
          if (Array.isArray(data)) {
            const updated = data.map((o) => (o && o.id === orderId ? updateFn(o) : o));
            localStorage.setItem(key, JSON.stringify(updated));
          } else if (data && typeof data === "object" && data.id === orderId) {
            const updated = updateFn(data);
            localStorage.setItem(key, JSON.stringify(updated));
          }
        } catch (e) {
          // ignore non-JSON keys
        }
      }
    }
  };

  const handleToggleOrderRead = (id) => {
    const updatedOrders = allOrders.map((order) => {
      if (order.id !== id) return order;
      const nextReadStatus = order.readStatus === "unread" ? "read" : "unread";
      return { ...order, readStatus: nextReadStatus };
    });
    setAllOrders(updatedOrders);

    updateOrderInLocalStorage(id, (o) => ({
      ...o,
      readStatus: o.readStatus === "unread" ? "read" : "unread",
    }));

    if (selectedOrder && selectedOrder.id === id) {
      setSelectedOrder((prev) =>
        prev ? { ...prev, readStatus: prev.readStatus === "unread" ? "read" : "unread" } : prev
      );
    }

    window.dispatchEvent(new CustomEvent("frd_orders_updated"));
    toast.success("Order status updated.");
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    if (order.readStatus === "unread") {
      const updatedOrders = allOrders.map((o) =>
        o.id === order.id ? { ...o, readStatus: "read" } : o
      );
      setAllOrders(updatedOrders);

      updateOrderInLocalStorage(order.id, (o) => ({
        ...o,
        readStatus: "read",
      }));

      window.dispatchEvent(new CustomEvent("frd_orders_updated"));
    }
  };

  // ✅ FIXED: handleDeleteOrder now removes the order from EVERY localStorage key
  const handleDeleteOrder = (id) => {
    // 1. Update state immediately
    const updated = allOrders.filter((o) => o.id !== id);
    setAllOrders(updated);

    // 2. Save to the merged admin orders key
    localStorage.setItem("frd_all_admin_orders", JSON.stringify(updated));

    // 3. CRITICAL FIX: Remove the order from ALL localStorage keys that contain orders
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.toLowerCase().includes("order")) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || "[]");
          if (Array.isArray(data)) {
            const filtered = data.filter((o) => o && o.id !== id);
            localStorage.setItem(key, JSON.stringify(filtered));
          } else if (data && typeof data === "object" && data.id === id) {
            // If key holds a single order object, clear it
            localStorage.setItem(key, JSON.stringify({}));
          }
        } catch (e) {
          // ignore non-JSON keys
        }
      }
    }

    if (selectedOrder?.id === id) setSelectedOrder(null);
    window.dispatchEvent(new CustomEvent("frd_orders_updated"));
    toast.success("Order record deleted.");
  };

  const unreadCount = contactMessages.filter((m) => m.status === "unread").length;

  // Filter logic
  const filteredMessages = contactMessages.filter((m) => {
    const query = searchTerm.toLowerCase();
    const searchMatch =
      (m.name || "").toLowerCase().includes(query) ||
      (m.email || "").toLowerCase().includes(query) ||
      (m.phone || "").toLowerCase().includes(query) ||
      (m.message || "").toLowerCase().includes(query) ||
      (m.product || "").toLowerCase().includes(query) ||
      (m.subject || "").toLowerCase().includes(query) ||
      (m.id || "").toLowerCase().includes(query);

    let filterMatch = true;
    if (messageFilter === "Product Enquiries") {
      filterMatch = Boolean(m.product || m.type === "Product Enquiry");
    } else if (messageFilter === "General Messages") {
      filterMatch = !m.product && m.type !== "Product Enquiry";
    } else if (messageFilter === "Unread") {
      filterMatch = m.status === "unread";
    } else if (messageFilter === "Read") {
      filterMatch = m.status === "read";
    }

    return searchMatch && filterMatch;
  });

  const getNormalizedStatus = (stat) => {
    const s = (stat || "Order Placed").toLowerCase().trim();
    if (s === "pending" || s === "order placed" || s === "confirmed") return "order placed";
    return s;
  };

  const filteredOrders = allOrders.filter((o) => {
    const statusMatch =
      statusFilter === "All" ||
      getNormalizedStatus(o.status) === getNormalizedStatus(statusFilter);

    const searchMatch =
      o.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customer?.fullName || o.shippingAddress?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customer?.phone || o.shippingAddress?.phone || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customer?.email || "").toLowerCase().includes(searchTerm.toLowerCase());

    return statusMatch && searchMatch;
  });

  return (
    <div className="space-y-6">
      {/* TAB 1: CUSTOMER ORDERS DATA TABLE */}
      {activeTab === "orders" && (
        <div className="bg-[#141813] rounded-3xl border border-neutral-800 overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-neutral-800/80 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-sm font-bold text-white uppercase tracking-wider">
                Customer Orders ({filteredOrders.length})
              </h2>
              <p className="text-[11px] text-neutral-400 mt-1">
                Search orders by ID, customer, phone or email, and filter by status.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                  placeholder="Search order ID, customer name, email..."
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-lime-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition"
                />
                <FiSearch className="absolute left-3.5 top-3 text-neutral-500" size={15} />
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-[#192218] border border-neutral-800 text-lime-400 text-xs rounded-2xl px-3 py-2.5 focus:outline-none focus:border-lime-500"
                >
                  {ORDER_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status} className="bg-neutral-900 text-white">
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-600 mx-auto">
                <FiShoppingBag size={28} />
              </div>
              <h3 className="font-bold text-base text-white">No Orders Found</h3>
              <p className="text-xs text-neutral-400">
                {searchTerm ? "No orders match your search." : "When customers place orders via checkout, they will appear here."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-900/90 text-neutral-400 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-800">
                    <th className="py-4 px-4">Order ID & Date</th>
                    <th className="py-4 px-4">Customer Name & Email</th>
                    <th className="py-4 px-4">Phone / Contact</th>
                    <th className="py-4 px-4">Items Summary</th>
                    <th className="py-4 px-4">Total Amount</th>
                    <th className="py-4 px-4">Payment Method</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80 text-xs">
                  {filteredOrders.map((order) => {
                    const custName = order.customer?.fullName || order.shippingAddress?.name || "Customer";
                    const custEmail = order.customer?.email || "N/A";
                    const custPhone = order.customer?.phone || order.shippingAddress?.phone || "N/A";
                    const orderTotal = order.total || order.totalAmount || 0;
                    const itemsCount = order.items ? order.items.length : 0;

                    return (
                      <tr
                        key={order.id}
                        className={`hover:bg-neutral-900/50 transition ${
                          order.readStatus === "unread" ? "bg-lime-500/[0.03]" : ""
                        }`}
                      >
                        {/* Order ID & Date */}
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-black text-lime-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 block w-max">
                                #{order.id}
                              </span>
                              {order.readStatus === "unread" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[9px] font-black uppercase">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                  New
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-neutral-400 block whitespace-nowrap">
                              {order.date || order.orderDate || "Recent"}
                            </span>
                          </div>
                        </td>

                        {/* Customer Name & Email */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-lime-500/20 text-lime-400 font-black flex items-center justify-center text-xs shrink-0 border border-lime-500/30">
                              {custName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-white block text-xs">{custName}</span>
                              {custEmail !== "N/A" && (
                                <a href={`mailto:${custEmail}`} className="text-[11px] text-lime-400 hover:underline block truncate max-w-[150px]">
                                  {custEmail}
                                </a>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Phone Contact */}
                        <td className="py-4 px-4 font-mono text-xs text-lime-400 font-bold">
                          {custPhone !== "N/A" ? (
                            <a href={`tel:${custPhone}`} className="hover:underline flex items-center gap-1">
                              <FiPhone size={12} className="shrink-0" />
                              <span>{custPhone}</span>
                            </a>
                          ) : (
                            <span className="text-neutral-500">N/A</span>
                          )}
                        </td>

                        {/* Items Summary */}
                        <td className="py-4 px-4">
                          <div className="space-y-1 max-w-xs">
                            <span className="font-bold text-neutral-200 block text-xs">
                              {itemsCount} Product(s)
                            </span>
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              {order.items && order.items.map((item, idx) => (
                                <img
                                  key={idx}
                                  src={item.product?.image || item.image}
                                  alt={item.product?.name || item.name}
                                  className="w-7 h-7 object-contain rounded bg-neutral-900 p-0.5 border border-neutral-800 shrink-0"
                                  title={`${item.product?.name || item.name} (Qty: ${item.quantity})`}
                                />
                              ))}
                            </div>
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td className="py-4 px-4">
                          <span className="font-black text-sm text-lime-400">
                            ₹{orderTotal}
                          </span>
                        </td>

                        {/* Payment Method */}
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-[10px] font-bold uppercase text-neutral-300">
                            {order.customer?.paymentMethod || order.paymentMethod || "Prepaid"}
                          </span>
                        </td>

                        {/* Status Select Dropdown */}
                        <td className="py-4 px-4">
                          <select
                            value={order.status || "In Transit"}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className="bg-[#192218] border border-lime-500/40 text-lime-400 font-extrabold text-[11px] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-lime-400 cursor-pointer shadow-sm"
                          >
                            <option value="Ordered" className="bg-neutral-900 text-white">Ordered</option>
                            <option value="Shipped" className="bg-neutral-900 text-white">Shipped</option>
                            <option value="Out for Delivery" className="bg-neutral-900 text-white">Out for Delivery</option>
                            <option value="Delivered" className="bg-neutral-900 text-white">Delivered</option>
                            <option value="Cancelled" className="bg-neutral-900 text-red-400">Cancelled</option>
                            <option value="Refunded" className="bg-neutral-900 text-[#f5b800]">Refunded</option>
                            <option value="Returned" className="bg-neutral-900 text-amber-400">Returned</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewOrder(order)}
                              className="p-2 rounded-xl bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 transition cursor-pointer border border-neutral-800"
                              title="View Order Details"
                            >
                              <FiEye size={15} />
                            </button>

                            <button
                              onClick={() => handleToggleOrderRead(order.id)}
                              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition cursor-pointer border ${
                                order.readStatus === "unread"
                                  ? "bg-lime-500 text-neutral-950 border-lime-400 hover:bg-lime-400 font-extrabold"
                                  : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white"
                              }`}
                            >
                              {order.readStatus === "unread" ? "Mark Read" : "Unread"}
                            </button>

                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="p-2 rounded-xl bg-neutral-900 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer border border-neutral-800"
                              title="Delete Order Record"
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CONTACT MESSAGES DATA TABLE */}
      {activeTab === "messages" && (
        <div className="bg-[#141813] rounded-3xl border border-neutral-800 overflow-hidden shadow-2xl space-y-0">
          {/* Header Controls for Messages */}
          <div className="p-5 border-b border-neutral-800/80 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Contact Messages & Enquiries ({filteredMessages.length})</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-extrabold">
                    {unreadCount} Unread
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-neutral-400 mt-1">
                View, filter, search, and respond to product enquiries and general customer contact messages.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                  placeholder="Search name, product, email..."
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-lime-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition"
                />
                <FiSearch className="absolute left-3.5 top-3 text-neutral-500" size={15} />
              </div>
              <div>
                <select
                  value={messageFilter}
                  onChange={(e) => setMessageFilter(e.target.value)}
                  className="w-full bg-[#192218] border border-neutral-800 text-lime-400 text-xs rounded-2xl px-3 py-2.5 focus:outline-none focus:border-lime-500 cursor-pointer font-semibold"
                >
                  <option value="All" className="bg-neutral-900 text-white">All Messages</option>
                  <option value="Product Enquiries" className="bg-neutral-900 text-amber-400">📦 Product Enquiries</option>
                  <option value="General Messages" className="bg-neutral-900 text-white">💬 General Messages</option>
                  <option value="Unread" className="bg-neutral-900 text-white">Unread Messages</option>
                  <option value="Read" className="bg-neutral-900 text-white">Read Messages</option>
                </select>
              </div>
            </div>
          </div>

          {filteredMessages.length === 0 ? (
            <div className="p-8 sm:p-12 text-center space-y-3">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-600 mx-auto">
                <FiMessageSquare size={26} />
              </div>
              <h3 className="font-bold text-base text-white">No Contact Messages Found</h3>
              <p className="text-xs text-neutral-400">
                {searchTerm || messageFilter !== "All"
                  ? "No messages match your selected search or filter criteria."
                  : "Messages and product enquiries submitted via the store's Contact Us page will appear here."}
              </p>
            </div>
          ) : (
            <>
              {/* MOBILE RESPONSIVE CARDS VIEW (< md) */}
              <div className="grid grid-cols-1 gap-3.5 p-3 sm:p-4 md:hidden">
                {filteredMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-2xl border transition space-y-3 ${
                      msg.status === "unread"
                        ? "bg-lime-500/[0.04] border-lime-500/30 shadow-md shadow-lime-500/5"
                        : "bg-neutral-900/60 border-neutral-800"
                    }`}
                  >
                    {/* Header Row: ID, Date, Status */}
                    <div className="flex items-center justify-between gap-2 border-b border-neutral-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-lime-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                          {msg.id}
                        </span>
                        <span className="text-[10px] text-neutral-400">{msg.date}</span>
                      </div>
                      {msg.status === "unread" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-extrabold uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          Unread
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700/50 text-[10px] font-bold uppercase">
                          <FiCheckCircle size={10} />
                          Read
                        </span>
                      )}
                    </div>

                    {/* Customer & Contact Info */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-lime-500/20 text-lime-400 font-black flex items-center justify-center border border-lime-500/30 text-xs shrink-0">
                        {(msg.name || "C").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <h4 className="font-bold text-white text-sm truncate">{msg.name}</h4>
                        <div className="flex flex-col gap-0.5 text-xs">
                          <a href={`mailto:${msg.email}`} className="text-lime-400 font-semibold hover:underline truncate flex items-center gap-1">
                            <FiMail size={11} className="shrink-0" />
                            <span className="truncate">{msg.email}</span>
                          </a>
                          {msg.phone && (
                            <a href={`tel:${msg.phone}`} className="text-neutral-400 hover:text-white text-[11px] flex items-center gap-1">
                              <FiPhone size={11} className="shrink-0" />
                              <span>{msg.phone}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Product Badge if enquiry */}
                    {msg.product && (
                      <div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/products?search=${encodeURIComponent(msg.product)}`);
                          }}
                          className="w-full inline-flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-extrabold transition cursor-pointer hover:bg-amber-500/25"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FiPackage size={14} className="shrink-0 text-[#f5b800]" />
                            <span className="truncate">{msg.product}</span>
                          </div>
                          <FiExternalLink size={12} className="shrink-0 opacity-80" />
                        </button>
                      </div>
                    )}

                    {/* Message Preview */}
                    <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800/80">
                      <p className="text-neutral-300 text-xs line-clamp-2 italic">
                        "{msg.message}"
                      </p>
                    </div>

                    {/* Actions Footer */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-neutral-800/80">
                      <button
                        onClick={() => setSelectedMessage(msg)}
                        className="flex-1 py-2 px-3 rounded-xl bg-neutral-900 text-neutral-200 hover:text-white hover:bg-neutral-800 transition cursor-pointer border border-neutral-800 text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <FiEye size={14} />
                        <span>View Details</span>
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-2 rounded-xl bg-neutral-900 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer border border-neutral-800"
                        title="Delete Record"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP TABLE VIEW (hidden md:block) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="bg-neutral-900/90 text-neutral-400 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-800">
                      <th className="py-3.5 px-3 w-[14%]">Message ID & Date</th>
                      <th className="py-3.5 px-3 w-[16%]">Customer Details</th>
                      <th className="py-3.5 px-3 w-[20%]">Contact Info</th>
                      <th className="py-3.5 px-3 w-[22%]">Enquiry / Item</th>
                      <th className="py-3.5 px-3 w-[16%]">Message Preview</th>
                      <th className="py-3.5 px-3 w-[10%]">Status</th>
                      <th className="py-3.5 px-3 w-[12%] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/80 text-xs">
                    {filteredMessages.map((msg) => (
                      <tr
                        key={msg.id}
                        className={`hover:bg-neutral-900/50 transition ${
                          msg.status === "unread" ? "bg-lime-500/[0.03]" : ""
                        }`}
                      >
                        {/* ID & Date */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-1">
                            <span className="font-mono text-[11px] font-bold text-lime-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 inline-block truncate max-w-full">
                              {msg.id}
                            </span>
                            <span className="text-[10px] text-neutral-400 block truncate">
                              {msg.date}
                            </span>
                          </div>
                        </td>

                        {/* Customer Details */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-lime-500/20 text-lime-400 font-black flex items-center justify-center border border-lime-500/30 text-xs shrink-0">
                              {(msg.name || "C").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-white block text-xs truncate" title={msg.name}>{msg.name}</span>
                              <span className="text-[10px] text-neutral-500 block truncate">
                                {msg.product ? "Product Customer" : "General Customer"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Contact Info */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-1 min-w-0">
                            <a
                              href={`mailto:${msg.email}`}
                              className="flex items-center gap-1.5 text-lime-400 font-semibold hover:underline text-xs truncate"
                              title={msg.email}
                            >
                              <FiMail size={12} className="shrink-0" />
                              <span className="truncate">{msg.email}</span>
                            </a>
                            <a
                              href={`tel:${msg.phone}`}
                              className="flex items-center gap-1.5 text-neutral-300 hover:text-white text-[11px] truncate"
                            >
                              <FiPhone size={12} className="text-neutral-500 shrink-0" />
                              <span className="truncate">{msg.phone}</span>
                            </a>
                          </div>
                        </td>

                        {/* Product Name & Subject */}
                        <td className="py-3.5 px-3">
                          {msg.product ? (
                            <div className="space-y-1 min-w-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/admin/products?search=${encodeURIComponent(msg.product)}`);
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 text-[11px] font-extrabold max-w-full transition cursor-pointer group/item min-w-0"
                                title={`Click to view "${msg.product}" in Admin Supplements catalog`}
                              >
                                <FiPackage size={12} className="shrink-0 text-[#f5b800] group-hover/item:scale-110 transition-transform" />
                                <span className="truncate max-w-[140px] sm:max-w-[160px]">{msg.product}</span>
                                <FiExternalLink size={10} className="shrink-0 opacity-75 group-hover/item:opacity-100" />
                              </button>
                              {msg.subject && msg.subject !== `Enquiry for ${msg.product}` && (
                                <span className="text-[10px] text-neutral-400 block truncate font-medium">
                                  Subj: {msg.subject}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="min-w-0">
                              <span className="font-semibold text-neutral-300 block truncate text-xs">
                                {msg.subject || "General Contact"}
                              </span>
                              <span className="text-[10px] text-neutral-500 block truncate">Contact Form</span>
                            </div>
                          )}
                        </td>

                        {/* Message Preview */}
                        <td className="py-3.5 px-3">
                          <div className="bg-neutral-900/80 p-2 rounded-xl border border-neutral-800 min-w-0">
                            <p className="text-neutral-300 text-xs truncate font-medium" title={msg.message}>
                              "{msg.message}"
                            </p>
                          </div>
                        </td>

                        {/* Status Tag */}
                        <td className="py-3.5 px-3">
                          {msg.status === "unread" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-extrabold uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              Unread
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700/50 text-[10px] font-bold uppercase">
                              <FiCheckCircle size={10} />
                              Read
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedMessage(msg)}
                              className="p-2 rounded-xl bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 transition cursor-pointer border border-neutral-800"
                              title="View Full Message Details"
                            >
                              <FiEye size={15} />
                            </button>

                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="p-2 rounded-xl bg-neutral-900 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer border border-neutral-800"
                              title="Delete Record"
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* FULL MESSAGE DETAILS MODAL */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#141813] border border-neutral-800 rounded-3xl p-4 sm:p-8 space-y-5 relative shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto my-auto">

            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-lime-500/20 text-lime-400 font-black flex items-center justify-center border border-lime-500/30 text-base">
                  {(selectedMessage.name || "C").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-white">
                    {selectedMessage.name}
                  </h3>
                  <span className="text-xs text-neutral-400 font-mono">
                    ID: {selectedMessage.id} • {selectedMessage.date}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Product Enquiry Box (if product present) */}
            {selectedMessage.product && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-[#f5b800] shrink-0">
                    <FiPackage size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black text-[#f5b800] uppercase tracking-wider block">
                      Product Enquiry Item
                    </span>
                    <h4 className="text-xs font-extrabold text-white truncate">
                      {selectedMessage.product}
                    </h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const prodName = selectedMessage.product;
                    setSelectedMessage(null);
                    navigate(`/admin/products?search=${encodeURIComponent(prodName)}`);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-[11px] font-extrabold hover:bg-amber-400 transition shrink-0 flex items-center gap-1 cursor-pointer shadow-md shadow-amber-500/20"
                  title="View this product in Admin Supplements list"
                >
                  <span>View Product</span>
                  <FiExternalLink size={12} />
                </button>
              </div>
            )}

            {/* Subject Line if present */}
            {selectedMessage.subject && (
              <div className="bg-neutral-900/90 p-3 rounded-2xl border border-neutral-800 text-xs">
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Subject / Topic</span>
                <span className="text-amber-300 font-semibold">{selectedMessage.subject}</span>
              </div>
            )}

            {/* Quick Contact Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-900 p-3.5 rounded-2xl border border-neutral-800 text-xs">
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Email Address</span>
                <a href={`mailto:${selectedMessage.email}`} className="text-lime-400 font-bold hover:underline">
                  {selectedMessage.email}
                </a>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Phone Number</span>
                <a href={`tel:${selectedMessage.phone}`} className="text-white font-bold hover:underline">
                  {selectedMessage.phone}
                </a>
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
                Customer Message / Enquiry:
              </span>
              <div className="bg-neutral-900/90 p-4 rounded-2xl border border-neutral-800 text-xs text-neutral-200 leading-relaxed whitespace-pre-line font-medium max-h-52 overflow-y-auto">
                {selectedMessage.message}
              </div>
            </div>

            {/* Footer Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-800 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleToggleRead(selectedMessage.id);
                    setSelectedMessage((prev) => ({
                      ...prev,
                      status: prev.status === "read" ? "unread" : "read",
                    }));
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    selectedMessage.status === "unread"
                      ? "bg-lime-500 text-neutral-950 border-lime-400 hover:bg-lime-400 font-extrabold"
                      : "bg-neutral-900 text-neutral-300 border-neutral-800 hover:text-white"
                  }`}
                >
                  {selectedMessage.status === "unread" ? "Mark Read" : "Mark Unread"}
                </button>

                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject || selectedMessage.product || "FRD Nutrition Enquiry")}&body=${encodeURIComponent(`Hi ${selectedMessage.name},\n\nThank you for reaching out regarding ${selectedMessage.product || "your enquiry"}.\n\n`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 hover:bg-amber-400 transition"
                >
                  <FiMail size={13} />
                  <span>Reply via Email</span>
                </a>
              </div>

              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-bold text-white hover:bg-neutral-800 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#141813] border border-neutral-800 rounded-3xl p-4 sm:p-8 space-y-5 sm:space-y-6 relative shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto my-auto">

            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-xl font-black text-white">
                    Order #{selectedOrder.id}
                  </h3>
                  <select
                    value={selectedOrder.status || "In Transit"}
                    onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                    className="bg-[#192218] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 font-semibold focus:outline-none focus:border-lime-500 flex-1 sm:flex-none cursor-pointer"
                  >
                    <option value="Ordered" className="bg-neutral-900 text-white">Ordered</option>
                    <option value="Shipped" className="bg-neutral-900 text-white">Shipped</option>
                    <option value="Out for Delivery" className="bg-neutral-900 text-white">Out for Delivery</option>
                    <option value="Delivered" className="bg-neutral-900 text-white">Delivered</option>
                    <option value="Cancelled" className="bg-neutral-900 text-red-400">Cancelled</option>
                    <option value="Refunded" className="bg-neutral-900 text-[#f5b800]">Refunded</option>
                    <option value="Returned" className="bg-neutral-900 text-amber-400">Returned</option>
                  </select>
                </div>
                <span className="text-xs text-neutral-400 block mt-0.5">
                  Placed on {selectedOrder.date || selectedOrder.orderDate} • {selectedOrder.orderTime || ""}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Customer Details Block */}
            <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 space-y-3 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-lime-400 block">
                Customer & Shipping Info
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-neutral-500 block">Full Name:</span>
                  <span className="font-bold text-white text-sm">
                    {selectedOrder.customer?.fullName || selectedOrder.shippingAddress?.name || "Customer"}
                  </span>
                </div>

                <div>
                  <span className="text-neutral-500 block">Phone Number:</span>
                  <span className="font-bold text-lime-400">
                    {selectedOrder.customer?.phone || selectedOrder.shippingAddress?.phone || "N/A"}
                  </span>
                </div>

                {selectedOrder.customer?.email && (
                  <div>
                    <span className="text-neutral-500 block">Email Address:</span>
                    <span className="font-bold text-neutral-200">
                      {selectedOrder.customer.email}
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-neutral-500 block">Payment Method:</span>
                  <span className="font-bold text-white uppercase">
                    {selectedOrder.customer?.paymentMethod || selectedOrder.paymentMethod || "Prepaid"}
                  </span>
                </div>
              </div>

              {(selectedOrder.customer?.address || selectedOrder.shippingAddress?.address) && (
                <div className="pt-2 border-t border-neutral-800">
                  <span className="text-neutral-500 block text-[10px] uppercase font-bold">Delivery Address:</span>
                  <p className="text-neutral-300 font-medium text-xs mt-0.5">
                    {selectedOrder.customer?.address || selectedOrder.shippingAddress?.address}
                  </p>
                </div>
              )}

              {/* Courier Partner & AWB Tracking Section */}
              <div className="pt-3 border-t border-neutral-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-lime-400 block">
                  Delivery Logistics & Courier Tracking
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                      Courier Partner Name:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BlueDart, Delhivery, DTDC"
                      value={selectedOrder.courierName || ""}
                      onChange={(e) => updateOrderData(selectedOrder.id, { courierName: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white placeholder-neutral-600 focus:border-lime-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                      AWB Tracking Number:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AWB-987654321"
                      value={selectedOrder.awbTrackingNumber || ""}
                      onChange={(e) => updateOrderData(selectedOrder.id, { awbTrackingNumber: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white placeholder-neutral-600 focus:border-lime-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Purchased Items List */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
                Purchased Items ({selectedOrder.items?.length || 0}):
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product?.image || item.image}
                        alt={item.product?.name || item.name}
                        className="w-9 h-9 object-contain rounded bg-neutral-950 p-1 shrink-0"
                      />
                      <div>
                        <span className="font-bold text-white block">
                          {item.product?.name || item.name}
                        </span>
                        <span className="text-[10px] text-neutral-400 block">
                          Flavor: {item.selectedFlavor || item.flavor || "Standard"} • Size: {item.selectedSize || item.size || "Standard"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-lime-400 block">
                        ₹{(item.product?.price || item.price) * item.quantity}
                      </span>
                      <span className="text-[10px] text-neutral-500 block">
                        Qty: {item.quantity} x ₹{item.product?.price || item.price}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Paid Summary */}
            <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-2xl border border-neutral-800 text-xs">
              <span className="font-bold text-white">Total Amount Paid:</span>
              <span className="font-black text-xl text-lime-400">
                ₹{selectedOrder.total || selectedOrder.totalAmount || 0}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
              <button
                onClick={() => handleToggleOrderRead(selectedOrder.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  selectedOrder.readStatus === "unread"
                    ? "bg-lime-500 text-neutral-950 border-lime-400 hover:bg-lime-400 font-extrabold"
                    : "bg-neutral-900 text-neutral-300 border-neutral-800 hover:text-white"
                }`}
              >
                {selectedOrder.readStatus === "unread" ? "Mark as Read" : "Mark as Unread"}
              </button>

              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2.5 rounded-xl bg-lime-500 text-neutral-950 font-bold hover:bg-lime-400 transition text-xs cursor-pointer shadow-lg shadow-lime-500/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}