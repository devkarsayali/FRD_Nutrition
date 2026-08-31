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
  FiEdit,
  FiFileText,
  FiPlus,
  FiFilter,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { useCart } from "../../context/CartContext";
import { useProducts } from "../../context/ProductContext";
import AddOfflineSaleModal from "../../components/admin/AddOfflineSaleModal";
import OfflineSaleBillModal from "../../components/admin/OfflineSaleBillModal";
import toast from "react-hot-toast";
import { useOutletContext, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { db } from "../../firebase/firebase.config";
import { collection, doc, getDocs, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";

export const formatPaymentMethod = (method) => {
  if (!method) return "ONLINE";
  const m = String(method).toLowerCase().trim();
  if (m.includes("cod") || m.includes("cash")) return "CASH";
  return "ONLINE";
};

export const formatWhatsAppPhone = (phone) => {
  if (!phone) return "";
  const cleaned = String(phone).replace(/\D/g, "");
  if (!cleaned) return "";
  if (cleaned.length === 10) return `91${cleaned}`;
  if (cleaned.length === 12 && cleaned.startsWith("91")) return cleaned;
  if (cleaned.startsWith("91")) return cleaned;
  return `91${cleaned.slice(-10)}`;
};

export const buildWhatsAppMessageText = (msg, productsList = []) => {
  if (!msg) return "";
  const custName = msg.name || "Valued Customer";
  const userQuery = msg.message || "";
  const rawProdName = msg.product || msg.productName || "";

  let matchedProduct = null;
  if (rawProdName) {
    const normSearch = rawProdName.toLowerCase().trim();
    matchedProduct = (productsList || []).find((p) => {
      const pNameNorm = (p.name || "").toLowerCase().trim();
      return (
        pNameNorm === normSearch ||
        normSearch.includes(pNameNorm) ||
        pNameNorm.includes(normSearch) ||
        (msg.productId && p.id === msg.productId)
      );
    });
  }

  const isProductEnquiry = Boolean(rawProdName || msg.type === "Product Enquiry" || matchedProduct);

  if (isProductEnquiry && (rawProdName || matchedProduct)) {
    const productName = matchedProduct?.name || rawProdName;
    const category = matchedProduct?.category || "Supplements";
    const sellingPrice = matchedProduct?.price ? Number(matchedProduct.price) : null;
    const mrpVal = (matchedProduct?.originalPrice || matchedProduct?.mrp) ? Number(matchedProduct?.originalPrice || matchedProduct?.mrp) : null;

    let priceDetailStr = "";
    if (sellingPrice && mrpVal && mrpVal > sellingPrice) {
      priceDetailStr = `₹${sellingPrice} (MRP: ₹${mrpVal})`;
    } else if (sellingPrice && mrpVal) {
      priceDetailStr = `₹${sellingPrice} (MRP: ₹${mrpVal})`;
    } else if (sellingPrice) {
      priceDetailStr = `₹${sellingPrice}`;
    } else {
      priceDetailStr = "Special Pricing Available";
    }

    const stockStatus = matchedProduct
      ? matchedProduct.inStock !== false
        ? "In Stock"
        : "Out of Stock"
      : "In Stock";
    const authenticity = "100% Authentic Guaranteed";

    return (
      `Hi ${custName},\n\n` +
      `Thank you for reaching out to FRD Nutrition! Here are the details regarding your enquiry for *${productName}*:\n\n` +
      `*Product Details:*\n` +
      `• Category: ${category}\n` +
      `• Special Price: ${priceDetailStr}\n` +
      `• Availability: ${stockStatus} (${authenticity})\n\n` +
      `*Your Query:*\n` +
      `‘${userQuery}’\n\n` +
      `Please let us know if you need any assistance placing your order or have any questions!`
    );
  } else {
    return (
      `Hi ${custName},\n\n` +
      `Thank you for reaching out to FRD Nutrition!\n\n` +
      `Regarding your enquiry:\n` +
      `‘${userQuery}’\n\n` +
      `Please let us know how we can assist you further or if you have any questions!`
    );
  }
};

export default function AdminOrdersPage({ defaultTab }) {
  const { orders: cartContextOrders } = useCart();
  const { products } = useProducts();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const outletContext = useOutletContext();
  const globalSearch = outletContext?.searchQuery || "";

  const isMessages =
    defaultTab === "messages" ||
    location.pathname.includes("/admin/messages") ||
    searchParams.get("tab") === "messages";

  const initialSourceParam = searchParams.get("source");
  const [orderSourceFilter, setOrderSourceFilter] = useState(
    initialSourceParam === "offline" ? "Offline" : initialSourceParam === "online" ? "Online" : "All"
  );
  const [activeTab, setActiveTab] = useState(isMessages ? "messages" : "orders");

  useEffect(() => {
    const src = searchParams.get("source");
    if (src === "offline") setOrderSourceFilter("Offline");
    else if (src === "online") setOrderSourceFilter("Online");
  }, [searchParams]);
  const [allOrders, setAllOrders] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [messageFilter, setMessageFilter] = useState("All");

  const [isAddOfflineModalOpen, setIsAddOfflineModalOpen] = useState(false);
  const [isEditOfflineModalOpen, setIsEditOfflineModalOpen] = useState(false);
  const [editingOfflineSale, setEditingOfflineSale] = useState(null);
  const [selectedBillSale, setSelectedBillSale] = useState(null);

  const [dateFilter, setDateFilter] = useState("this_month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const searchTerm = globalSearch || localSearchTerm;

  useEffect(() => {
    if (selectedMessage || selectedOrder || isAddOfflineModalOpen || isEditOfflineModalOpen || selectedBillSale) {
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
  }, [selectedMessage, selectedOrder, isAddOfflineModalOpen, isEditOfflineModalOpen, selectedBillSale]);

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

    let unsubscribeFirestore = () => {};
    try {
      unsubscribeFirestore = onSnapshot(
        collection(db, "contact_messages"),
        (snapshot) => {
          const firestoreMsgs = [];
          snapshot.forEach((docSnap) => {
            firestoreMsgs.push({ id: docSnap.id, ...docSnap.data() });
          });

          let localMsgs = [];
          try {
            localMsgs = JSON.parse(localStorage.getItem("frd_contact_messages") || "[]");
          } catch {}

          const msgMap = new Map();
          firestoreMsgs.forEach((m) => msgMap.set(m.id, m));
          localMsgs.forEach((m) => {
            if (!msgMap.has(m.id)) msgMap.set(m.id, m);
          });

          const merged = Array.from(msgMap.values());
          merged.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
          setContactMessages(merged);
        },
        (err) => {
          console.warn("Firestore snapshot warning:", err);
        }
      );
    } catch (err) {
      console.warn("Firestore listener setup error:", err);
    }

    let unsubscribeOrders = () => {};
    try {
      unsubscribeOrders = onSnapshot(
        collection(db, "orders"),
        (snapshot) => {
          const firestoreOrders = [];
          snapshot.forEach((docSnap) => {
            firestoreOrders.push({ id: docSnap.id, ...docSnap.data() });
          });
          loadOrders(firestoreOrders);
        },
        (err) => {
          console.warn("Firestore orders snapshot warning:", err);
        }
      );
    } catch (err) {
      console.warn("Firestore orders listener setup error:", err);
    }

    let unsubscribeSales = () => {};
    try {
      unsubscribeSales = onSnapshot(
        collection(db, "sales"),
        () => {
          loadOrders();
        },
        (err) => {
          console.warn("Firestore sales snapshot warning:", err);
        }
      );
    } catch (err) {
      console.warn("Firestore sales listener setup error:", err);
    }

    const handleOrdersUpdate = () => loadOrders();
    const handleMessagesUpdate = () => loadMessages();
    const handleSalesUpdate = () => loadOrders();

    window.addEventListener("frd_orders_updated", handleOrdersUpdate);
    window.addEventListener("frd_sales_updated", handleSalesUpdate);
    window.addEventListener("frd_contact_messages_updated", handleMessagesUpdate);
    window.addEventListener("storage", handleOrdersUpdate);
    window.addEventListener("storage", handleSalesUpdate);
    window.addEventListener("storage", handleMessagesUpdate);

    return () => {
      if (typeof unsubscribeFirestore === "function") unsubscribeFirestore();
      if (typeof unsubscribeOrders === "function") unsubscribeOrders();
      if (typeof unsubscribeSales === "function") unsubscribeSales();
      window.removeEventListener("frd_orders_updated", handleOrdersUpdate);
      window.removeEventListener("frd_sales_updated", handleSalesUpdate);
      window.removeEventListener("frd_contact_messages_updated", handleMessagesUpdate);
      window.removeEventListener("storage", handleOrdersUpdate);
      window.removeEventListener("storage", handleSalesUpdate);
      window.removeEventListener("storage", handleMessagesUpdate);
    };
  }, [cartContextOrders]);

  const loadMessages = async () => {
    try {
      let firestoreMsgs = [];
      try {
        const snap = await getDocs(collection(db, "contact_messages"));
        snap.forEach((docSnap) => {
          firestoreMsgs.push({ id: docSnap.id, ...docSnap.data() });
        });
      } catch (fErr) {
        console.warn("Firebase messages load warning:", fErr);
      }

      let localMsgs = [];
      try {
        localMsgs = JSON.parse(localStorage.getItem("frd_contact_messages") || "[]");
      } catch {}

      const msgMap = new Map();
      firestoreMsgs.forEach((m) => msgMap.set(m.id, m));
      localMsgs.forEach((m) => {
        if (!msgMap.has(m.id)) msgMap.set(m.id, m);
      });

      const merged = Array.from(msgMap.values());
      setContactMessages(merged);
    } catch (err) {
      console.error("Failed to load contact messages:", err);
    }
  };

  const loadOrders = async (providedFirestoreOrders = null) => {
    try {
      const orderMap = new Map();

      const formatFirestoreOrder = (o) => ({
        ...o,
        orderType: "online",
        customer: {
          fullName: o.customer?.fullName || o.shippingAddress?.name || "Customer",
          phone: o.customer?.phone || o.shippingAddress?.phone || "N/A",
          email: o.customer?.email || "",
          address: o.customer?.address || o.shippingAddress?.address || "",
          paymentMethod: formatPaymentMethod(o.customer?.paymentMethod || o.paymentMethod),
        },
        items: o.items || [],
        readStatus: o.readStatus || "unread",
      });

      if (Array.isArray(providedFirestoreOrders)) {
        providedFirestoreOrders.forEach((o) => {
          if (o && o.id) orderMap.set(o.id, formatFirestoreOrder(o));
        });
      } else {
        try {
          const snap = await getDocs(collection(db, "orders"));
          snap.forEach((docSnap) => {
            const o = { id: docSnap.id, ...docSnap.data() };
            orderMap.set(o.id, formatFirestoreOrder(o));
          });
        } catch (fErr) {
          console.warn("Firestore loadOrders warning:", fErr);
        }
      }

      const addSecondaryOrderToMap = (o) => {
        if (!o || !o.id) return;
        if (!o.items || o.items.length === 0) {
          if (!o.customer?.email && !o.shippingAddress?.email && !o.total && !o.totalAmount) return;
        }

        const existing = orderMap.get(o.id);
        if (!existing) {
          orderMap.set(o.id, formatFirestoreOrder(o));
        } else {
          const merged = {
            ...o,
            ...existing,
            orderType: "online",
            customer: {
              fullName: existing.customer?.fullName || o.customer?.fullName || o.shippingAddress?.name || "Customer",
              phone: existing.customer?.phone || o.customer?.phone || o.shippingAddress?.phone || "N/A",
              email: existing.customer?.email || o.customer?.email || "",
              address: existing.customer?.address || o.customer?.address || o.shippingAddress?.address || "",
              paymentMethod: formatPaymentMethod(existing.customer?.paymentMethod || o.customer?.paymentMethod || o.paymentMethod),
            },
            items: existing.items?.length ? existing.items : o.items || [],
            readStatus: existing.readStatus !== undefined ? existing.readStatus : o.readStatus || "unread",
            status: existing.status || o.status || "Ordered",
          };
          orderMap.set(o.id, merged);
        }
      };

      if (Array.isArray(cartContextOrders)) {
        cartContextOrders.forEach(addSecondaryOrderToMap);
      }

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.toLowerCase().includes("order") && !key.includes("offline")) {
          try {
            const parsed = JSON.parse(localStorage.getItem(key) || "[]");
            if (Array.isArray(parsed)) {
              parsed.forEach(addSecondaryOrderToMap);
            } else if (parsed && parsed.id) {
              addSecondaryOrderToMap(parsed);
            }
          } catch (e) {}
        }
      }

      const offlineMap = new Map();
      try {
        const salesSnap = await getDocs(collection(db, "sales"));
        salesSnap.forEach((docSnap) => {
          const data = { id: docSnap.id, ...docSnap.data() };
          offlineMap.set(data.id, data);
        });
      } catch (sErr) {
        console.warn("Firestore loadSales warning:", sErr);
      }

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

      offlineMap.forEach((sale) => {
        const dateObj = sale.saleDate ? new Date(sale.saleDate) : sale.createdAt ? new Date(sale.createdAt) : null;
        const formattedDate = dateObj && !isNaN(dateObj) ? dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : (sale.date || "Recent");
        const formattedTime = dateObj && !isNaN(dateObj) ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

        const formattedOfflineOrder = {
          ...sale,
          orderType: "offline",
          id: sale.id,
          displayId: sale.billNumber || sale.id,
          date: formattedDate,
          orderDate: formattedDate,
          orderTime: formattedTime,
          status: "Completed",
          total: sale.totalAmount ?? sale.total ?? 0,
          totalAmount: sale.totalAmount ?? sale.total ?? 0,
          subtotal: sale.subtotal || sale.totalAmount || 0,
          discount: sale.discount || 0,
          readStatus: "read",
          customer: {
            fullName: sale.customer?.name || sale.customer?.fullName || "Walk-in Customer",
            name: sale.customer?.name || sale.customer?.fullName || "Walk-in Customer",
            phone: sale.customer?.phone || "N/A",
            email: sale.customer?.email || "",
            address: sale.customer?.address || sale.customer?.city || "Physical Store / POS Sale",
            city: sale.customer?.city || "",
            paymentMethod: sale.paymentMethod ? String(sale.paymentMethod).toUpperCase() : "CASH",
          },
          items: sale.items || [],
          originalSale: sale,
        };

        orderMap.set(sale.id, formattedOfflineOrder);
      });

      const combined = Array.from(orderMap.values());
      combined.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.saleDate || a.date || 0).getTime();
        const timeB = new Date(b.createdAt || b.saleDate || b.date || 0).getTime();
        return timeB - timeA;
      });

      setAllOrders(combined);

      if (providedFirestoreOrders) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.toLowerCase().includes("order") && !key.includes("offline")) {
            try {
              const data = JSON.parse(localStorage.getItem(key) || "[]");
              if (Array.isArray(data)) {
                let changed = false;
                const updated = data.map((localItem) => {
                  const match = orderMap.get(localItem.id);
                  if (match && match.orderType === "online" && (localItem.readStatus !== match.readStatus || localItem.status !== match.status)) {
                    changed = true;
                    return { ...localItem, readStatus: match.readStatus, status: match.status };
                  }
                  return localItem;
                });
                if (changed) {
                  localStorage.setItem(key, JSON.stringify(updated));
                }
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    }
  };

  const handleToggleRead = async (id) => {
    let newStat = "read";
    const updated = contactMessages.map((msg) => {
      if (msg.id === id) {
        newStat = msg.status === "read" ? "unread" : "read";
        return { ...msg, status: newStat };
      }
      return msg;
    });
    setContactMessages(updated);
    localStorage.setItem("frd_contact_messages", JSON.stringify(updated));

    try {
      await updateDoc(doc(db, "contact_messages", id), { status: newStat });
    } catch (err) {
      console.warn("Firestore update warning:", err);
    }

    window.dispatchEvent(new CustomEvent("frd_contact_messages_updated"));
    toast.success("Message status updated.");
  };

  const handleDeleteMessage = async (id) => {
    const updated = contactMessages.filter((msg) => msg.id !== id);
    setContactMessages(updated);
    localStorage.setItem("frd_contact_messages", JSON.stringify(updated));

    try {
      await deleteDoc(doc(db, "contact_messages", id));
    } catch (err) {
      console.warn("Firestore delete warning:", err);
    }

    if (selectedMessage?.id === id) setSelectedMessage(null);
    window.dispatchEvent(new CustomEvent("frd_contact_messages_updated"));
    toast.success("Message deleted.");
  };

  const { decreaseProductStock, restoreProductStock } = useProducts();

  const STATUS_STEPS = [
    "Ordered",
    "Packed",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
  ];

  const ORDER_STATUS_OPTIONS = [
    "All Statuses",
    "Ordered",
    "Packed",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
  ];

  const updateOrderData = (orderId, updateFields) => {
    const targetOrder = allOrders.find((o) => o.id === orderId);
    const isOffline = targetOrder?.orderType === "offline";

    const updatedOrders = allOrders.map((order) => {
      if (order.id !== orderId) return order;
      return { ...order, ...updateFields };
    });
    setAllOrders(updatedOrders);

    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => ({ ...prev, ...updateFields }));
    }

    try {
      const collectionName = isOffline ? "sales" : "orders";
      updateDoc(doc(db, collectionName, orderId), updateFields).catch((err) => {
        console.warn(`Firestore ${collectionName} update warning:`, err);
      });
    } catch (fErr) {
      console.warn("Firestore error:", fErr);
    }

    if (isOffline) {
      try {
        const saved = JSON.parse(localStorage.getItem("frd_offline_sales_v1") || "[]");
        if (Array.isArray(saved)) {
          const updated = saved.map((o) => (o.id === orderId ? { ...o, ...updateFields } : o));
          localStorage.setItem("frd_offline_sales_v1", JSON.stringify(updated));
        }
      } catch (e) {}
      window.dispatchEvent(new CustomEvent("frd_sales_updated"));
    } else {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.toLowerCase().includes("order") && !key.includes("offline")) {
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
          } catch (e) {}
        }
      }
      window.dispatchEvent(new CustomEvent("frd_orders_updated"));
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!orderId) return;

    const targetOrder = allOrders.find((o) => o.id === orderId);
    const isOffline = targetOrder?.orderType === "offline";

    if (!window.confirm(`Are you sure you want to delete ${isOffline ? "offline sale" : "order"} #${targetOrder?.displayId || orderId}? This cannot be undone.`)) return;

    const custEmail = (targetOrder?.customer?.email || targetOrder?.shippingAddress?.email || "").toLowerCase().trim();

    const remainingOrders = allOrders.filter((o) => o.id !== orderId);
    setAllOrders(remainingOrders);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(null);
    }

    if (isOffline) {
      try {
        if (Array.isArray(targetOrder.items)) {
          restoreProductStock(targetOrder.items);
        }

        await deleteDoc(doc(db, "sales", orderId));

        try {
          const saved = JSON.parse(localStorage.getItem("frd_offline_sales_v1") || "[]");
          if (Array.isArray(saved)) {
            const updated = saved.filter((o) => o.id !== orderId);
            localStorage.setItem("frd_offline_sales_v1", JSON.stringify(updated));
          }
        } catch (e) {}
        window.dispatchEvent(new CustomEvent("frd_sales_updated"));
        toast.success(`Offline sale #${targetOrder?.displayId || orderId} deleted and product stock restored!`);
      } catch (err) {
        console.error("Firestore sales delete warning:", err);
        toast.error("Failed to delete offline sale.");
      }
    } else {
      try {
        await deleteDoc(doc(db, "orders", orderId));
      } catch (err) {
        console.warn("Firestore order delete warning:", err);
      }

      if (custEmail && custEmail !== "n/a") {
        const hasOtherOrders = remainingOrders.some((o) => {
          const e = (o.customer?.email || o.shippingAddress?.email || "").toLowerCase().trim();
          return e === custEmail;
        });

        if (!hasOtherOrders) {
          try {
            await deleteDoc(doc(db, "users", custEmail));
          } catch (uErr) {
            console.warn("Firestore user cleanup warning:", uErr);
          }
          try {
            localStorage.removeItem(`frd_user_profile_${custEmail}`);
          } catch (e) {}
        }
      }

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.toLowerCase().includes("order") && !key.includes("offline")) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || "[]");
            if (Array.isArray(data)) {
              const updated = data.filter((o) => o.id !== orderId);
              localStorage.setItem(key, JSON.stringify(updated));
            }
          } catch (e) {}
        }
      }

      window.dispatchEvent(new CustomEvent("frd_orders_updated"));
      toast.success(`Online order #${orderId} deleted successfully.`);
    }
  };

  const handleEditOfflineSale = (order) => {
    setEditingOfflineSale(order.originalSale || order);
    setIsEditOfflineModalOpen(true);
  };

  const handlePrintOfflineBill = (order) => {
    setSelectedBillSale(order.originalSale || order);
  };

  const getStatusStepIndex = (status) => {
    if (!status) return 0;
    const s = status.toLowerCase().trim();
    if (s.includes("delivered") || s.includes("completed")) return 3;
    if (s.includes("out for delivery") || s.includes("out_for_delivery")) return 2;
    if (s.includes("packed")) return 1;
    return 0; // Ordered
  };

  const RESTORABLE_STATUSES = ["cancelled", "rejected", "refunded", "returned"];

  const handleStatusChange = (orderId, newStatus) => {
    const currentOrder = allOrders.find((o) => o.id === orderId);
    if (!currentOrder) return;

    const currentIndex = getStatusStepIndex(currentOrder.status);
    const targetIndex = getStatusStepIndex(newStatus);
    const normNewStatus = (newStatus || "").toLowerCase().trim();
    const isNewStatusRestorable = RESTORABLE_STATUSES.includes(normNewStatus);

    if (!isNewStatusRestorable && targetIndex < currentIndex) {
      toast.error(`Cannot move order status backwards from "${currentOrder.status}" to "${newStatus}".`);
      return;
    }

    const defaultSteps = [
      { title: "Ordered", time: "Order Received", completed: true },
      { title: "Packed", time: "Warehouse Packed", completed: false },
      { title: "Out for Delivery", time: "In Transit", completed: false },
      { title: "Delivered", time: "Handed Over", completed: false },
    ];

    const currentSteps =
      currentOrder?.trackingSteps && currentOrder.trackingSteps.length >= 4
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
      toast.success(`Order #${currentOrder.displayId || orderId} set to "${newStatus}". Product stock automatically restored!`);
    } else if (!isNewStatusRestorable && currentOrder.stockRestored) {
      decreaseProductStock(currentOrder.items || []);
      nextStockRestored = false;
      toast.success(`Order #${currentOrder.displayId || orderId} set to "${newStatus}". Product stock re-deducted!`);
    } else {
      toast.success(`Order #${currentOrder.displayId || orderId} status updated to "${newStatus}"`);
    }

    updateOrderData(orderId, {
      status: newStatus,
      stockRestored: nextStockRestored,
      trackingSteps: updatedTrackingSteps,
    });
  };

  const handleToggleOrderRead = (id) => {
    const targetOrder = allOrders.find((o) => o.id === id);
    if (!targetOrder) return;
    const nextReadStatus = targetOrder.readStatus === "unread" ? "read" : "unread";
    updateOrderData(id, { readStatus: nextReadStatus });
    toast.success("Order status updated.");
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    if (order.readStatus === "unread") {
      updateOrderData(order.id, { readStatus: "read" });
    }
  };

  const unreadCount = contactMessages.filter((m) => m.status === "unread").length;

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

  const matchesDateFilter = (orderDate) => {
    if (!orderDate || dateFilter === "all") return true;
    const d = new Date(orderDate);
    if (isNaN(d.getTime())) return true;

    const now = new Date();
    if (dateFilter === "today") {
      return isSameDay(d, now);
    } else if (dateFilter === "yesterday") {
      const yest = new Date(now);
      yest.setDate(now.getDate() - 1);
      return isSameDay(d, yest);
    } else if (dateFilter === "this_week") {
      const weekRange = getWeekRange(now);
      return d >= weekRange.start && d <= weekRange.end;
    } else if (dateFilter === "this_month") {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    } else if (dateFilter === "this_year") {
      return d.getFullYear() === now.getFullYear();
    } else if (dateFilter === "custom") {
      if (startDate && new Date(startDate) > d) return false;
      if (endDate) {
        const endD = new Date(endDate);
        endD.setHours(23, 59, 59, 999);
        if (endD < d) return false;
      }
      return true;
    }
    return true;
  };

  const filteredOrders = allOrders.filter((o) => {
    const orderDateRaw = o.createdAt || o.saleDate || o.orderDate || o.date;
    const dateMatch = matchesDateFilter(orderDateRaw);

    const statusMatch =
      statusFilter === "All" ||
      statusFilter === "All Statuses" ||
      (o.orderType === "online" && getNormalizedStatus(o.status) === getNormalizedStatus(statusFilter));

    const sourceMatch =
      orderSourceFilter === "All" ||
      orderSourceFilter === "all" ||
      ((orderSourceFilter === "Online" || orderSourceFilter === "online") && o.orderType === "online") ||
      ((orderSourceFilter === "Offline" || orderSourceFilter === "offline") && o.orderType === "offline");

    const query = searchTerm.toLowerCase().trim();
    if (!query) return dateMatch && statusMatch && sourceMatch;

    const queryClean = query.replace(/^#/, "");

    const idStr = String(o.id || "").toLowerCase();
    const displayIdStr = String(o.displayId || "").toLowerCase();
    const billNumStr = String(o.billNumber || "").toLowerCase();

    // Extract digits for numeric matching (e.g. searching "8" or "88" matches FRD-OFF-000008 or #FRD-03873)
    const digitsOnlyQuery = queryClean.replace(/\D/g, "");

    const matchesId =
      idStr.includes(queryClean) ||
      displayIdStr.includes(queryClean) ||
      billNumStr.includes(queryClean) ||
      (digitsOnlyQuery && (
        idStr.includes(digitsOnlyQuery) ||
        displayIdStr.includes(digitsOnlyQuery) ||
        billNumStr.includes(digitsOnlyQuery)
      ));

    const custName = (o.customer?.fullName || o.customer?.name || o.shippingAddress?.name || "").toLowerCase();
    const custPhone = String(o.customer?.phone || o.shippingAddress?.phone || "").toLowerCase();
    const custEmail = String(o.customer?.email || "").toLowerCase();

    const matchesCustomer =
      custName.includes(query) ||
      custPhone.includes(queryClean) ||
      custEmail.includes(query);

    const matchesProducts = (o.items || []).some((it) =>
      (it.name || it.product?.name || "").toLowerCase().includes(query)
    );

    return dateMatch && statusMatch && sourceMatch && (matchesId || matchesCustomer || matchesProducts);
  });

  return (
    <div className="space-y-6">
      {/* TAB 1: CUSTOMER ORDERS & OFFLINE SALES DATA TABLE */}
      {activeTab === "orders" && (
        <div className="bg-[#141813] rounded-3xl border border-neutral-800 overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-neutral-800/80 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-sm font-bold text-white uppercase tracking-wider">
                Customer Orders ({filteredOrders.length})
              </h2>
              <p className="text-[11px] text-neutral-400 mt-1">
                View online website customer orders and physical offline store sales together in one place.
              </p>
            </div>
            
            {/* + ADD OFFLINE STORE SALE BUTTON */}
            <button
              type="button"
              onClick={() => {
                setEditingOfflineSale(null);
                setIsAddOfflineModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-full bg-[#84cc16] hover:bg-[#65a30d] text-black font-black transition cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wide shadow-lg shadow-lime-500/20 active:scale-95"
            >
              <FiPlus size={18} className="stroke-[3]" />
              <span>ADD OFFLINE STORE SALE</span>
            </button>
          </div>

          {/* SALES REPORTING FILTERS SECTION */}
          <div className="p-5 border-b border-neutral-800/80 bg-neutral-900/40 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#84cc16] flex items-center gap-2">
                <FiFilter size={15} />
                <span>SALES REPORTING FILTERS</span>
              </span>
              <span className="text-[11px] font-semibold text-neutral-400">
                Showing {filteredOrders.length} of {allOrders.length} transactions
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* Date Period Dropdown */}
              <div>
                <label className="block text-neutral-400 font-bold mb-1 text-[11px]">Date Period</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-lime-500 cursor-pointer text-xs"
                >
                  <option value="this_month">This Month</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="this_week">This Week</option>
                  <option value="this_year">This Year</option>
                  <option value="all">All Time</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>

              {/* Custom Date Inputs or Sale Channel */}
              {dateFilter === "custom" ? (
                <div className="flex items-center gap-2 col-span-1">
                  <div className="w-1/2">
                    <label className="block text-neutral-400 font-bold mb-1 text-[11px]">From</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none focus:border-lime-500"
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="block text-neutral-400 font-bold mb-1 text-[11px]">To</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none focus:border-lime-500"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-neutral-400 font-bold mb-1 text-[11px]">Sale Channel</label>
                  <select
                    value={orderSourceFilter}
                    onChange={(e) => setOrderSourceFilter(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-lime-500 cursor-pointer text-xs"
                  >
                    <option value="All">All Sales (Online + Offline)</option>
                    <option value="Online">Online Orders Only</option>
                    <option value="Offline">Offline Physical Store Only</option>
                  </select>
                </div>
              )}

              {/* Order Status */}
              <div>
                <label className="block text-neutral-400 font-bold mb-1 text-[11px]">Order Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-lime-500 cursor-pointer text-xs"
                >
                  {ORDER_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Transactions */}
              <div>
                <label className="block text-neutral-400 font-bold mb-1 text-[11px]">Search Transactions</label>
                <div className="relative">
                  <FiSearch className="absolute left-3.5 top-3 text-neutral-500" size={15} />
                  <input
                    type="text"
                    value={localSearchTerm}
                    onChange={(e) => setLocalSearchTerm(e.target.value)}
                    placeholder="Search by customer name, phone, order ID, product..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500 transition"
                  />
                </div>
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
                {searchTerm || orderSourceFilter !== "All" || statusFilter !== "All Statuses"
                  ? "No customer orders or offline sales match your selected search or filter criteria."
                  : "When online orders are placed or offline store sales are recorded, they will appear here."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-900/90 text-neutral-400 font-bold uppercase text-[9px] tracking-wider border-b border-neutral-800">
                    <th className="py-3 px-3">Order ID & Date</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Customer & Contact</th>
                    <th className="py-3 px-3">Products Purchased</th>
                    <th className="py-3 px-2 text-center">Qty</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-2">Payment</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80 text-[11px]">
                  {filteredOrders.map((order) => {
                    const custName = order.customer?.fullName || order.customer?.name || order.shippingAddress?.name || "Customer";
                    const custEmail = order.customer?.email || "";
                    const custPhone = order.customer?.phone || order.shippingAddress?.phone || "N/A";
                    const orderTotal = order.total || order.totalAmount || 0;
                    const isOffline = order.orderType === "offline";
                    
                    const totalQty = (order.items || []).reduce((acc, item) => acc + Number(item.quantity || 1), 0);

                    return (
                      <tr
                        key={order.id}
                        className={`hover:bg-neutral-900/50 transition ${
                          order.readStatus === "unread" && !isOffline ? "bg-lime-500/[0.03]" : ""
                        }`}
                      >
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-[11px] font-black text-lime-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800 inline-block">
                                #{order.displayId || order.id}
                              </span>
                              {order.readStatus === "unread" && !isOffline && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[8px] font-black uppercase">
                                  <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                                  New
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-neutral-400 block">
                              {order.date || order.orderDate || "Recent"} {order.orderTime ? `• ${order.orderTime}` : ""}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          {isOffline ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] font-black uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              OFFLINE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-lime-500/15 text-lime-400 border border-lime-500/30 text-[9px] font-black uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                              ONLINE
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full font-black flex items-center justify-center text-[10px] shrink-0 border ${
                              isOffline ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-lime-500/20 text-lime-400 border-lime-500/30"
                            }`}>
                              {custName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-white block text-[11px] truncate max-w-[130px]">{custName}</span>
                              {custEmail && custEmail !== "N/A" ? (
                                <a href={`mailto:${custEmail}`} className="text-[10px] text-lime-400 hover:underline block truncate max-w-[130px]">
                                  {custEmail}
                                </a>
                              ) : custPhone !== "N/A" ? (
                                <a href={`tel:${custPhone}`} className="text-[10px] text-neutral-400 hover:text-white font-mono block">
                                  {custPhone}
                                </a>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="space-y-0.5 max-w-[200px] xl:max-w-[260px]">
                            {order.items && order.items.map((item, idx) => (
                              <span key={idx} className="block text-[10px] truncate text-neutral-300">
                                • <strong className="text-white">{item.product?.name || item.name}</strong> × {item.quantity} (₹{item.product?.price || item.price})
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3 px-2 text-center font-bold text-neutral-200">
                          {totalQty}
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <div>
                            <span className="font-black text-xs text-lime-400 block">
                              ₹{orderTotal}
                            </span>
                            {isOffline && Number(order.discount || 0) > 0 && (
                              <span className="text-[9px] text-amber-400 block font-semibold">
                                Disc: ₹{order.discount}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-2 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[9px] font-bold uppercase text-neutral-300">
                            {formatPaymentMethod(order.customer?.paymentMethod || order.paymentMethod)}
                          </span>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          {!isOffline ? (
                            (() => {
                              const curIdx = getStatusStepIndex(order.status);
                              const isCancelled = (order.status || "").toLowerCase().trim() === "cancelled";
                              return (
                                <select
                                  value={order.status || "Ordered"}
                                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                  className="bg-[#192218] border border-lime-500/40 text-lime-400 font-extrabold text-[10px] rounded-lg px-2 py-1 focus:outline-none focus:border-lime-400 cursor-pointer shadow-sm disabled:opacity-60"
                                >
                                  <option value="Ordered" disabled={curIdx > 0} className="bg-neutral-900 text-white disabled:text-neutral-600">Ordered</option>
                                  <option value="Packed" disabled={curIdx > 1} className="bg-neutral-900 text-white disabled:text-neutral-600">Packed</option>
                                  <option value="Out for Delivery" disabled={curIdx > 2} className="bg-neutral-900 text-white disabled:text-neutral-600">Out for Delivery</option>
                                  <option value="Delivered" disabled={curIdx > 3} className="bg-neutral-900 text-white disabled:text-neutral-600">Delivered</option>
                                  <option value="Cancelled" disabled={isCancelled} className="bg-neutral-900 text-red-400 disabled:text-neutral-600">Cancelled</option>
                                </select>
                              );
                            })()
                          ) : (
                            <span className="text-neutral-500 text-xs">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {isOffline ? (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleViewOrder(order)}
                                className="p-1.5 rounded-lg bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 transition cursor-pointer border border-neutral-800"
                                title="View Sale Info & Details"
                              >
                                <FiEye size={14} />
                              </button>

                              <button
                                onClick={() => handleEditOfflineSale(order)}
                                className="p-1.5 rounded-lg bg-neutral-900 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition cursor-pointer border border-neutral-800"
                                title="Edit Offline Sale"
                              >
                                <FiEdit size={14} />
                              </button>

                              <button
                                onClick={() => handlePrintOfflineBill(order)}
                                className="p-1.5 rounded-lg bg-neutral-900 text-lime-400 hover:text-lime-300 hover:bg-lime-500/10 transition cursor-pointer border border-neutral-800"
                                title="View & Print Official Bill Invoice"
                              >
                                <FiFileText size={14} />
                              </button>

                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                className="p-1.5 rounded-lg bg-neutral-900 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer border border-neutral-800"
                                title="Delete Offline Sale Record"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleViewOrder(order)}
                                className="p-1.5 rounded-lg bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 transition cursor-pointer border border-neutral-800"
                                title="View Order Details"
                              >
                                <FiEye size={14} />
                              </button>

                              <button
                                onClick={() => handleToggleOrderRead(order.id)}
                                className={`px-2 py-1 rounded-lg text-[9px] font-bold transition cursor-pointer border ${
                                  order.readStatus === "unread"
                                    ? "bg-lime-500 text-neutral-950 border-lime-400 hover:bg-lime-400 font-extrabold"
                                    : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white"
                                }`}
                              >
                                {order.readStatus === "unread" ? "Mark Read" : "Unread"}
                              </button>

                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                className="p-1.5 rounded-lg bg-neutral-900 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer border border-neutral-800"
                                title="Delete Order Record"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          )}
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
              <button
                onClick={() => {
                  handleToggleRead(selectedMessage.id);
                  setSelectedMessage((prev) => ({
                    ...prev,
                    status: prev.status === "read" ? "unread" : "read",
                  }));
                }}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  selectedMessage.status === "unread"
                    ? "bg-lime-500 text-neutral-950 border-lime-400 hover:bg-lime-400 font-extrabold"
                    : "bg-neutral-900 text-neutral-300 border-neutral-800 hover:text-white"
                }`}
              >
                {selectedMessage.status === "unread" ? "Mark Read" : "Mark Unread"}
              </button>

              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-bold text-white hover:bg-neutral-800 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order / Offline Sale Detail View Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          {selectedOrder.orderType === "offline" ? (
            /* OFFLINE SALE DETAIL MODAL (Exact match to Sales section offline detail view) */
            <div className="relative w-full max-w-lg bg-[#141813] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-5 text-white my-auto max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div>
                  <h3 className="font-heading text-lg font-bold text-white">
                    Sale Transaction #{selectedOrder.displayId || selectedOrder.id}
                  </h3>
                  <span className="text-xs text-neutral-400">
                    Physical Store Offline Sale
                  </span>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-1.5">
                  <span className="text-neutral-400 font-bold block text-[11px] uppercase tracking-wider">CUSTOMER DETAILS</span>
                  <span className="text-white font-bold block text-sm">Name:-{selectedOrder.customer?.name || selectedOrder.customer?.fullName || "Walk-in Customer"}</span>
                  {selectedOrder.customer?.phone && selectedOrder.customer.phone !== "N/A" && (
                    <span className="text-neutral-300 block font-mono">Phone :- {selectedOrder.customer.phone}</span>
                  )}
                  {selectedOrder.customer?.email && (
                    <span className="text-neutral-300 block">Email :- {selectedOrder.customer.email}</span>
                  )}
                  {selectedOrder.customer?.address && (
                    <span className="text-neutral-300 block">Address :- {selectedOrder.customer.address}</span>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-neutral-300 block">Items Purchased</span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {selectedOrder.items && selectedOrder.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/60 border border-neutral-800">
                        <div>
                          <span className="font-bold text-white block">{it.name || it.product?.name}</span>
                          <span className="text-[10px] text-neutral-400">₹{it.price || it.product?.price} × {it.quantity}</span>
                        </div>
                        <span className="font-bold text-lime-400">₹{(it.price || it.product?.price || 0) * (it.quantity || 1)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Subtotal:</span>
                    <span className="font-mono text-white">₹{selectedOrder.subtotal || selectedOrder.totalAmount || selectedOrder.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Discount:</span>
                    <span className="font-mono text-amber-400">-₹{selectedOrder.discount || 0}</span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-800 pt-1 font-bold text-sm">
                    <span className="text-white">Total Amount:</span>
                    <span className="text-lime-400">₹{selectedOrder.totalAmount || selectedOrder.total || 0}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-neutral-800">
                <button
                  onClick={() => {
                    const s = selectedOrder.originalSale || selectedOrder;
                    setSelectedOrder(null);
                    setSelectedBillSale(s);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-neutral-950 text-xs font-bold transition cursor-pointer"
                >
                  <FiFileText size={15} />
                  <span>View Official Bill</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 font-bold hover:bg-neutral-800 hover:text-white text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* ONLINE ORDER DETAIL MODAL (Unchanged) */
            <div className="relative w-full max-w-2xl bg-[#141813] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 text-white my-auto max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-heading text-lg font-bold text-white">
                      Order Details #{selectedOrder.id}
                    </h3>
                    {(() => {
                      const curIdx = getStatusStepIndex(selectedOrder.status);
                      const isCancelled = (selectedOrder.status || "").toLowerCase().trim() === "cancelled";
                      return (
                        <select
                          value={selectedOrder.status || "Ordered"}
                          onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                          className="bg-[#192218] border border-lime-500/40 text-lime-400 font-extrabold text-[11px] rounded-xl px-2.5 py-1 focus:outline-none focus:border-lime-400 cursor-pointer shadow-sm disabled:opacity-60"
                        >
                          <option value="Ordered" disabled={curIdx > 0} className="bg-neutral-900 text-white disabled:text-neutral-600">Ordered</option>
                          <option value="Packed" disabled={curIdx > 1} className="bg-neutral-900 text-white disabled:text-neutral-600">Packed</option>
                          <option value="Out for Delivery" disabled={curIdx > 2} className="bg-neutral-900 text-white disabled:text-neutral-600">Out for Delivery</option>
                          <option value="Delivered" disabled={curIdx > 3} className="bg-neutral-900 text-white disabled:text-neutral-600">Delivered</option>
                          <option value="Cancelled" disabled={isCancelled} className="bg-neutral-900 text-red-400 disabled:text-neutral-600">Cancelled</option>
                        </select>
                      );
                    })()}
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
                      {formatPaymentMethod(selectedOrder.customer?.paymentMethod || selectedOrder.paymentMethod)}
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
                  className="px-6 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 font-bold hover:bg-neutral-800 hover:text-white transition text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Offline Sale Modal Drawer */}
      {(isAddOfflineModalOpen || isEditOfflineModalOpen) && (
        <AddOfflineSaleModal
          isOpen={isAddOfflineModalOpen || isEditOfflineModalOpen}
          onClose={() => {
            setIsAddOfflineModalOpen(false);
            setIsEditOfflineModalOpen(false);
            setEditingOfflineSale(null);
          }}
          onSaveSuccess={(savedSale) => {
            setSelectedBillSale(savedSale);
            loadOrders();
          }}
          editingSale={editingOfflineSale}
        />
      )}

      {/* Offline Sale Bill / Invoice Modal */}
      {selectedBillSale && (
        <OfflineSaleBillModal
          isOpen={Boolean(selectedBillSale)}
          onClose={() => setSelectedBillSale(null)}
          sale={selectedBillSale}
        />
      )}
    </div>
  );
}