import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiLock,
  FiMail,
  FiMapPin,
  FiMessageSquare,
  FiPackage,
  FiPhone,
  FiSend,
  FiUser,
} from "react-icons/fi";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useUserAuth } from "../context/UserAuthContext";

export default function ContactPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user } = useUserAuth();

  const queryProduct = searchParams.get("product") || location.state?.productName || "";

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    product: queryProduct,
    message: "",
  });

  const [isProductPrefilled, setIsProductPrefilled] = useState(Boolean(queryProduct));
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname, location.search]);

  useEffect(() => {
    const prodParam = searchParams.get("product") || location.state?.productName || "";
    if (prodParam) {
      setFormData((prev) => ({
        ...prev,
        product: prodParam,
      }));
      setIsProductPrefilled(true);
    }
  }, [searchParams, location.state]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    const newMessage = {
      id: "MSG-" + Date.now().toString().slice(-6),
      name: formData.name,
      email: formData.email,
      phone: formData.phone || "Not provided",
      product: formData.product || "",
      message: formData.message,
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "unread",
      type: formData.product ? "Product Enquiry" : "General Contact",
    };

    try {
      const existingMessages = JSON.parse(localStorage.getItem("frd_contact_messages") || "[]");
      localStorage.setItem("frd_contact_messages", JSON.stringify([newMessage, ...existingMessages]));
      window.dispatchEvent(new CustomEvent("frd_contact_messages_updated"));
    } catch (err) {
      console.error("Error saving contact message:", err);
    }

    setTimeout(() => {
      setLoading(false);
      setIsSubmitted(true);
      toast.success(
        formData.product
          ? `Thank you! Your product enquiry for "${formData.product}" has been submitted successfully.`
          : "Thank you! Your message has been sent successfully. Our team will contact you shortly."
      );
      setFormData({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        product: isProductPrefilled ? queryProduct : "",
        message: "",
      });
    }, 600);
  };

  return (
    <div className="bg-[#090d16] text-white min-h-screen py-10 sm:py-12">
      <div className="container-custom space-y-8 sm:space-y-10">
        {/* Top Banner Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3 max-w-3xl mx-auto"
        >
          <span className="text-[#f5b800] text-xs font-black uppercase tracking-widest block">
            FRD NUTRITION OFFICIAL STORE
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
            {formData.product ? "PRODUCT ENQUIRY & CONTACT" : "GET IN TOUCH WITH US"}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            {formData.product
              ? `Submit your enquiry regarding "${formData.product}". Our supplement specialists will provide guidance within 24 hours.`
              : "Have questions about authentic supplements, stack guidance, or your order status? Send us a message or visit our official flagship store in Rohtak, Haryana."}
          </p>
        </motion.div>

        {/* Main Grid: Left Contact Info / Right Interactive Contact Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Quick Contact Info Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-5 flex flex-col h-full"
          >
            <div className="p-6 sm:p-8 rounded-3xl bg-[#131b2e] border border-slate-800 shadow-xl space-y-6 h-full flex flex-col justify-between">
              <h3 className="font-heading text-xl font-extrabold text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[#f5b800] flex items-center justify-center text-sm">
                  💬
                </span>
                Contact Information
              </h3>

              <div className="space-y-4 sm:space-y-5 flex-1 flex flex-col justify-around">
                <div className="flex items-start gap-4 p-3.5 sm:p-4 rounded-2xl bg-[#090d16]/80 border border-slate-800/80 hover:border-amber-500/30 transition">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[#f5b800] shrink-0">
                    <FiPhone size={20} />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">Phone Helpline</h5>
                    <p className="text-xs text-slate-300 font-medium">+91 9088032004</p>
                    <p className="text-xs text-slate-400">Landline: 01262 660027</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3.5 sm:p-4 rounded-2xl bg-[#090d16]/80 border border-slate-800/80 hover:border-amber-500/30 transition">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[#f5b800] shrink-0">
                    <FiMail size={20} />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">Email Support</h5>
                    <a href="mailto:support@frdnutritionpremium.com" className="text-xs text-[#f5b800] font-medium hover:underline block">
                      support@frdnutritionpremium.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3.5 sm:p-4 rounded-2xl bg-[#090d16]/80 border border-slate-800/80 hover:border-amber-500/30 transition">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[#f5b800] shrink-0">
                    <FiMapPin size={20} />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">Store Address</h5>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      FRD Nutrition, Dev Colony Gali 1, Delhi Road, Rohtak, Haryana 124001
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3.5 sm:p-4 rounded-2xl bg-[#090d16]/80 border border-slate-800/80 hover:border-amber-500/30 transition">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[#f5b800] shrink-0">
                    <FiClock size={20} />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">Operating Hours</h5>
                    <p className="text-xs text-slate-300 font-medium">Monday - Sunday: 10:00 AM - 9:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Interactive Contact Us Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-7 bg-[#131b2e] p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6 flex flex-col justify-between h-full"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-[#f5b800] uppercase tracking-widest">
                <FiMessageSquare size={16} />
                <span>{formData.product ? "PRODUCT ENQUIRY FORM" : "SEND US A DIRECT MESSAGE"}</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
                {formData.product ? "Product Enquiry" : "Leave a Message"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                {formData.product
                  ? "We have auto-selected your product below. Please fill out your details to submit your inquiry."
                  : "Fill in the form below and our supplement specialists will respond within 24 hours."}
              </p>
            </div>

            {isSubmitted ? (
              <div className="p-8 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-4 my-auto">
                <div className="w-14 h-14 bg-amber-500/20 text-[#f5b800] rounded-full flex items-center justify-center mx-auto border border-amber-500/40">
                  <FiCheckCircle size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-white">
                    {formData.product ? "Enquiry Received!" : "Message Received!"}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto">
                    Thank you for reaching out to FRD Nutrition. Our team has received your query and will reply via email or phone shortly.
                  </p>
                </div>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="px-6 py-2.5 rounded-xl bg-[#f5b800] text-slate-950 font-bold text-xs hover:bg-amber-400 transition cursor-pointer"
                >
                  Send Another Enquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Your Name *
                      </label>
                      <div className="relative">
                        <FiUser className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
                        <input
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="John Doe"
                          className="w-full bg-[#090d16] border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f5b800] transition"
                        />
                      </div>
                    </div>

                    {/* Email Address */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Email Address *
                      </label>
                      <div className="relative">
                        <FiMail className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="user@example.com"
                          className="w-full bg-[#090d16] border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f5b800] transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mobile Number & Product Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Phone / WhatsApp Number
                      </label>
                      <div className="relative">
                        <FiPhone className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+91 9975117277"
                          className="w-full bg-[#090d16] border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f5b800] transition"
                        />
                      </div>
                    </div>

                    {/* Product Name (Auto-filled & Read-only if coming from product page, otherwise optional) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                        <span>Product Name</span>
                        {isProductPrefilled && (
                          <span className="text-[10px] text-[#f5b800] font-normal lowercase flex items-center gap-1">
                            <FiLock size={10} /> auto-filled
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <FiPackage className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
                        <input
                          type="text"
                          name="product"
                          value={formData.product}
                          readOnly={isProductPrefilled}
                          onChange={handleChange}
                          placeholder="Product Name (Optional)"
                          className={`w-full border rounded-xl pl-10 pr-4 py-3 text-xs transition ${
                            isProductPrefilled
                              ? "bg-slate-900/90 border-amber-500/40 text-amber-300 font-bold cursor-not-allowed"
                              : "bg-[#090d16] border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-[#f5b800]"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Message Textarea */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                      {formData.product ? "Your Enquiry *" : "Your Message *"}
                    </label>
                    <textarea
                      name="message"
                      rows="4"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      placeholder={
                        formData.product
                          ? `Please describe your question or requirements regarding ${formData.product}...`
                          : "Tell us how we can help you with your fitness goals or order inquiry..."
                      }
                      className="w-full bg-[#090d16] border border-slate-800 rounded-xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f5b800] transition resize-none"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#f5b800] to-amber-500 text-slate-950 font-black hover:from-amber-400 hover:to-yellow-300 transition text-xs shadow-lg shadow-amber-500/20 uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <span>Submitting Enquiry...</span>
                  ) : (
                    <>
                      <span>{formData.product ? "Submit Product Enquiry" : "Send Message Now"}</span>
                      <FiSend size={16} />
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>

        {/* Storefront Location Card: Map on Left + Experience FRD Nutrition Live Info on Right */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-[#131b2e] p-4 sm:p-6 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Side: Embedded Google Map */}
            <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-slate-800 shadow-lg h-60 sm:h-64 lg:h-full min-h-[220px]">
              <iframe
                title="FRD Nutrition Store Location - Dev Colony Gali 1, Delhi Road, Rohtak"
                src="https://maps.google.com/maps?q=FRD%20Nutrition,%20Dev%20Colony%20Gali%201,%20Delhi%20Road,%20Rohtak,%20Haryana%20124001&t=&z=16&ie=UTF8&iwloc=B&output=embed"
                width="100%"
                height="100%"
                className="w-full h-full min-h-[220px]"
                style={{ border: 0, borderRadius: "1rem" }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Right Side: Storefront Text & Actions */}
            <div className="lg:col-span-7 space-y-4 p-2 sm:p-4 flex flex-col justify-center">
              <div className="space-y-2 text-left">
                <span className="text-[#f5b800] text-xs font-black uppercase tracking-widest block">
                  VISIT OUR PHYSICAL STOREFRONT
                </span>
                <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
                  Experience FRD Nutrition Live
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                  Step into our store in Dev Colony, Rohtak for personalized stack guidance, 100% genuine lab-certified supplements, and direct consultation with fitness experts.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="https://maps.google.com/?q=FRD+Nutrition+Dev+Colony+Gali+1+Delhi+Road+Rohtak+Haryana+124001"
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#f5b800] to-amber-500 text-slate-950 font-black hover:from-amber-400 hover:to-yellow-300 transition shadow-lg shadow-amber-500/20 flex items-center gap-2 text-xs"
                >
                  <FiMapPin size={16} />
                  <span>Get Directions</span>
                </a>

                <Link
                  to="/supplements"
                  className="px-5 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold hover:bg-slate-800 hover:border-[#f5b800] transition text-xs shadow-sm"
                >
                  Shop Online Now
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}