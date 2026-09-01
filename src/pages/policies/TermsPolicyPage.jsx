import { motion } from "framer-motion";
import {
  FiBookOpen,
  FiLock,
  FiMail,
  FiPhone,
  FiShield,
} from "react-icons/fi";

export default function TermsPolicyPage() {
  return (
    <div className="bg-[#090d16] text-slate-100 min-h-screen py-12 sm:py-16">
      <div className="container-custom max-w-5xl space-y-10">
        {/* Top Header */}
        <div className="text-center space-y-3">
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[#f5b800] text-xs font-black uppercase tracking-widest">
            OFFICIAL STORE POLICY
          </span>
          <h1 className="font-heading text-3xl sm:text-5xl font-black text-white tracking-tight">
            Terms & <span className="text-gradient-gold">Conditions</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            By accessing or purchasing from HR Sports & Nutrition, you agree to the following terms and conditions. Please read them carefully before using our website.
          </p>
        </div>

        {/* Policy Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-[#131b2e] p-6 sm:p-12 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-10"
        >
          {/* Key Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 border-b border-slate-800/80 pb-10">
            <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-[#f5b800] flex items-center justify-center font-bold">
                <FiBookOpen size={20} />
              </div>
              <h3 className="font-heading text-sm font-bold text-white">Supplement Disclaimer</h3>
              <p className="text-xs text-slate-400">Nutritional supplements for fitness and general athletic support</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-[#f5b800] flex items-center justify-center font-bold">
                <FiLock size={20} />
              </div>
              <h3 className="font-heading text-sm font-bold text-white">Prepaid Orders</h3>
              <p className="text-xs text-slate-400">All online orders are processed upon successful prepayment</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-[#f5b800] flex items-center justify-center font-bold">
                <FiShield size={20} />
              </div>
              <h3 className="font-heading text-sm font-bold text-white">Intellectual Property</h3>
              <p className="text-xs text-slate-400">All website content & branding belongs exclusively to HR Sports & Nutrition</p>
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
                <span>Product Information</span>
              </h2>
              <p className="pl-9 text-slate-400">
                All products sold on HR Sports & Nutrition are nutritional supplements meant to support fitness and wellness. Products are not intended to diagnose, treat, cure, or prevent any disease.
              </p>
            </div>

            {/* Section 2 */}
            <div className="space-y-2">
              <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-[#f5b800] flex items-center justify-center text-xs font-black">
                  2
                </span>
                <span>Orders & Payments</span>
              </h2>
              <p className="pl-9 text-slate-400">
                All orders must be prepaid at the time of purchase. We reserve the right to cancel or refuse any order at our discretion.
              </p>
            </div>

            {/* Section 3 */}
            <div className="space-y-2">
              <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-[#f5b800] flex items-center justify-center text-xs font-black">
                  3
                </span>
                <span>Shipping & Delivery</span>
              </h2>
              <p className="pl-9 text-slate-400">
                Estimated delivery timelines are provided for reference only and may vary due to courier or regional constraints.
              </p>
            </div>

            {/* Section 4 */}
            <div className="space-y-2">
              <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-[#f5b800] flex items-center justify-center text-xs font-black">
                  4
                </span>
                <span>Returns & Refunds</span>
              </h2>
              <p className="pl-9 text-slate-400">
                No returns or refunds are allowed. Replacement may be issued only in rare cases of verified transit damage, subject to our discretion.
              </p>
            </div>

            {/* Section 5 */}
            <div className="space-y-2">
              <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-[#f5b800] flex items-center justify-center text-xs font-black">
                  5
                </span>
                <span>User Responsibility</span>
              </h2>
              <p className="pl-9 text-slate-400">
                Users are responsible for providing accurate information while placing orders. HR Sports & Nutrition is not liable for issues arising from incorrect details.
              </p>
            </div>

            {/* Section 6 */}
            <div className="space-y-2">
              <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-[#f5b800] flex items-center justify-center text-xs font-black">
                  6
                </span>
                <span>Intellectual Property</span>
              </h2>
              <p className="pl-9 text-slate-400">
                All content on this website including text, images, logos, and designs belongs to HR Sports & Nutrition and may not be used without permission.
              </p>
            </div>

            {/* Section 7 */}
            <div className="space-y-2">
              <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-[#f5b800] flex items-center justify-center text-xs font-black">
                  7
                </span>
                <span>Limitation of Liability</span>
              </h2>
              <p className="pl-9 text-slate-400">
                HR Sports & Nutrition shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or website.
              </p>
            </div>

            {/* Section 8 */}
            <div className="space-y-2">
              <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-[#f5b800] flex items-center justify-center text-xs font-black">
                  8
                </span>
                <span>Changes to Terms</span>
              </h2>
              <p className="pl-9 text-slate-400">
                These terms may be updated at any time without prior notice. Continued use of the website implies acceptance of the updated terms.
              </p>
            </div>
          </div>

          {/* Section 9: Contact Support */}
          <div className="pt-8 border-t border-slate-800 space-y-6">
            <h3 className="font-heading text-xl font-bold text-white">
              Questions Regarding Terms?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800 space-y-2">
                <FiMail className="text-[#f5b800]" size={20} />
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Official Email</span>
                  <a href="mailto:aldarharshad@gmail.com" className="text-xs font-bold text-white hover:text-[#f5b800] transition block truncate">
                    aldarharshad@gmail.com
                </a>
              </div>

              <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800 space-y-2">
                <FiPhone className="text-[#f5b800]" size={20} />
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Customer Support</span>
                  <a href="tel:+918767942220" className="text-xs font-bold text-white hover:text-[#f5b800] transition block">
                    +91 8767942220 / +91 9309140591
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
