import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useUserAuth } from "./UserAuthContext";
import { useProducts, getNormalizedList } from "./ProductContext";
import { db } from "../firebase/firebase.config";
import { collection, doc, setDoc, getDocs, onSnapshot } from "firebase/firestore";

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useUserAuth();
  const { decreaseProductStock, products } = useProducts();

  const userEmail = user?.email ? user.email.toLowerCase() : "guest";

  const cartStorageKey = `frd_cart_items_${userEmail}`;
  const wishlistStorageKey = `frd_wishlist_${userEmail}`;
  const ordersStorageKey = `frd_orders_${userEmail}`;

  const [cartItems, setCartItems] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [orders, setOrders] = useState([]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Load user-specific cart, wishlist, and orders whenever userEmail changes
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(cartStorageKey);
      setCartItems(savedCart ? JSON.parse(savedCart) : []);

      const savedWishlist = localStorage.getItem(wishlistStorageKey);
      setWishlist(savedWishlist ? JSON.parse(savedWishlist) : []);

      const savedOrdersFromKey = localStorage.getItem(ordersStorageKey);
      const savedOrdersFromUserKey = userEmail !== "guest" ? localStorage.getItem(`frd_user_orders_${userEmail}`) : null;
      const parsedOrders = savedOrdersFromKey
        ? JSON.parse(savedOrdersFromKey)
        : savedOrdersFromUserKey
        ? JSON.parse(savedOrdersFromUserKey)
        : [];

      setOrders(Array.isArray(parsedOrders) ? parsedOrders : []);
    } catch (e) {
      setCartItems([]);
      setWishlist([]);
      setOrders([]);
    }
  }, [userEmail, cartStorageKey, wishlistStorageKey, ordersStorageKey]);

  // Sync state changes with user-specific localStorage
  useEffect(() => {
    try {
      localStorage.setItem(cartStorageKey, JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems, cartStorageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(wishlistStorageKey, JSON.stringify(wishlist));
    } catch (e) {
      console.error(e);
    }
  }, [wishlist, wishlistStorageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(ordersStorageKey, JSON.stringify(orders));
      if (userEmail) {
        localStorage.setItem(`frd_user_orders_${userEmail}`, JSON.stringify(orders));
      }
    } catch (e) {
      console.error(e);
    }
  }, [orders, ordersStorageKey, userEmail]);

  const addToCart = (product, quantity = 1, flavor = null, size = null) => {
    const fls = getNormalizedList(product.flavors);
    const szs = getNormalizedList(product.sizes);
    const selectedFlavor = flavor || (fls.length > 0 ? fls[0] : "Standard");
    const selectedSize = size || (szs.length > 0 ? szs[0] : "Standard");
    const itemKey = `${product.id}-${selectedFlavor}-${selectedSize}`;

    // Get latest real-time stock
    const currentProduct = products.find((p) => p.id === product.id) || product;
    const availableStock = currentProduct.inStock ? (Number(currentProduct.stockQuantity) || 0) : 0;

    if (availableStock <= 0) {
      toast.error(`"${product.name}" is currently out of stock.`);
      return;
    }

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.key === itemKey);

      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        const targetQty = currentQty + quantity;
        if (targetQty > availableStock) {
          toast.error(`Cannot add more. Maximum available stock is ${availableStock} units.`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex].quantity = targetQty;
        updated[existingIndex].selected = true;
        return updated;
      } else {
        if (quantity > availableStock) {
          toast.error(`Cannot add more. Maximum available stock is ${availableStock} units.`);
          return prev;
        }
        return [
          ...prev,
          {
            key: itemKey,
            product: currentProduct,
            selectedFlavor,
            selectedSize,
            quantity,
            selected: true,
          },
        ];
      }
    });

    toast.success(`${product.name} added to cart!`);
    setIsCartOpen(true);
  };

  const removeFromCart = (key) => {
    setCartItems((prev) => prev.filter((item) => item.key !== key));
    toast.error("Item removed from cart");
  };

  const updateQuantity = (key, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.key === key) {
            const newQty = item.quantity + delta;
            if (delta > 0) {
              const latestProd = products.find((p) => p.id === item.product.id) || item.product;
              const availStock = latestProd.inStock ? (Number(latestProd.stockQuantity) || 0) : 0;
              if (newQty > availStock) {
                toast.error(`Cannot increase quantity. Maximum available stock is ${availStock} units.`);
                return item;
              }
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const toggleSelectItem = (key) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, selected: item.selected === false ? true : false } : item
      )
    );
  };

  const toggleSelectAll = (selectAll) => {
    setCartItems((prev) =>
      prev.map((item) => ({ ...item, selected: selectAll }))
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const toggleWishlist = (productId) => {
    setWishlist((prev) => {
      if (prev.includes(productId)) {
        toast("Removed from wishlist", { icon: "💔" });
        return prev.filter((id) => id !== productId);
      } else {
        toast("Saved to wishlist!", { icon: "❤️" });
        return [...prev, productId];
      }
    });
  };

  const selectedCartItems = cartItems.filter((item) => item.selected !== false);

  const cartCount = selectedCartItems.reduce((acc, item) => acc + item.quantity, 0);

  const cartSubtotal = selectedCartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  const FREE_SHIPPING_THRESHOLD = 2999;
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - cartSubtotal);

  const placeOrder = (customerDetails, orderUserEmail = userEmail) => {
    if (selectedCartItems.length === 0) {
      toast.error("Please select at least one product to checkout!");
      return null;
    }

    // Check stock for all selected items before placing order
    for (const item of selectedCartItems) {
      const prodId = item.product.id;
      const latestProd = products.find((p) => p.id === prodId) || item.product;
      const availStock = latestProd.inStock ? (Number(latestProd.stockQuantity) || 0) : 0;
      if (item.quantity > availStock) {
        toast.error(
          availStock <= 0
            ? `"${latestProd.name}" is out of stock!`
            : `Cannot place order. "${latestProd.name}" only has ${availStock} units left in stock!`
        );
        return null;
      }
    }

    const shippingFee = 0;
    const totalPayable = cartSubtotal + shippingFee;
    const nowTimeStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const newOrder = {
      id: `FRD-${Date.now().toString().slice(-5)}`,
      date: nowTimeStr,
      orderDate: nowTimeStr,
      orderTime: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      readStatus: "unread",
      status: "Ordered",
      stockDeducted: true,
      courierName: "",
      awbTrackingNumber: "",
      deliveryDate: "Expected in 4-8 Business Days",
      deliveryTime: "By 6:00 PM",
      paymentMethod: customerDetails.paymentMethod === "upi" ? "UPI Instant Pay" : customerDetails.paymentMethod === "card" ? "Credit / Debit Card" : "Prepaid Online Pay",
      paymentStatus: "Paid & Verified",
      txnId: `TXN-${Date.now().toString().slice(-8)}`,
      subtotal: cartSubtotal,
      gst: Math.round(cartSubtotal * 0.18),
      shipping: 0,
      total: totalPayable,
      totalAmount: totalPayable,
      customer: {
        fullName: customerDetails.fullName,
        phone: customerDetails.phone,
        email: customerDetails.email || orderUserEmail,
        address: `${customerDetails.address}, ${customerDetails.city || ""}, ${customerDetails.state || ""} - ${customerDetails.pincode || ""}`,
        paymentMethod: customerDetails.paymentMethod === "upi" ? "UPI Instant Pay" : customerDetails.paymentMethod === "card" ? "Credit / Debit Card" : "Prepaid Online Pay",
      },
      shippingAddress: {
        name: customerDetails.fullName,
        phone: customerDetails.phone,
        address: `${customerDetails.address}, ${customerDetails.city || ""}, ${customerDetails.state || ""} - ${customerDetails.pincode || ""}`,
      },
      items: selectedCartItems.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        product: item.product,
        image: item.product.image,
        selectedFlavor: item.selectedFlavor || "Standard",
        selectedSize: item.selectedSize || "Standard",
        flavor: item.selectedFlavor || "Standard",
        size: item.selectedSize || "Standard",
        quantity: item.quantity,
        price: item.product.price,
      })),
      trackingSteps: [
        { title: "Pending", time: "Just now", completed: true, active: true },
        { title: "Confirmed", time: "Verification", completed: false, active: false },
        { title: "Packed", time: "Warehouse", completed: false, active: false },
        { title: "Shipped", time: "In Transit", completed: false, active: false },
        { title: "Delivered", time: "Handed over", completed: false, active: false },
      ],
    };

    // Deduct stock for all items in the order
    decreaseProductStock(selectedCartItems);

    setOrders((prev) => [newOrder, ...prev]);

    // 1. Save live order to Firebase Firestore database
    try {
      setDoc(doc(db, "orders", newOrder.id), {
        ...newOrder,
        createdAt: new Date().toISOString(),
      }).catch((e) => console.warn("Firebase order save warning:", e));
    } catch (fErr) {
      console.warn("Firebase Firestore order error:", fErr);
    }

    // 2. Save to user-specific local orders
    if (orderUserEmail) {
      try {
        const normalizedEmail = orderUserEmail.toLowerCase();
        const userKey = `frd_user_orders_${normalizedEmail}`;
        const saved = localStorage.getItem(userKey);
        const existingUserOrders = saved ? JSON.parse(saved) : [];
        const updatedUserOrders = [newOrder, ...existingUserOrders];
        localStorage.setItem(userKey, JSON.stringify(updatedUserOrders));
        localStorage.setItem(`frd_orders_${normalizedEmail}`, JSON.stringify(updatedUserOrders));
      } catch (e) {
        console.error(e);
      }
    }

    // 3. Save to global admin orders local collection
    try {
      const savedAdmin = localStorage.getItem("frd_all_admin_orders");
      const existingAdminOrders = savedAdmin ? JSON.parse(savedAdmin) : [];
      localStorage.setItem("frd_all_admin_orders", JSON.stringify([newOrder, ...existingAdminOrders]));
    } catch (e) {
      console.error(e);
    }

    // Trigger custom event for instant notification badge sync
    window.dispatchEvent(new CustomEvent("frd_orders_updated"));

    // Keep unselected items in cart
    setCartItems((prev) => prev.filter((item) => item.selected === false));

    setIsCheckoutOpen(false);
    toast.success(`Order #${newOrder.id} placed successfully! Stock updated automatically.`);
    return newOrder;
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        selectedCartItems,
        wishlist,
        orders,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleSelectItem,
        toggleSelectAll,
        clearCart,
        toggleWishlist,
        placeOrder,
        cartCount,
        cartSubtotal,
        freeShippingRemaining,
        FREE_SHIPPING_THRESHOLD,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
