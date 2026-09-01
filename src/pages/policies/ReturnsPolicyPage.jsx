import { motion } from "framer-motion";
import {
  FiAlertTriangle,
  FiMail,
  FiPhone,
  FiRefreshCw,
  FiVideo,
  FiXCircle,
} from "react-icons/fi";

export default function ReturnsPolicyPage() {
  return (
    <div className="bg-[#090d16] text-slate-100 min-h-screen py-12 sm:py-16">
      <div className="container-custom max-w-5xl space-y-10">
        {/* Top Header */}
        <div className="text-center space-y-3">
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[#f5b800] text-xs font-black uppercase tracking-widest">
            OFFICIAL STORE POLICY
          </span>
          <h1 className="font-heading text-3xl sm:text-5xl font-black text-white tracking-tight">
            Returns & Refunds <span className="text-gradient-gold">Policy</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            At HR Sports & Nutrition, we prioritize product quality, hygiene, and customer safety. Please read our Returns & Refunds Policy carefully before placing an order.
          </p>
        </div>

        {/* Policy Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-[#131b2e] p-6 sm:p-12 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-10"
        >
          {/* Key Policy Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 border-b border-slate-800/80 pb-10">
            <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center font-bold">
                <FiXCircle size={20} />
              </div>
              <h3 className="font-heading text-sm font-bold text-white">No Returns Accepted</h3>
              <p className="text-xs text-slate-400">Strict hygiene & safety enforcement for sports nutrition</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-[#f5b800] flex items-center justify-center font-bold">
                <FiRefreshCw size={20} />
              </div>
              <h3 className="font-heading text-sm font-bold text-white">Transit Damage Only</h3>
              <p className="text-xs text-slate-400">Replacement eligible only for verified transit damage</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-[#f5b800] flex items-center justify-center font-bold">
                <FiVideo size={20} />
              </div>
              <h3 className="font-heading text-sm font-bold text-white">Unboxing Video Required</h3>
              <p className="text-xs text-slate-400">Continuous video required from package seal opening</p>
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
                <span>No Returns Policy</span>
              </h2>
              <p className="pl-9 text-slate-400">
                Due to the nature of nutritional and fitness supplements, we do not accept returns under any circumstances. This policy is strictly enforced to ensure hygiene, safety, and authenticity of products.
              </p>
            </div>

            {/* Section 2 */}
            <div className="space-y-2">
              <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-[#f5b800] flex items-center justify-center text-xs font-black">
                  2
                </span>
                <span>Refund Policy</span>
              </h2>
              <p className="pl-9 text-slate-400">
                Refunds are not provided once an order is successfully placed and delivered.
                <br />
                <span className="text-xs text-slate-400 mt-1 block">
                  Please ensure all shipping details, product selection, and order confirmation are reviewed carefully before completing your purchase.
                </span>
              </p>
            </div>

            {/* Section 3 - CALLOUT ALERT BOX */}
            <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/30 space-y-4 shadow-xl">
              <div className="flex items-center gap-3 text-[#f5b800]">
                <FiAlertTriangle size={24} />
                <h3 className="font-heading text-base font-bold uppercase tracking-wider text-white">
                  3. Replacement (Damaged in Transit Only)
                </h3>
              </div>
              <p className="text-xs text-slate-300">
                In very rare cases where a product is damaged, leaked, or tampered during transit, a replacement may be issued, subject to verification.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 pl-4 list-disc leading-relaxed">
                <li>
                  The issue must be reported within <strong>24 hours</strong> of delivery.
                </li>
                <li>
                  <strong className="text-amber-400 uppercase">Mandatory Video Evidence:</strong> A clear unboxing video is mandatory and must show the package being opened from start to finish.
                </li>
                <li>
                  Clear photographs of the damaged product, outer packaging, and shipping label must be provided.
                </li>
                <li>
                  All required details must be emailed to:{" "}
                  <a
                    href="mailto:aldarharshad@gmail.com"
                    className="text-amber-400 font-bold hover:underline"
                  >
                    aldarharshad@gmail.com
                  </a>
                </li>
              </ul>
              <p className="text-[11px] text-slate-400 italic pt-2 border-t border-amber-500/20">
                Replacement requests are reviewed by the HR Sports & Nutrition team, and the decision to approve or reject a request is at our sole discretion.
              </p>
            </div>

            {/* Section 4 */}
            <div className="space-y-2">
              <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-[#f5b800] flex items-center justify-center text-xs font-black">
                  4
                </span>
                <span>Order Cancellations</span>
              </h2>
              <p className="pl-9 text-slate-400">
                Orders cannot be cancelled once they have been processed or dispatched. Any cancellation requests received after order confirmation will not be eligible for a refund.
              </p>
            </div>

            {/* Section 5 */}
            <div className="space-y-2">
              <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-[#f5b800] flex items-center justify-center text-xs font-black">
                  5
                </span>
                <span>Policy Disclaimer</span>
              </h2>
              <p className="pl-9 text-slate-400">
                HR Sports & Nutrition reserves the right to approve or reject any replacement claim after verification. This policy may be updated or modified at any time without prior notice.
              </p>
            </div>
          </div>

          {/* Section 6: Contact Us */}
          <div className="pt-8 border-t border-slate-800 space-y-6">
            <h3 className="font-heading text-xl font-bold text-white">
              6. Contact Us
            </h3>
            <p className="text-xs text-slate-400">
              For any concerns related to this policy, please contact our support desk:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800 space-y-2">
                <FiMail className="text-[#f5b800]" size={20} />
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Support Email</span>
                  <a href="mailto:aldarharshad@gmail.com" className="text-xs font-bold text-white hover:text-[#f5b800] transition block truncate">
                    aldarharshad@gmail.com
                </a>
              </div>

              <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800 space-y-2">
                <FiPhone className="text-[#f5b800]" size={20} />
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Phone & WhatsApp</span>
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
