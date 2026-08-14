import { useEffect } from "react";
import { FiArrowRight, FiCheckSquare, FiMinus, FiPlus, FiShoppingBag, FiSquare, FiTrash2, FiX } from "react-icons/fi";
import { useCart } from "../../context/CartContext";
import { useProducts } from "../../context/ProductContext";
import toast from "react-hot-toast";

export default function CartDrawer() {
  const {
    cartItems,
    selectedCartItems,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    toggleSelectItem,
    toggleSelectAll,
    cartSubtotal,
    freeShippingRemaining,
    FREE_SHIPPING_THRESHOLD,
    setIsCheckoutOpen,
  } = useCart();
  const { products } = useProducts();

  useEffect(() => {
    if (isCartOpen) {
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
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  // Check if any selected item is out of stock or exceeds available stock
  const hasInvalidStockItem = selectedCartItems.some((item) => {
    const latestProd = products.find((p) => p.id === item.product.id) || item.product;
    const availStock = latestProd.inStock ? (Number(latestProd.stockQuantity) || 0) : 0;
    return item.quantity > availStock || availStock <= 0;
  });

  const handleProceedToCheckout = () => {
    if (selectedCartItems.length === 0) return;

    for (const item of selectedCartItems) {
      const latestProd = products.find((p) => p.id === item.product.id) || item.product;
      const availStock = latestProd.inStock ? (Number(latestProd.stockQuantity) || 0) : 0;
      if (availStock <= 0) {
        toast.error(`"${latestProd.name}" is out of stock. Please remove it from cart.`);
        return;
      }
      if (item.quantity > availStock) {
        toast.error(`"${latestProd.name}" exceeds available stock (${availStock} left). Please reduce quantity.`);
        return;
      }
    }

    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const freeShippingPercent = Math.min(
    100,
    Math.round((cartSubtotal / FREE_SHIPPING_THRESHOLD) * 100)
  );

  const allSelected = cartItems.length > 0 && selectedCartItems.length === cartItems.length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-[#121511] text-white border-l border-neutral-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800 bg-[#171b16]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-[#f5b800]">
                <FiShoppingBag size={22} />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold">Your Cart</h2>
                <p className="text-xs text-neutral-400">
                  <span className="text-[#f5b800] font-extrabold">{selectedCartItems.length}</span> of {cartItems.length} {cartItems.length === 1 ? "Item" : "Items"} selected
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              aria-label="Close cart"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Free Shipping Bar */}
          <div className="px-6 py-3.5 bg-neutral-900 border-b border-neutral-800/80 text-xs">
            <p className="text-[#f5b800] font-bold flex items-center gap-1.5">
              🎉 Enjoy FREE Express Pan-India Delivery on all orders! 🚚
            </p>
            <div className="w-full bg-neutral-800 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#f5b800] to-amber-500 h-full w-full"
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-neutral-800/60">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-20 h-20 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-600 mb-4">
                  <FiShoppingBag size={36} />
                </div>
                <h3 className="font-heading text-lg font-bold text-neutral-200">
                  Your cart is empty
                </h3>
                <p className="text-sm text-neutral-400 max-w-xs mt-1">
                  Explore our high-grade supplement collection and fuel your workout performance.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-6 px-6 py-3 rounded-xl bg-[#f5b800] text-neutral-950 font-bold hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
                >
                  Explore Supplements
                </button>
              </div>
            ) : (
              <>
                {/* Select / Deselect All Bar */}
                {cartItems.length > 1 && (
                  <div className="flex items-center justify-between pb-3 mb-2 border-b border-neutral-800/80 text-xs">
                    <button
                      onClick={() => toggleSelectAll(!allSelected)}
                      className="flex items-center gap-2 text-neutral-300 hover:text-white font-bold transition cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => toggleSelectAll(!allSelected)}
                        className="w-4 h-4 rounded accent-[#f5b800] cursor-pointer"
                      />
                      <span>Select All ({cartItems.length} Products)</span>
                    </button>
                    <span className="text-[11px] text-amber-400/90 font-medium">
                      Choose multiple products for checkout
                    </span>
                  </div>
                )}

                {cartItems.map((item) => {
                  const isSelected = item.selected !== false;
                  const latestProd = products.find((p) => p.id === item.product.id) || item.product;
                  const availStock = latestProd.inStock ? (Number(latestProd.stockQuantity) || 0) : 0;
                  const isOut = availStock <= 0;
                  const isStockExceeded = item.quantity > availStock;

                  return (
                    <div
                      key={item.key}
                      className={`py-4 flex gap-3 items-center transition-all ${
                        isSelected ? "opacity-100" : "opacity-50 grayscale-[30%]"
                      }`}
                    >
                      {/* Checkbox item selector */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.key)}
                        className="w-5 h-5 rounded accent-[#f5b800] bg-neutral-900 border-neutral-700 cursor-pointer shrink-0"
                        title={isSelected ? "Unselect product" : "Select product for checkout"}
                      />

                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-xl bg-neutral-900 p-2 border border-neutral-800 shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-white truncate">
                          {item.product.name}
                        </h4>

                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-neutral-400">
                          <span className="bg-neutral-800 px-2 py-0.5 rounded text-neutral-300">
                            {item.selectedFlavor}
                          </span>
                          <span className="bg-neutral-800 px-2 py-0.5 rounded text-neutral-300">
                            {item.selectedSize}
                          </span>
                          <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${isOut ? "bg-red-500/20 text-red-400 border border-red-500/30" : isStockExceeded ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-lime-500/10 text-lime-400"}`}>
                            {isOut ? "Out of Stock" : `Stock: ${availStock}`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-neutral-700 rounded-lg bg-neutral-900">
                            <button
                              onClick={() => updateQuantity(item.key, -1)}
                              className="px-2 py-1 text-neutral-400 hover:text-white"
                            >
                              <FiMinus size={14} />
                            </button>
                            <span className="px-2 py-1 text-xs font-bold text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.key, 1)}
                              disabled={item.quantity >= availStock}
                              className="px-2 py-1 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <FiPlus size={14} />
                            </button>
                          </div>

                          <span className="font-extrabold text-sm text-[#f5b800]">
                            ₹{item.product.price * item.quantity}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.key)}
                        className="text-neutral-500 hover:text-red-400 p-2 transition"
                        title="Remove item"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Footer Checkout Section */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-neutral-800 bg-[#171b16] space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-neutral-400">
                  <span>Selected Subtotal ({selectedCartItems.length} items)</span>
                  <span className="text-white font-semibold">₹{cartSubtotal}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Delivery Charge (Pan-India)</span>
                  <span className="text-[#f5b800] font-semibold">
                    {cartSubtotal === 0 ? "—" : cartSubtotal >= 2999 ? "FREE" : "₹50"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-neutral-800">
                  <span>Total Payable</span>
                  <span className="text-[#f5b800]">
                    ₹{cartSubtotal === 0 ? 0 : cartSubtotal + (cartSubtotal >= 2999 ? 0 : 50)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleProceedToCheckout}
                  disabled={selectedCartItems.length === 0 || hasInvalidStockItem}
                  className={`w-full py-4 px-6 rounded-2xl font-black transition shadow-xl flex items-center justify-center gap-2.5 text-sm uppercase tracking-wider ${
                    selectedCartItems.length > 0 && !hasInvalidStockItem
                      ? "bg-gradient-to-r from-[#f5b800] to-amber-500 text-slate-950 hover:from-amber-400 hover:to-yellow-300 cursor-pointer shadow-amber-500/25"
                      : "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700"
                  }`}
                >
                  <FiShoppingBag size={20} />
                  <span>
                    {selectedCartItems.length === 0
                      ? "SELECT A PRODUCT TO CHECKOUT"
                      : hasInvalidStockItem
                      ? "STOCK EXCEEDED - ADJUST QUANTITIES"
                      : `PROCEED TO CHECKOUT (${selectedCartItems.length})`}
                  </span>
                  {selectedCartItems.length > 0 && !hasInvalidStockItem && <FiArrowRight size={20} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
