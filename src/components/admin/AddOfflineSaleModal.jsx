import { useEffect, useMemo, useState } from "react";
import {
  FiPlus,
  FiTrash2,
  FiX,
  FiShoppingBag,
  FiUser,
  FiPhone,
  FiDollarSign,
  FiCalendar,
  FiFileText,
  FiLayers,
  FiSearch,
  FiMail,
  FiMapPin,
  FiCheckCircle,
  FiPackage,
  FiClock,
  FiGlobe,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { useProducts, isCategoryMatch } from "../../context/ProductContext";
import toast from "react-hot-toast";
import { db } from "../../firebase/firebase.config";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";

export default function AddOfflineSaleModal({ isOpen, onClose, editingSale = null, onSaveSuccess }) {
  const { products, categories, decreaseProductStock, restoreProductStock } = useProducts();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState("");
  const [globalDiscount, setGlobalDiscount] = useState(0);

  // Selected items list for the sale
  const [saleItems, setSaleItems] = useState([]);

  // Category & Product Selection helper state
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQty, setSelectedQty] = useState(1);
  const [selectedCustomPrice, setSelectedCustomPrice] = useState("");
  const [selectedItemDiscount, setSelectedItemDiscount] = useState(0);

  // Search product box state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Customer search & suggestions state
  const [existingCustomers, setExistingCustomers] = useState([]);
  const [isCustomerNameFocused, setIsCustomerNameFocused] = useState(false);
  const [isCustomerPhoneFocused, setIsCustomerPhoneFocused] = useState(false);
  const [selectedCustomerMeta, setSelectedCustomerMeta] = useState(null);
  const [showHistoryPanel, setShowHistoryPanel] = useState(true);

  // Filter products based on selected Category
  const categoryFilteredProducts = useMemo(() => {
    if (!selectedCategory || selectedCategory === "All Categories" || selectedCategory === "All") {
      return products;
    }
    return products.filter((p) => isCategoryMatch(p.category, selectedCategory));
  }, [products, selectedCategory]);

  // Search products matching typing
  const searchFilteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return products.filter((p) =>
      p.name?.toLowerCase().includes(query) ||
      p.brand?.toLowerCase().includes(query) ||
      p.category?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  // Load existing customers and past transactions (online orders, offline sales & users) from Firestore & LocalStorage
  useEffect(() => {
    if (!isOpen) return;

    const fetchCustomers = async () => {
      const custMap = new Map(); // Key -> Customer details with orders

      const cleanPhoneDigits = (p) => {
        if (!p) return "";
        const digits = String(p).replace(/\D/g, "");
        if (digits.length >= 10) return digits.slice(-10);
        return digits;
      };

      const addOrUpdateCustomer = (custData, orderObj = null) => {
        if (!custData) return;
        const rawPhone = (custData.phone || custData.phoneNumber || "").trim();
        const name = (custData.name || custData.fullName || custData.displayName || "").trim();
        const email = (custData.email || "").trim().toLowerCase();
        const address = (custData.address || "").trim();
        const city = (custData.city || "").trim();

        if (!rawPhone && (!name || name.toLowerCase() === "walk-in customer")) return;

        const phoneDigits = cleanPhoneDigits(rawPhone);
        const key = phoneDigits.length >= 7 ? phoneDigits : (email || name.toLowerCase());

        if (!key) return;

        if (custMap.has(key)) {
          const existing = custMap.get(key);
          if (!existing.phone && rawPhone) existing.phone = rawPhone;
          if (!existing.name && name && name.toLowerCase() !== "walk-in customer") existing.name = name;
          if (!existing.email && email) existing.email = email;
          if (!existing.address && address) existing.address = address;
          if (!existing.city && city) existing.city = city;

          if (orderObj) {
            const exists = existing.orders.some((o) => o.id === orderObj.id);
            if (!exists) existing.orders.push(orderObj);
          }
        } else {
          custMap.set(key, {
            name: name && name.toLowerCase() !== "walk-in customer" ? name : "",
            phone: rawPhone,
            email,
            address,
            city,
            orders: orderObj ? [orderObj] : [],
          });
        }
      };

      // 1. Fetch registered users from Firestore `users` collection
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        usersSnap.forEach((docSnap) => {
          const u = docSnap.data();
          addOrUpdateCustomer({
            name: u.name || u.displayName || u.fullName,
            phone: u.phone || u.phoneNumber,
            email: u.email,
            address: u.address,
            city: u.city,
          });
        });
      } catch (e) {
        console.warn("Firestore users fetch warning:", e);
      }

      // 2. Fetch offline sales records from Firestore `sales` collection
      try {
        const salesSnap = await getDocs(collection(db, "sales"));
        salesSnap.forEach((docSnap) => {
          const s = docSnap.data();
          if (s.customer) {
            addOrUpdateCustomer(s.customer, {
              id: docSnap.id,
              billNumber: s.billNumber || docSnap.id,
              orderType: "offline",
              date: s.saleDate || s.createdAt,
              paymentMethod: s.paymentMethod || "Cash",
              totalAmount: Number(s.totalAmount || s.total || 0),
              totalQuantity: Number(s.totalQuantity || (s.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0)),
              items: Array.isArray(s.items)
                ? s.items.map((i) => ({
                    name: i.name,
                    category: i.category || "Supplements",
                    quantity: Number(i.quantity || 1),
                    price: Number(i.price || 0),
                    total: Number(i.total || (i.price || 0) * (i.quantity || 1)),
                  }))
                : [],
            });
          }
        });
      } catch (e) {
        console.warn("Firestore sales fetch warning:", e);
      }

      // 3. Fetch offline sales records from LocalStorage `frd_offline_sales_v1`
      try {
        const savedOffline = JSON.parse(localStorage.getItem("frd_offline_sales_v1") || "[]");
        if (Array.isArray(savedOffline)) {
          savedOffline.forEach((s) => {
            if (s.customer) {
              addOrUpdateCustomer(s.customer, {
                id: s.id,
                billNumber: s.billNumber || s.id,
                orderType: "offline",
                date: s.saleDate || s.createdAt,
                paymentMethod: s.paymentMethod || "Cash",
                totalAmount: Number(s.totalAmount || s.total || 0),
                totalQuantity: Number(s.totalQuantity || (s.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0)),
                items: Array.isArray(s.items)
                  ? s.items.map((i) => ({
                      name: i.name,
                      category: i.category || "Supplements",
                      quantity: Number(i.quantity || 1),
                      price: Number(i.price || 0),
                      total: Number(i.total || (i.price || 0) * (i.quantity || 1)),
                    }))
                  : [],
              });
            }
          });
        }
      } catch (e) {}

      // 4. Fetch online store orders from Firestore `orders` collection
      try {
        const ordersSnap = await getDocs(collection(db, "orders"));
        ordersSnap.forEach((docSnap) => {
          const o = docSnap.data();
          const cust = o.customer || o.shippingAddress || {};
          addOrUpdateCustomer(cust, {
            id: docSnap.id,
            billNumber: o.orderNumber || docSnap.id,
            orderType: "online",
            date: o.createdAt || o.orderDate || o.date,
            paymentMethod: o.paymentMethod || o.paymentInfo?.method || "ONLINE",
            totalAmount: Number(o.totalAmount || o.total || 0),
            totalQuantity: Number(o.totalQuantity || (o.items || o.cartItems || []).reduce((acc, i) => acc + (i.quantity || 1), 0)),
            items: Array.isArray(o.items || o.cartItems)
              ? (o.items || o.cartItems).map((i) => ({
                  name: i.name || i.title,
                  category: i.category || "Supplements",
                  quantity: Number(i.quantity || 1),
                  price: Number(i.price || 0),
                  total: Number(i.total || (i.price || 0) * (i.quantity || 1)),
                }))
              : [],
          });
        });
      } catch (e) {
        console.warn("Firestore orders fetch warning:", e);
      }

      // Sort order history for each customer descending
      custMap.forEach((cust) => {
        cust.orders.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      });

      setExistingCustomers(Array.from(custMap.values()));
    };

    fetchCustomers();
  }, [isOpen]);

  // Name suggestions dropdown
  const nameSuggestions = useMemo(() => {
    const query = customerName.trim().toLowerCase();
    if (!query) return [];
    return existingCustomers.filter((cust) => {
      const nameLower = (cust.name || "").toLowerCase();
      return nameLower.includes(query);
    });
  }, [existingCustomers, customerName]);

  // Phone suggestions dropdown
  const phoneSuggestions = useMemo(() => {
    const query = customerPhone.trim().toLowerCase();
    const digitsQuery = query.replace(/\D/g, "");
    if (!query) return [];

    return existingCustomers.filter((cust) => {
      const rawPhone = (cust.phone || "").toLowerCase();
      const phoneDigits = (cust.phone || "").replace(/\D/g, "");
      if (digitsQuery && phoneDigits.includes(digitsQuery)) return true;
      if (rawPhone.includes(query)) return true;
      return false;
    });
  }, [existingCustomers, customerPhone]);

  // Handle selecting customer from EITHER Name or Phone dropdown
  const handleSelectCustomer = (cust) => {
    setCustomerName(cust.name || "");
    setCustomerPhone(cust.phone || "");
    setCustomerEmail(cust.email || "");
    setCustomerAddress(cust.address || "");
    setCustomerCity(cust.city || "");
    setSelectedCustomerMeta(cust);
    setIsCustomerNameFocused(false);
    setIsCustomerPhoneFocused(false);
    toast.success(`Loaded customer profile for "${cust.name || cust.phone}". Details auto-filled!`);
  };

  // Re-add items from a past order into current sale
  const handleReaddOrderItems = (pastOrderItems) => {
    if (!Array.isArray(pastOrderItems) || pastOrderItems.length === 0) return;

    let addedCount = 0;
    pastOrderItems.forEach((pastItem) => {
      const catalogProd = products.find(
        (p) => p.name?.toLowerCase().trim() === pastItem.name?.toLowerCase().trim()
      );

      const prodId = catalogProd ? catalogProd.id : `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const price = catalogProd ? Number(catalogProd.price) : Number(pastItem.price) || 0;
      const qty = Math.max(1, Number(pastItem.quantity) || 1);
      const category = catalogProd ? catalogProd.category : pastItem.category || "Supplements";
      const image = catalogProd ? catalogProd.image : "";

      setSaleItems((prev) => {
        const existingIdx = prev.findIndex((i) => String(i.productId) === String(prodId) || i.name === pastItem.name);
        if (existingIdx > -1) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: updated[existingIdx].quantity + qty,
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              productId: prodId,
              name: pastItem.name,
              category,
              price,
              quantity: qty,
              itemDiscount: 0,
              image,
            },
          ];
        }
      });
      addedCount++;
    });

    toast.success(`Added ${addedCount} item(s) from previous order into transaction!`);
  };

  useEffect(() => {
    if (editingSale) {
      setCustomerName(editingSale.customer?.name || "");
      setCustomerPhone(editingSale.customer?.phone || "");
      setCustomerEmail(editingSale.customer?.email || "");
      setCustomerAddress(editingSale.customer?.address || "");
      setCustomerCity(editingSale.customer?.city || "");
      setPaymentMethod(editingSale.paymentMethod || "Cash");
      const d = editingSale.saleDate ? new Date(editingSale.saleDate) : new Date();
      setSaleDate(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
      setNotes(editingSale.notes || "");
      setGlobalDiscount(editingSale.globalDiscount || 0);

      if (Array.isArray(editingSale.items)) {
        setSaleItems(
          editingSale.items.map((item) => ({
            productId: item.productId || item.id,
            name: item.name,
            category: item.category || "Supplements",
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
            itemDiscount: Number(item.itemDiscount) || 0,
            image: item.image || "",
          }))
        );
      }
    } else {
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setCustomerAddress("");
      setCustomerCity("");
      setPaymentMethod("Cash");
      const d = new Date();
      setSaleDate(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
      setNotes("");
      setGlobalDiscount(0);
      setSaleItems([]);
      setSelectedCategory("All Categories");
      setSelectedProductId("");
    }
  }, [editingSale, isOpen]);

  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProductSelectChange = (e) => {
    const pId = e.target.value;
    setSelectedProductId(pId);
    if (!pId) return;

    const prod = products.find((p) => String(p.id) === String(pId));
    if (prod) {
      setSelectedCustomPrice(String(prod.price || ""));
      setSelectedQty(1);
      setSelectedItemDiscount(0);
    }
  };

  const handleAddProductToSale = (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      toast.error("Please select a supplement product from the catalog.");
      return;
    }

    const prod = products.find((p) => String(p.id) === String(selectedProductId));
    if (!prod) return;

    const price = Number(selectedCustomPrice) || Number(prod.price) || 0;
    const qty = Math.max(1, Number(selectedQty) || 1);
    const itemDisc = Math.max(0, Number(selectedItemDiscount) || 0);

    const existingIndex = saleItems.findIndex((i) => String(i.productId) === String(prod.id));
    if (existingIndex > -1) {
      const updated = [...saleItems];
      const prev = updated[existingIndex];
      updated[existingIndex] = {
        ...prev,
        quantity: prev.quantity + qty,
        price,
        itemDiscount: itemDisc,
      };
      setSaleItems(updated);
    } else {
      setSaleItems((prev) => [
        ...prev,
        {
          productId: prod.id,
          name: prod.name,
          category: prod.category || "Supplements",
          price,
          quantity: qty,
          itemDiscount: itemDisc,
          image: prod.image,
        },
      ]);
    }

    setSelectedProductId("");
    setSelectedQty(1);
    setSelectedCustomPrice("");
    setSelectedItemDiscount(0);
    setSearchQuery("");
  };

  const handleSelectProductFromSearch = (prod) => {
    setSelectedProductId(prod.id);
    setSelectedCustomPrice(String(prod.price || ""));
    setSelectedQty(1);
    setSelectedItemDiscount(0);
    setSearchQuery(prod.name || "");
    setIsSearchFocused(false);
  };

  const handleRemoveItem = (index) => {
    setSaleItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemQtyChange = (index, newQty) => {
    const val = Math.max(1, Number(newQty) || 1);
    setSaleItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: val };
      return updated;
    });
  };

  const handleItemDiscountChange = (index, newDisc) => {
    const val = Math.max(0, Number(newDisc) || 0);
    setSaleItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], itemDiscount: val };
      return updated;
    });
  };

  // Calculations
  const rawSubtotal = saleItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const totalItemDiscounts = saleItems.reduce((acc, i) => acc + (Number(i.itemDiscount) || 0), 0);
  const totalDiscount = totalItemDiscounts + Math.max(0, Number(globalDiscount) || 0);
  const finalTotalAmount = Math.max(0, rawSubtotal - totalDiscount);
  const totalQuantity = saleItems.reduce((acc, i) => acc + i.quantity, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error("Please enter the customer name.");
      return;
    }

    if (!customerPhone.trim()) {
      toast.error("Please enter the customer phone number.");
      return;
    }

    if (customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      toast.error("Please enter a valid customer email address (e.g. customer@gmail.com).");
      return;
    }

    const saleId = editingSale
      ? editingSale.id
      : `off_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    let billNumber = editingSale?.billNumber || "";
    if (!billNumber) {
      let nextSeq = 1;
      try {
        const savedOffline = JSON.parse(localStorage.getItem("frd_offline_sales_v1") || "[]");
        if (Array.isArray(savedOffline) && savedOffline.length > 0) {
          nextSeq = savedOffline.length + 1;
        }
      } catch (e) {}
      billNumber = `FRD-OFF-${String(nextSeq).padStart(6, "0")}`;
    }

    const saleData = {
      id: saleId,
      billNumber,
      saleType: "offline",
      customer: {
        name: customerName.trim(),
        phone: customerPhone.trim(),
        email: customerEmail.trim() || "",
        address: customerAddress.trim() || "",
        city: customerCity.trim() || "",
      },
      items: saleItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        category: item.category,
        price: Number(item.price),
        quantity: Number(item.quantity),
        itemDiscount: Number(item.itemDiscount || 0),
        total: Number(item.price) * Number(item.quantity) - Number(item.itemDiscount || 0),
        image: item.image || "",
      })),
      totalQuantity,
      subtotal: rawSubtotal,
      discount: totalDiscount,
      globalDiscount: Number(globalDiscount) || 0,
      totalAmount: finalTotalAmount,
      paymentMethod,
      saleDate: saleDate ? new Date(saleDate).toISOString() : new Date().toISOString(),
      notes: notes.trim(),
      status: "Completed",
      createdAt: editingSale ? editingSale.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingSale && Array.isArray(editingSale.items)) {
        restoreProductStock(editingSale.items);
      }

      decreaseProductStock(saleData.items);
      await setDoc(doc(db, "sales", saleId), saleData, { merge: true });

      try {
        const savedOffline = JSON.parse(localStorage.getItem("frd_offline_sales_v1") || "[]");
        const existingIdx = savedOffline.findIndex((s) => s.id === saleId);
        if (existingIdx > -1) {
          savedOffline[existingIdx] = saleData;
        } else {
          savedOffline.unshift(saleData);
        }
        localStorage.setItem("frd_offline_sales_v1", JSON.stringify(savedOffline));
      } catch (err) {}

      window.dispatchEvent(new CustomEvent("frd_sales_updated"));
      toast.success(editingSale ? "Offline sale updated successfully!" : "Offline store sale recorded successfully!");

      if (typeof onSaveSuccess === "function") {
        onSaveSuccess(saleData);
      }
      onClose();
    } catch (err) {
      console.error("Error saving offline sale:", err);
      toast.error("Failed to save offline sale. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#141813] border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-lime-500/20 text-lime-400 font-bold flex items-center justify-center border border-lime-500/30">
              <FiShoppingBag size={20} />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-white">
                {editingSale ? "Edit Offline Store Sale" : "Record Offline Store Sale"}
              </h2>
              <p className="text-xs text-neutral-400">
                Direct in-person physical store / gym transaction entry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Customer Details & Dual Search Section */}
          <div className="space-y-4">
            {selectedCustomerMeta && (
              <div className="p-3 rounded-xl bg-lime-500/10 border border-lime-500/30 flex items-center justify-between text-xs text-lime-400">
                <div className="flex items-center gap-2">
                  <FiCheckCircle size={16} className="shrink-0 text-lime-400" />
                  <span>
                    Existing customer loaded for <strong>{selectedCustomerMeta.name || selectedCustomerMeta.phone}</strong>. Details auto-filled.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomerMeta(null)}
                  className="text-[10px] text-lime-300 underline hover:text-white transition cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 1. CUSTOMER NAME (SEARCH & AUTOCOMPLETE) */}
              <div className="relative">
                <label className="block text-neutral-300 font-bold mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FiUser className="text-lime-400" size={14} />
                    <span>Customer Name <span className="text-lime-400">*</span></span>
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search name or type..."
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setIsCustomerNameFocused(true);
                    }}
                    onFocus={() => setIsCustomerNameFocused(true)}
                    onBlur={() => setTimeout(() => setIsCustomerNameFocused(false), 250)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-lime-500"
                  />

                  {/* Customer Name Suggestions Dropdown */}
                  {isCustomerNameFocused && customerName.trim() !== "" && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-neutral-800">
                      {nameSuggestions.length > 0 ? (
                        <>
                          <div className="px-3 py-1.5 bg-neutral-900/90 text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                            <span>Matching Customers ({nameSuggestions.length})</span>
                            <span className="text-[9px] text-lime-400 font-normal">Click to fill details</span>
                          </div>
                          {nameSuggestions.map((cust, idx) => (
                            <div
                              key={idx}
                              onMouseDown={() => handleSelectCustomer(cust)}
                              className="p-3 hover:bg-neutral-900 cursor-pointer transition text-xs flex items-center justify-between gap-2 group"
                            >
                              <div className="truncate">
                                <p className="font-bold text-white group-hover:text-lime-400 transition flex items-center gap-1.5">
                                  <span>{cust.name}</span>
                                  {cust.phone && (
                                    <span className="font-mono text-neutral-400 text-[11px]">
                                      ({cust.phone})
                                    </span>
                                  )}
                                </p>
                                {cust.city && <p className="text-[10px] text-neutral-500 truncate">{cust.city}</p>}
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime-500/10 text-lime-400 font-medium border border-lime-500/20 shrink-0">
                                {cust.orders.length} order(s)
                              </span>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="p-3 text-xs text-neutral-400 text-center italic">
                          No matching customer name found.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. CUSTOMER PHONE (SEARCH & AUTOCOMPLETE) */}
              <div className="relative">
                <label className="block text-neutral-300 font-bold mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FiPhone className="text-lime-400" size={14} />
                    <span>Customer Phone <span className="text-lime-400">*</span></span>
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {customerPhone.length} chars
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search phone (e.g. 7972...)"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      setIsCustomerPhoneFocused(true);
                    }}
                    onFocus={() => setIsCustomerPhoneFocused(true)}
                    onBlur={() => setTimeout(() => setIsCustomerPhoneFocused(false), 250)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-lime-500 font-mono"
                  />

                  {/* Customer Phone Suggestions Dropdown */}
                  {isCustomerPhoneFocused && customerPhone.trim() !== "" && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-neutral-800">
                      {phoneSuggestions.length > 0 ? (
                        <>
                          <div className="px-3 py-1.5 bg-neutral-900/90 text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                            <span>Matching Phone Numbers ({phoneSuggestions.length})</span>
                            <span className="text-[9px] text-lime-400 font-normal">Click to fill details</span>
                          </div>
                          {phoneSuggestions.map((cust, idx) => (
                            <div
                              key={idx}
                              onMouseDown={() => handleSelectCustomer(cust)}
                              className="p-3 hover:bg-neutral-900 cursor-pointer transition text-xs flex items-center justify-between gap-2 group"
                            >
                              <div className="truncate">
                                <p className="font-bold text-white font-mono group-hover:text-lime-400 transition flex items-center gap-1.5">
                                  <span>{cust.phone}</span>
                                  {cust.name && (
                                    <span className="font-sans font-semibold text-neutral-300 text-[11px]">
                                      — {cust.name}
                                    </span>
                                  )}
                                </p>
                                {cust.city && <p className="text-[10px] text-neutral-500 truncate">{cust.city}</p>}
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime-500/10 text-lime-400 font-medium border border-lime-500/20 shrink-0">
                                {cust.orders.length} order(s)
                              </span>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="p-3 text-xs text-neutral-400 text-center italic">
                          No matching phone number found. Continue entering details for a new customer.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. CUSTOMER EMAIL */}
              <div>
                <label className="block text-neutral-300 font-bold mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FiMail className="text-lime-400" size={14} />
                    <span>Customer Email (Optional)</span>
                  </span>
                  {customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim()) && (
                    <span className="text-[10px] text-red-400 font-medium">Invalid</span>
                  )}
                </label>
                <input
                  type="email"
                  placeholder="e.g. customer@gmail.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className={`w-full bg-neutral-900 border rounded-xl px-3.5 py-2.5 text-white focus:outline-none transition ${
                    customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())
                      ? "border-red-500/80 focus:border-red-500"
                      : "border-neutral-800 focus:border-lime-500"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-neutral-300 font-bold mb-1.5 flex items-center gap-1.5">
                  <FiMapPin className="text-lime-400" size={14} />
                  <span>Customer Address (Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flat/Street No, Area"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-lime-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-bold mb-1.5 flex items-center gap-1.5">
                  <FiMapPin className="text-lime-400" size={14} />
                  <span>City (Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai / Pune"
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-lime-500"
                />
              </div>
            </div>

            {/* CUSTOMER PAST ORDER HISTORY PANEL */}
            {selectedCustomerMeta && (
              <div className="p-4 rounded-2xl bg-neutral-900/90 border border-lime-500/30 space-y-3 shadow-lg">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-lime-400 font-bold">
                    <FiClock size={16} className="shrink-0" />
                    <span>Customer Order History ({selectedCustomerMeta.orders?.length || 0} order(s))</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHistoryPanel((prev) => !prev)}
                    className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>{showHistoryPanel ? "Hide Details" : "Show Details"}</span>
                    {showHistoryPanel ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 text-neutral-300">
                  <div>
                    <span className="text-neutral-500">Customer: </span>
                    <strong className="text-white">{selectedCustomerMeta.name || "N/A"}</strong> ({selectedCustomerMeta.phone || "N/A"})
                  </div>
                  <div>
                    <span className="text-neutral-500">Total Spent: </span>
                    <strong className="text-lime-400">
                      ₹{(selectedCustomerMeta.orders || []).reduce((acc, o) => acc + (o.totalAmount || 0), 0).toLocaleString("en-IN")}
                    </strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">Total Orders: </span>
                    <strong className="text-white">{selectedCustomerMeta.orders?.length || 0}</strong>
                  </div>
                </div>

                {showHistoryPanel && (
                  <div className="space-y-2.5 pt-1">
                    {!selectedCustomerMeta.orders || selectedCustomerMeta.orders.length === 0 ? (
                      <p className="text-[11px] text-neutral-500 italic">No past orders recorded for this customer yet.</p>
                    ) : (
                      <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
                        {selectedCustomerMeta.orders.map((ord, oIdx) => (
                          <div
                            key={ord.id || oIdx}
                            className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 hover:border-neutral-700 transition"
                          >
                            <div className="flex items-center justify-between text-[11px] border-b border-neutral-800/80 pb-2">
                              <div className="flex items-center gap-2">
                                {ord.orderType === "offline" ? (
                                  <span className="px-2 py-0.5 rounded-md bg-lime-500/10 text-lime-400 font-bold border border-lime-500/20 text-[10px] flex items-center gap-1">
                                    <FiShoppingBag size={10} />
                                    <span>Offline Store Sale</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20 text-[10px] flex items-center gap-1">
                                    <FiGlobe size={10} />
                                    <span>Online Order</span>
                                  </span>
                                )}
                                <span className="font-mono text-neutral-400 text-[10px]">#{ord.billNumber}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-neutral-400 text-[10px] flex items-center gap-1">
                                  <FiClock size={10} />
                                  <span>{ord.date ? new Date(ord.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A"}</span>
                                </span>
                                <span className="font-bold text-lime-400">₹{ord.totalAmount?.toLocaleString("en-IN")}</span>
                              </div>
                            </div>

                            {/* Items List */}
                            <div className="space-y-1 text-[11px]">
                              {ord.items.map((item, iIdx) => (
                                <div key={iIdx} className="flex items-center justify-between text-neutral-300">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <FiPackage size={11} className="text-neutral-500 shrink-0" />
                                    <span className="truncate">{item.name}</span>
                                    <span className="text-[10px] text-neutral-500">x{item.quantity}</span>
                                  </div>
                                  <span className="font-mono text-neutral-400 shrink-0 text-[10px]">₹{item.total || item.price * item.quantity}</span>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-neutral-900 text-[10px]">
                              <span className="text-neutral-500">Payment: <span className="text-neutral-300">{ord.paymentMethod}</span></span>
                              <button
                                type="button"
                                onClick={() => handleReaddOrderItems(ord.items)}
                                className="text-lime-400 hover:text-lime-300 font-bold flex items-center gap-1 underline transition cursor-pointer"
                              >
                                <FiPlus size={12} />
                                <span>Re-add products to current sale</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Product Picker Box with Category Filter & Search Box */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-3">
            <span className="text-xs font-bold text-lime-400 uppercase tracking-wider block">
              Add Products To Transaction
            </span>

            {/* Optional Search Product Box */}
            <div className="relative">
              <label className="block text-[11px] text-neutral-400 font-bold mb-1 flex items-center gap-1">
                <FiSearch size={12} className="text-lime-400" />
                <span>Search Product (Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type product name (e.g. Alpino)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchFocused(true);
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-8 py-2.5 text-white text-xs focus:outline-none focus:border-lime-500"
                />
                <FiSearch size={14} className="absolute left-3 top-3 text-neutral-400 pointer-events-none" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setIsSearchFocused(false);
                    }}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-white transition"
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>

              {/* Live Search Suggestions Dropdown */}
              {isSearchFocused && searchQuery.trim() !== "" && (
                <div className="absolute left-0 right-0 top-full mt-1 bg border border-neutral-800 bg-neutral-950 rounded-xl shadow-2xl z-30 max-h-56 overflow-y-auto divide-y divide-neutral-800">
                  {searchFilteredProducts.length > 0 ? (
                    searchFilteredProducts.map((p) => (
                      <div
                        key={p.id}
                        onMouseDown={() => handleSelectProductFromSearch(p)}
                        className="p-3 hover:bg-neutral-900 cursor-pointer transition flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          {p.image && (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-8 h-8 rounded-lg object-cover bg-neutral-900 shrink-0"
                            />
                          )}
                          <div className="truncate">
                            <p className="font-bold text-white truncate">{p.name}</p>
                            <p className="text-[10px] text-neutral-400">{p.category || "Supplement"}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-lime-400">₹{p.price}</p>
                          <p className="text-[10px] text-neutral-400">Stock: {p.stockQuantity ?? 0}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-neutral-500">
                      No matching products found for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              {/* Category Dropdown Filter */}
              <div className="sm:col-span-4">
                <label className="block text-[11px] text-neutral-400 font-bold mb-1 flex items-center gap-1">
                  <FiLayers size={12} className="text-lime-400" />
                  <span>Select Category</span>
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedProductId("");
                    setSelectedCustomPrice("");
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-lime-500 cursor-pointer"
                >
                  {(categories || ["All Categories"]).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category-Filtered Product Dropdown */}
              <div className="sm:col-span-4">
                <label className="block text-[11px] text-neutral-400 font-bold mb-1">
                  Select Product * ({categoryFilteredProducts.length})
                </label>
                <select
                  value={selectedProductId}
                  onChange={handleProductSelectChange}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-lime-500 cursor-pointer"
                >
                  <option value="">-- Choose Supplement --</option>
                  {categoryFilteredProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{p.price}) - Stock: {p.stockQuantity ?? 0}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price, Qty and Add Button responsive row for mobile */}
              <div className="sm:col-span-4 grid grid-cols-12 gap-2.5 items-end">
                <div className="col-span-5">
                  <label className="block text-[11px] text-neutral-400 font-bold mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Price"
                    value={selectedCustomPrice}
                    onChange={(e) => setSelectedCustomPrice(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-lime-500 font-mono"
                  />
                </div>

                <div className="col-span-4">
                  <label className="block text-[11px] text-neutral-400 font-bold mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-2.5 text-white text-xs focus:outline-none focus:border-lime-500 text-center font-bold"
                  />
                </div>

                <div className="col-span-3">
                  <button
                    type="button"
                    onClick={handleAddProductToSale}
                    className="w-full h-10 bg-lime-500 hover:bg-lime-400 text-neutral-950 font-bold rounded-xl flex items-center justify-center transition cursor-pointer shadow-md shadow-lime-500/20"
                    title="Add Product to Sale"
                  >
                    <FiPlus size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Products Table */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-neutral-300 block">
              Items in Sale ({saleItems.length})
            </span>

            {saleItems.length === 0 ? (
              <div className="p-6 rounded-2xl bg-neutral-900/50 border border-dashed border-neutral-800 text-center text-neutral-500 text-xs">
                No products added yet. Select a category and product above, then click the + button.
              </div>
            ) : (
              <div className="overflow-x-auto border border-neutral-800 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-900 text-neutral-400 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-3">Product</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Qty</th>
                      <th className="p-3">Discount</th>
                      <th className="p-3">Total</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 bg-neutral-950/50">
                    {saleItems.map((item, idx) => {
                      const itemTotal = item.price * item.quantity - (item.itemDiscount || 0);
                      return (
                        <tr key={idx} className="hover:bg-neutral-900/40">
                          <td className="p-3 font-bold text-white truncate max-w-[180px]">
                            {item.name}
                          </td>
                          <td className="p-3 font-semibold text-lime-400">₹{item.price}</td>
                          <td className="p-3">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemQtyChange(idx, e.target.value)}
                              className="w-16 bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-white"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min="0"
                              value={item.itemDiscount}
                              onChange={(e) => handleItemDiscountChange(idx, e.target.value)}
                              className="w-20 bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-white"
                              placeholder="₹0"
                            />
                          </td>
                          <td className="p-3 font-bold text-white">₹{itemTotal}</td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payment & Date Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-neutral-300 font-bold mb-1.5 flex items-center gap-1.5">
                <FiDollarSign className="text-lime-400" size={14} />
                <span>Payment Method *</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-lime-500"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Other">Other / Store Credit</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-300 font-bold mb-1.5 flex items-center gap-1.5">
                <FiCalendar className="text-lime-400" size={14} />
                <span>Sale Date & Time *</span>
              </label>
              <input
                type="datetime-local"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-lime-500"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-bold mb-1.5">
                Additional Global Discount (₹)
              </label>
              <input
                type="number"
                min="0"
                placeholder="₹0"
                value={globalDiscount}
                onChange={(e) => setGlobalDiscount(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-lime-500 font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-neutral-300 font-bold mb-1.5 flex items-center gap-1.5">
              <FiFileText className="text-lime-400" size={14} />
              <span>Remarks / Notes (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Gym member discount applied, paid in cash at counter"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-lime-500"
            />
          </div>

          {/* Amount Calculation Summary Banner */}
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="space-y-0.5">
              <span className="text-neutral-400 font-bold block">
                Total Products: <span className="text-white font-mono">{totalQuantity} units</span> ({saleItems.length} items)
              </span>
              <span className="text-neutral-400 text-[11px] block">
                Subtotal: ₹{rawSubtotal} | Total Discount: ₹{totalDiscount}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block">
                Final Amount
              </span>
              <span className="font-heading font-black text-2xl text-lime-400">
                ₹{finalTotalAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-300 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-lime-500 text-neutral-950 font-black hover:bg-lime-400 transition cursor-pointer text-xs shadow-lg shadow-lime-500/20 uppercase tracking-wider"
            >
              {editingSale ? "Update Sale Record" : "Confirm & Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
