import { motion } from "framer-motion";
import {
  FiLock,
  FiMail,
  FiPhone,
  FiShield,
  FiUserCheck,
} from "react-icons/fi";

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-[#090d16] text-slate-100 min-h-screen py-12 sm:py-16">
      <div className="container-custom max-w-5xl space-y-10">
        {/* Top Header */}
        <div className="text-center space-y-3">
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[#f5b800] text-xs font-black uppercase tracking-widest">
            OFFICIAL STORE POLICY
          </span>
          <h1 className="font-heading text-3xl sm:text-5xl font-black text-white tracking-tight">
            Privacy <span className="text-gradient-gold">Policy</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            At HR Sports & Nutrition, we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our website.
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
                <FiLock size={20} />
              </div>
              <h3 className="font-heading text-sm font-bold text-white">Data Protection</h3>
              <p className="text-xs text-slate-400">Strict technical measures against unauthorized data access</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-[#f5b800] flex items-center justify-center font-bold">
                <FiShield size={20} />
              </div>
              <h3 className="font-heading text-sm font-bold text-white">Payment Security</h3>
              <p className="text-xs text-slate-400">Card details are never saved on our local servers</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-[#f5b800] flex items-center justify-center font-bold">
                <FiUserCheck size={20} />
              </div>
              <h3 className="font-heading text-sm font-bold text-white">User Consent</h3>
              <p className="text-xs text-slate-400">Data used strictly for order fulfillment & service support</p>
            </div>
          </div>

          {/* Detailed Policy Sections */}
          <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
            {/* Section 1 */}
            <div className="space-y-3">
              <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-[#f5b800] flex items-center justify-center text-xs font-black">
                  1
                </span>
                <span>Information We Collect</span>
              </h2>
              <ul className="pl-9 text-slate-400 space-y-1.5 list-disc text-xs">
                <li>Name, phone number, email address</li>
                <li>Shipping and billing address</li>
                <li>Order and transaction details</li>
                <li>Login details (including Google login if used)</li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="space-y-3">
              <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-[#f5b800] flex items-center justify-center text-xs font-black">
                  2
                </span>
                <span>How We Use Your Information</span>
              </h2>
              <ul className="pl-9 text-slate-400 space-y-1.5 list-disc text-xs">
                <li>To process and deliver orders</li>
                <li>To send order, shipping, and transactional emails</li>
                <li>To provide customer support</li>
                <li>To improve our website and services</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="space-y-2">
              <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-[#f5b800] flex items-center justify-center text-xs font-black">
                  3
                </span>
                <span>Data Protection</span>
              </h2>
              <p className="pl-9 text-slate-400">
                We implement appropriate security measures to protect your personal data against unauthorized access, alteration, or disclosure.
              </p>
            </div>

            {/* Section 4 */}
            <div className="space-y-2">
              <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-[#f5b800] flex items-center justify-center text-xs font-black">
                  4
                </span>
                <span>Payment Security</span>
              </h2>
              <p className="pl-9 text-slate-400">
                All payments are processed through secure third-party payment gateways. We do not store your card or banking details on our servers.
              </p>
            </div>

            {/* Section 5 */}
            <div className="space-y-2">
              <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-[#f5b800] flex items-center justify-center text-xs font-black">
                  5
                </span>
                <span>Third-Party Services</span>
              </h2>
              <p className="pl-9 text-slate-400">
                We may use third-party services such as courier partners, analytics tools, and payment providers strictly for order fulfillment and website functionality.
              </p>
            </div>

            {/* Section 6 */}
            <div className="space-y-2">
              <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-[#f5b800] flex items-center justify-center text-xs font-black">
                  6
                </span>
                <span>Policy Updates</span>
              </h2>
              <p className="pl-9 text-slate-400">
                HR Sports & Nutrition reserves the right to update this Privacy Policy at any time. Changes will be effective immediately upon posting on the website.
              </p>
            </div>
          </div>

          {/* Section 7: Contact Information */}
          <div className="pt-8 border-t border-slate-800 space-y-6">
            <h3 className="font-heading text-xl font-bold text-white">
              7. Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800 space-y-2">
                <FiMail className="text-[#f5b800]" size={20} />
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Privacy Contact</span>
                <a href="mailto:aldarharshad@gmail.com" className="text-xs font-bold text-white hover:text-[#f5b800] transition block truncate">
                  aldarharshad@gmail.com
                </a>
              </div>

              <div className="p-5 rounded-2xl bg-[#0b101d] border border-slate-800 space-y-2">
                <FiPhone className="text-[#f5b800]" size={20} />
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Helpline</span>
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
