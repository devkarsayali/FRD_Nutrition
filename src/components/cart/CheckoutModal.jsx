import { useEffect, useState } from "react";
import { FiCheckCircle, FiCreditCard, FiLock, FiShield, FiX } from "react-icons/fi";
import { useCart } from "../../context/CartContext";
import { useUserAuth } from "../../context/UserAuthContext";
import { useProducts } from "../../context/ProductContext";
import toast from "react-hot-toast";
import { isValidEmail, isValidPhone } from "../../utils/validation";

export default function CheckoutModal() {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cartItems,
    selectedCartItems,
    cartSubtotal,
    freeShippingRemaining,
    placeOrder,
  } = useCart();
  const { user } = useUserAuth();
  const { products } = useProducts();

  const [formData, setFormData] = useState({
    firstName: user?.name ? user.name.split(" ")[0] : "",
    lastName: user?.name ? user.name.split(" ").slice(1).join(" ") : "",
    email: user?.email || "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
    phone: "",
    paymentMethod: "razorpay", // razorpay, cod
  });

  const [completedOrder, setCompletedOrder] = useState(null);

  useEffect(() => {
    if (isCheckoutOpen) {
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
  }, [isCheckoutOpen]);

  if (!isCheckoutOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const numericDigits = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, phone: numericDigits }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Calculations for totals
  const subtotal = cartSubtotal > 0 ? cartSubtotal : 5400;
  
  const calculatedSavings = selectedCartItems.reduce((acc, item) => {
    const originalPrice = item.product?.originalPrice || item.product?.mrp || Math.round((item.product?.price || 0) * 1.333);
    return acc + Math.max(0, (originalPrice - (item.product?.price || 0)) * item.quantity);
  }, 0);

  const savedAmount = calculatedSavings > 0 ? calculatedSavings : 1800;
  const shippingFee = subtotal >= 2999 ? 0 : 50;
  const finalTotal = subtotal + shippingFee;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.address ||
      !formData.city ||
      !formData.state ||
      !formData.zipCode ||
      !formData.country ||
      !formData.phone
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (!isValidEmail(formData.email)) {
      toast.error("Please enter a valid email address (e.g. name@example.com).");
      return;
    }

    if (!isValidPhone(formData.phone)) {
      toast.error("Please enter a valid 10-digit mobile number (e.g. 9876543210).");
      return;
    }

    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    const customerDetails = {
      fullName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.zipCode,
      country: formData.country,
      paymentMethod: formData.paymentMethod,
    };

    const created = placeOrder(customerDetails, formData.email);
    setCompletedOrder(created);
  };

  const handleClose = () => {
    setCompletedOrder(null);
    setIsCheckoutOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-2xl bg-[#131b2e] text-white rounded-3xl border border-slate-800 shadow-2xl overflow-hidden z-10 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-800/80 bg-[#090d16]">
          <div>
            <h3 className="font-heading text-xl sm:text-2xl font-black text-white">
              {completedOrder ? "Order Confirmation" : "Complete Your Order"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {completedOrder
                ? `Order ID: #${completedOrder.id}`
                : "Enter shipping address & payment details"}
            </p>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <FiX size={22} />
          </button>
        </div>

        {/* Order Success Screen */}
        {completedOrder ? (
          <div className="p-6 sm:p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-amber-500/20 text-[#f5b800] rounded-full flex items-center justify-center mx-auto border border-amber-500/40">
              <FiCheckCircle size={44} />
            </div>

            <div>
              <h4 className="text-2xl font-bold font-heading text-white">
                Thank You, {completedOrder.customer.fullName}!
              </h4>
              <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
                Your order <span className="text-[#f5b800] font-semibold">#{completedOrder.id}</span> has been received and is being processed by our fulfillment team.
              </p>
            </div>

            <div className="bg-[#090d16] rounded-2xl p-5 border border-slate-800 text-left max-w-lg mx-auto space-y-3">
              <div className="flex justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2">
                <span>Shipping Address</span>
                <span className="text-white font-medium text-right max-w-xs">{completedOrder.customer.address}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2">
                <span>Payment Method</span>
                <span className="text-[#f5b800] uppercase font-bold">{completedOrder.customer.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-1">
                <span>Total Paid</span>
                <span className="text-[#f5b800]">₹{completedOrder.total.toLocaleString("en-IN")}.00</span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#f5b800] to-amber-500 text-slate-950 font-black hover:from-amber-400 hover:to-yellow-300 transition shadow-lg cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Form Fields: First Name, Last Name, Email, Address, City, State, Zip Code, Country, Phone Number */}
            <div className="space-y-4">
              {/* Row 1: First Name & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    className="w-full bg-[#090d16] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f5b800] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    className="w-full bg-[#090d16] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f5b800] transition"
                  />
                </div>
              </div>

              {/* Row 2: Email & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="user@example.com"
                    className="w-full bg-[#090d16] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f5b800] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="9876543210 (10 digits)"
                    className="w-full bg-[#090d16] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f5b800] transition"
                  />
                </div>
              </div>

              {/* Row 3: Address */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="House / Apartment No, Street Address, Landmark"
                  className="w-full bg-[#090d16] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f5b800] transition"
                />
              </div>

              {/* Row 4: City & State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Mumbai / Rohtak"
                    className="w-full bg-[#090d16] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f5b800] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Haryana / Maharashtra"
                    className="w-full bg-[#090d16] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f5b800] transition"
                  />
                </div>
              </div>

              {/* Row 5: Zip Code & Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Zip Code *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    required
                    value={formData.zipCode}
                    onChange={handleChange}
                    placeholder="124001"
                    className="w-full bg-[#090d16] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f5b800] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Country *
                  </label>
                  <input
                    type="text"
                    name="country"
                    required
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="India"
                    className="w-full bg-[#090d16] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f5b800] transition"
                  />
                </div>
              </div>
            </div>

            {/* ORDER ITEMS STOCK SUMMARY */}
            <div className="bg-[#090d16] rounded-2xl p-4 border border-slate-800 space-y-2">
              <h4 className="font-heading text-xs font-black text-[#f5b800] uppercase tracking-wider pb-2 border-b border-slate-800 flex justify-between">
                <span>Order Items ({selectedCartItems.length})</span>
                <span>Available Stock</span>
              </h4>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {selectedCartItems.map((item) => {
                  const latestProd = products.find((p) => p.id === item.product.id) || item.product;
                  const availStock = latestProd.inStock ? (Number(latestProd.stockQuantity) || 0) : 0;
                  return (
                    <div key={item.key} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/40 last:border-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={item.product.image} alt={item.product.name} className="w-7 h-7 object-contain rounded bg-slate-900 p-1 shrink-0" />
                        <span className="font-bold text-white truncate max-w-[180px] sm:max-w-[240px]">{item.product.name}</span>
                        <span className="text-[10px] text-slate-400 font-extrabold">x{item.quantity}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${availStock <= 0 ? "bg-red-500/20 text-red-400 border border-red-500/30" : item.quantity > availStock ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-lime-500/10 text-lime-400"}`}>
                        {availStock <= 0 ? "Out of Stock" : `${availStock} In Stock`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CART TOTALS Section */}
            <div className="bg-[#090d16] rounded-2xl p-5 border border-slate-800 space-y-3">
              <h4 className="font-heading text-sm font-black text-[#f5b800] uppercase tracking-wider pb-2 border-b border-slate-800">
                CART TOTALS
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal</span>
                  <span className="font-semibold text-white">
                    ₹{subtotal.toLocaleString("en-IN")}.00
                  </span>
                </div>

                <div className="flex justify-between text-slate-300">
                  <span>You Saved</span>
                  <span className="font-bold text-emerald-400">
                    -₹{savedAmount.toLocaleString("en-IN")}.00
                  </span>
                </div>

                <div className="flex justify-between text-slate-300">
                  <span>Delivery Charge (Pan-India)</span>
                  <span className="font-bold text-[#f5b800]">
                    {shippingFee === 0 ? "FREE" : `₹${shippingFee.toLocaleString("en-IN")}.00`}
                  </span>
                </div>

                <div className="flex justify-between text-sm sm:text-base font-extrabold text-white pt-3 border-t border-slate-800/80">
                  <span>Total Payable</span>
                  <span className="text-[#f5b800]">
                    ₹{finalTotal.toLocaleString("en-IN")}.00
                  </span>
                </div>
              </div>
            </div>

            {/* PAYMENT METHOD Section */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-[#f5b800] uppercase tracking-wider">
                PAYMENT METHOD
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: "razorpay" })}
                  className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                    formData.paymentMethod === "razorpay"
                      ? "border-[#f5b800] bg-amber-500/10 text-white shadow-md shadow-amber-500/10"
                      : "border-slate-800 bg-[#090d16] text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FiCreditCard className="text-[#f5b800]" size={18} />
                    <span className="font-extrabold">Razorpay</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                    UPI / Cards / NetBanking
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: "cod" })}
                  className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                    formData.paymentMethod === "cod"
                      ? "border-[#f5b800] bg-amber-500/10 text-white shadow-md shadow-amber-500/10"
                      : "border-slate-800 bg-[#090d16] text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FiShield className="text-[#f5b800]" size={18} />
                    <span className="font-extrabold">Cash on Delivery</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                    Pay at Doorstep
                  </span>
                </button>
              </div>
            </div>

            {/* Guarantee Note */}
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <FiLock className="text-[#f5b800] shrink-0" size={15} />
              <span>100% Authentic Products guaranteed directly from FRD Nutrition</span>
            </div>

            {/* PLACE ORDER Button */}
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#f5b800] to-amber-500 text-slate-950 font-black hover:from-amber-400 hover:to-yellow-300 transition text-sm sm:text-base shadow-lg shadow-amber-500/20 uppercase tracking-wider cursor-pointer"
            >
              PLACE ORDER
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
