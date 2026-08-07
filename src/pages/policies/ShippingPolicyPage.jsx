import { motion } from "framer-motion";
import {
  FiClock,
  FiCreditCard,
  FiMail,
  FiMapPin,
  FiPhone,
  FiTruck,
  FiVideo,
} from "react-icons/fi";

export default function ShippingPolicyPage() {
  return (
    <div className="bg-[#090d16] text-slate-100 min-h-screen py-12 sm:py-16">
      <div className="container-custom max-w-5xl space-y-10">
        {/* Top Header */}
        <div className="text-center space-y-3">
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[#f5b800] text-xs font-black uppercase tracking-widest">
            OFFICIAL STORE POLICY
          </span>
          <h1 className="font-heading text-3xl sm:text-5xl font-black text-white tracking-tight">
            Shipping <span className="text-gradient-gold">Information</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            At FRD Nutrition, we ensure your fitness supplements are packed securely and delivered as quickly as possible.
          </p>
        </div>

        {/* Policy Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-[#131b2e] p-6 sm:p-12 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-10"
        >
          {/* Quick Key Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 border-b border-slate-800/80 pb-10">
            <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-[#f5b800] flex items-center justify-center font-bold">
                <FiTruck size={20} />
              </div>
              <h3 className="font-heading text-sm font-bold text-white">All India Delivery</h3>
              <p className="text-xs text-slate-400">Fast shipping to all serviceable pincodes across India</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-[#f5b800] flex items-center justify-center font-bold">
                <FiClock size={20} />
              </div>
              <h3 className="font-heading text-sm font-bold text-white">24-48 Working Hrs</h3>
              <p className="text-xs text-slate-400">Rapid order processing & dispatch timeframe</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-[#f5b800] flex items-center justify-center font-bold">
                <FiCreditCard size={20} />
              </div>
              <h3 className="font-heading text-sm font-bold text-white">Flat ₹50 / Free &gt; ₹999</h3>
              <p className="text-xs text-slate-400">Transparent flat-rate shipping fee across India</p>
            </div>
          </div>

          {/* Detailed Policy Sections */}
          <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
            {/* Section 1 */}
            <div className="space-y-2">
              <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-[#f5b800] flex items-center justify-center text-xs font-black">
                  1
                </span>
                <span>Delivery Locations</span>
              </h2>
              <p className="pl-9 text-slate-400">
                We deliver across all locations in India to serviceable pincodes using trusted courier partners.
              </p>
            </div>

            {/* Section 2 */}
            <div className="space-y-2">
              <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-[#f5b800] flex items-center justify-center text-xs font-black">
                  2
                </span>
                <span>Order Processing Time</span>
              </h2>
              <p className="pl-9 text-slate-400">
                Orders are usually processed and dispatched within <strong>24–48 working hours</strong> after successful payment. Orders placed on Sundays or public holidays are processed on the next working day.
              </p>
            </div>

            {/* Section 3 */}
            <div className="space-y-2">
              <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-[#f5b800] flex items-center justify-center text-xs font-black">
                  3
                </span>
                <span>Estimated Delivery Time</span>
              </h2>
              <p className="pl-9 text-slate-400">
                Once dispatched, orders are typically delivered within <strong>4–8 business days</strong>.
                <br />
                <span className="text-xs text-slate-500 italic mt-1 block">
                  *Delivery timelines may occasionally vary due to remote locations, regional restrictions, courier delays, or unforeseen circumstances.
                </span>
              </p>
            </div>

            {/* Section 4 */}
            <div className="space-y-2">
              <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-[#f5b800] flex items-center justify-center text-xs font-black">
                  4
                </span>
                <span>Shipping Charges</span>
              </h2>
              <p className="pl-9 text-slate-400">
                Flat shipping fee: <strong>₹50 per order</strong> across India (or <strong>FREE shipping</strong> on orders above ₹999).
              </p>
            </div>

            {/* Section 5 */}
            <div className="space-y-2">
              <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-[#f5b800] flex items-center justify-center text-xs font-black">
                  5
                </span>
                <span>Cash on Delivery (COD)</span>
              </h2>
              <p className="pl-9 text-slate-400">
                Cash on Delivery is not available. All orders must be prepaid through online payment methods.
              </p>
            </div>

            {/* Section 6 */}
            <div className="space-y-2">
              <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-[#f5b800] flex items-center justify-center text-xs font-black">
                  6
                </span>
                <span>Order Tracking</span>
              </h2>
              <p className="pl-9 text-slate-400">
                After dispatch, tracking details will be available in the <strong>“My Orders”</strong> section of your account.
              </p>
            </div>

            {/* Section 7 - MANDATORY UNBOXING VIDEO CALLOUT */}
            <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/30 space-y-4 shadow-xl">
              <div className="flex items-center gap-3 text-[#f5b800]">
                <FiVideo size={24} />
                <h3 className="font-heading text-base font-bold uppercase tracking-wider text-white">
                  7. Damaged or Tampered Package Requirement
                </h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 pl-4 list-disc leading-relaxed">
                <li>
                  Any issues relating to damaged, leaked, or tampered packages must be reported within <strong>24 hours</strong> of delivery.
                </li>
                <li>
                  <strong className="text-amber-400 uppercase">Mandatory Requirement:</strong> A clear unboxing video recorded from the moment the seal is opened is mandatory.
                </li>
                <li>
                  Clear photos of the outer packaging, inner product, and shipping label must be shared.
                </li>
                <li>
                  All required details must be emailed to:{" "}
                  <a
                    href="mailto:support@frdnutritionpremium.com"
                    className="text-[#f5b800] font-bold underline"
                  >
                    support@frdnutritionpremium.com
                  </a>
                </li>
              </ul>
              <p className="text-[11px] text-slate-400 italic pt-2 border-t border-amber-500/20">
                Please note: All claims are subject to verification by the FRD Nutrition team. FRD Nutrition reserves the right to approve or reject any claim based on the provided evidence.
              </p>
            </div>

            {/* Section 8 */}
            <div className="space-y-2">
              <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-[#f5b800] flex items-center justify-center text-xs font-black">
                  8
                </span>
                <span>Returns & Replacement</span>
              </h2>
              <p className="pl-9 text-slate-400">
                Due to the nature of nutritional and health supplements, returns are not accepted under any circumstances. In rare cases of verified transit damage, a replacement may be issued at our sole discretion. No refunds or returns will be provided in any case.
              </p>
            </div>
          </div>

          {/* Section 9: Contact Card */}
          <div className="pt-8 border-t border-slate-800 space-y-6">
            <h3 className="font-heading text-xl font-bold text-white">
              9. Contact & Support
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800 space-y-2">
                <FiMail className="text-[#f5b800]" size={20} />
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Email Support</span>
                <a href="mailto:support@frdnutritionpremium.com" className="text-xs font-bold text-white hover:text-[#f5b800] transition block truncate">
                  support@frdnutritionpremium.com
                </a>
              </div>

              <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800 space-y-2">
                <FiPhone className="text-[#f5b800]" size={20} />
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Phone Line</span>
                <a href="tel:09466832004" className="text-xs font-bold text-white hover:text-[#f5b800] transition block">
                  094668 32004 / +91 9088032004
                </a>
              </div>

              <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800 space-y-2">
                <FiMapPin className="text-[#f5b800]" size={20} />
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Official Hub</span>
                <p className="text-xs text-slate-300 leading-normal">
                  FRD Nutrition, Chhar Khamba Road, near Tikona Park, near Aarya Samaj Mandir, Model Town, Rohtak, Haryana – 124001
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
