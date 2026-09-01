import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter, FaYoutube } from "react-icons/fa";
import { FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useProducts } from "../../context/ProductContext";
import oipLogo from "../../assets/OIP2-removebg-preview.png";

export default function Footer() {
  const { setSelectedCategory } = useProducts();

  return (
    <footer className="bg-[#070b14] text-slate-300 border-t border-slate-800/80 py-4 sm:py-5">
      <div className="container-custom space-y-3">
        {/* Compact Top Brand & Contact Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <img
              src={oipLogo}
              alt="HR Sports & Nutrition Logo"
              className="h-14 w-auto object-contain filter drop-shadow-[0_0_10px_rgba(245,184,0,0.2)]"
            />
            <div>
              <span className="font-heading font-black text-lg text-gradient-gold leading-none inline-block">
                HR SPORTS & NUTRITION
              </span>
              <span className="text-[10px] text-slate-400 font-medium sm:inline-block sm:ml-2">
                • Official Sports Nutrition • Sangli, Maharashtra
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <FiPhone className="text-[#f5b800]" size={14} />
              <a href="tel:+918767942220" className="font-semibold text-slate-200 hover:text-[#f5b800] transition">+91 8767942220</a>
              <span className="text-slate-500">|</span>
              <a href="tel:+919309140591" className="font-semibold text-slate-200 hover:text-[#f5b800] transition">+91 9309140591</a>
            </div>
            <div className="hidden sm:block text-slate-700">•</div>
            <div className="flex items-center gap-2">
              <FiMail className="text-[#f5b800]" size={14} />
              <a href="mailto:aldarharshad@gmail.com" className="text-slate-300 hover:text-[#f5b800] transition">aldarharshad@gmail.com</a>
            </div>
            <div className="hidden sm:block text-slate-700">•</div>
            <div className="flex items-center gap-2">
              <FiMapPin className="text-[#f5b800]" size={14} />
              <a href="https://maps.google.com/maps?q=16.845714569091797%2C74.58794403076172&z=17&hl=en" target="_blank" rel="noreferrer" className="text-slate-300 hover:text-[#f5b800] transition">Dhami Chowk, Sangli</a>
            </div>
          </div>
        </div>

        {/* Compact 5-Column Navigation Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 py-0">
          {/* Column 1: SHOP */}
          <div className="space-y-2.5">
            <h4 className="font-heading font-black text-[#f5b800] text-[11px] uppercase tracking-wider">
              SHOP
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400 font-medium">
              <li>
                <Link to="/supplements" onClick={() => setSelectedCategory("Protein")} className="hover:text-white transition">
                  Protein
                </Link>
              </li>
              <li>
                <Link to="/supplements" onClick={() => setSelectedCategory("BCAA")} className="hover:text-white transition">
                  BCAA
                </Link>
              </li>
              <li>
                <Link to="/supplements" onClick={() => setSelectedCategory("Creatine")} className="hover:text-white transition">
                  Creatine
                </Link>
              </li>
              <li>
                <Link to="/supplements" onClick={() => setSelectedCategory("Pre Workout")} className="hover:text-white transition">
                  Pre-Workout
                </Link>
              </li>
              <li>
                <Link to="/supplements" onClick={() => setSelectedCategory("All")} className="hover:text-white transition">
                  Vitamins
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: SUPPORT */}
          <div className="space-y-2.5">
            <h4 className="font-heading font-black text-[#f5b800] text-[11px] uppercase tracking-wider">
              SUPPORT
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400 font-medium">
              <li>
                <Link to="/contact" className="hover:text-white transition">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link to="/shipping-info" className="hover:text-white transition">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link to="/returns-policy" className="hover:text-white transition">
                  Returns & Refunds
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: COMPANY */}
          <div className="space-y-2.5">
            <h4 className="font-heading font-black text-[#f5b800] text-[11px] uppercase tracking-wider">
              COMPANY
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400 font-medium">
              <li>
                <Link to="/about" className="hover:text-white transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-conditions" className="hover:text-white transition">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: ACCOUNT */}
          <div className="space-y-2.5">
            <h4 className="font-heading font-black text-[#f5b800] text-[11px] uppercase tracking-wider">
              ACCOUNT
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400 font-medium">
              <li>
                <Link to="/user/login" className="hover:text-white transition">
                  Log in
                </Link>
              </li>
              <li>
                <Link to="/user/login" className="hover:text-white transition">
                  Sign up
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: FOLLOW US */}
          <div className="space-y-2.5 col-span-2 sm:col-span-1">
            <h4 className="font-heading font-black text-[#f5b800] text-[11px] uppercase tracking-wider">
              FOLLOW US
            </h4>
            <div className="flex items-center gap-2 pt-0.5">
              <a
                href=""
                target="_blank"
                rel="noreferrer"
                className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-[#f5b800] text-slate-300 hover:text-slate-950 flex items-center justify-center transition shadow-sm"
                aria-label="Facebook - HR Sports & Nutrition"
              >
                <FaFacebookF size={12} />
              </a>
              <a
                href="https://www.instagram.com/hrsportsandnutrision/"
                target="_blank"
                rel="noreferrer"
                className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-[#f5b800] text-slate-300 hover:text-slate-950 flex items-center justify-center transition shadow-sm"
                aria-label="Instagram - @hrsportsandnutrision"
              >
                <FaInstagram size={12} />
              </a>
              <a
                href=""
                target="_blank"
                rel="noreferrer"
                className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-[#f5b800] text-slate-300 hover:text-slate-950 flex items-center justify-center transition shadow-sm"
                aria-label="YouTube - HR Sports & Nutrition"
              >
                <FaYoutube size={12} />
              </a>
              <a

                target="_blank"
                rel="noreferrer"
                className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-[#f5b800] text-slate-300 hover:text-slate-950 flex items-center justify-center transition shadow-sm"
                aria-label="Twitter"
              >
                <FaTwitter size={12} />
              </a>
              <a

                target="_blank"
                rel="noreferrer"
                className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-[#f5b800] text-slate-300 hover:text-slate-950 flex items-center justify-center transition shadow-sm"
                aria-label="LinkedIn"
              >
                <FaLinkedinIn size={12} />
              </a>
            </div>
          </div>
        </div>

        {/* Compact Bottom Copyright Bar */}
        <div className="pt-2 border-t border-slate-800/60">
          <p className="text-center text-[11px] text-slate-500">
            © 2026 HR SPORTS & NUTRITION. Official Website. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}