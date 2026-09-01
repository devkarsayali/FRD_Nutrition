import { motion } from "framer-motion";
import { FaInstagram } from "react-icons/fa";
import { FiAward, FiCheckCircle, FiMail, FiMapPin, FiPhone, FiPlayCircle, FiShield, FiTruck } from "react-icons/fi";
import { Link } from "react-router-dom";

// Import Assets
import About1 from "../assets/about.jpg";
import About2 from "../assets/About2.jpeg";
import About3 from "../assets/About3.jpeg";
import About4 from "../assets/About4.jpeg";
import FounderVideo from "../assets/Founder.mp4";
import AboutVideo from "../assets/About Video.mp4";

export default function AboutPage() {
  return (
    <div className="bg-[#090d16] text-slate-100 min-h-screen py-16">
      <div className="container-custom space-y-20">

        {/* SECTION 1: TOP BANNER & THE STORY OF FRD NUTRITION (2-COLUMN: LEFT INFO, RIGHT ABOUT1 IMAGE) */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="bg-[#131b2e] p-5 sm:p-12 rounded-3xl sm:rounded-[2.5rem] border border-slate-800 shadow-2xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Side: Info */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[#f5b800] text-xs font-black uppercase tracking-widest">
                THE STORY OF HR SPORTS & NUTRITION
              </span>
              <h1 className="font-heading text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                ABOUT <span className="text-gradient-gold">HR SPORTS & NUTRITION</span>
              </h1>
              <h2 className="text-xs sm:text-sm font-bold text-[#f5b800] uppercase tracking-wider">
                ENGINEERED FOR UNCOMPROMISED ATHLETIC PERFORMANCE
              </h2>
              <div className="space-y-4 text-slate-300 text-xs sm:text-sm leading-relaxed pt-2">
                <p>
                  HR Sports & Nutrition is a trusted sports nutrition brand based in Sangli, Maharashtra, dedicated to providing premium quality whey protein, gym supplements and performance nutrition products.
                </p>
                <p>
                  Our goal is simple — help athletes, bodybuilders and fitness enthusiasts achieve their goals with safe, effective and scientifically designed supplements.
                </p>
                <p className="text-slate-200 font-medium border-l-2 border-[#f5b800] pl-4 italic">
                  Today HR Sports & Nutrition products are trusted by thousands of fitness lovers across India who want authentic sports nutrition and reliable results.
                </p>
              </div>
            </div>

            {/* Right Side: Video AboutVideo */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-700/80 bg-[#090d16] group">
                <video
                  src={AboutVideo}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-64 sm:h-[420px] object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090d16]/70 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 bg-[#090d16]/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-200 uppercase tracking-wider">
                    HR Sports & Nutrition Store & Stock • Sangli
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* SECTION 2: MEET THE FOUNDERS WITH Founder.mp4 VIDEO */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6 }}
          className="bg-[#131b2e] p-5 sm:p-12 rounded-3xl sm:rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left: Founder Video Player (Muted Autoplay Video from assets Founder.mp4) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-700/80 bg-[#090d16] group">
                <video
                  src={FounderVideo}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                  className="w-full h-64 sm:h-[450px] object-contain object-center scale-[1.35] origin-center"
                />
                <div className="absolute top-4 left-4 bg-[#090d16]/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/60 flex items-center gap-2 pointer-events-none">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wider">
                    Founders • Founder Video
                  </span>
                </div>
              </div>

              {/* Instagram Reel Button Link */}
              <div className="flex justify-center sm:justify-start">
                <a
                  href="https://www.instagram.com/hrsportsandnutrision/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-bold text-xs hover:opacity-95 transition shadow-lg"
                >
                  <FaInstagram size={16} />
                  <span>Watch Founder Reel on Instagram</span>
                </a>
              </div>
            </div>

            {/* Right: Founder Information & Bio */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-2">
                <span className="text-[#f5b800] text-xs font-black uppercase tracking-widest block">
                  MEET THE FOUNDERS
                </span>
                <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white">
                  Harshad Aldar & Rahul Chavan
                </h2>
                <p className="text-xs text-amber-400 font-semibold tracking-wider uppercase">
                  Founders, HR Sports & Nutrition • Sangli, Maharashtra
                </p>
              </div>

              <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
                <p>
                  Harshad Aldar and Rahul Chavan are the founders of HR Sports & Nutrition and passionate fitness enthusiasts dedicated to improving the sports nutrition industry in India.
                </p>
                <p>
                  With years of experience in the fitness industry, they built HR Sports & Nutrition with a vision to provide authentic supplements that help individuals build strength, muscle and confidence.
                </p>
                <p className="text-slate-200 font-medium border-l-2 border-[#f5b800] pl-4 italic">
                  "Their mission is to ensure every athlete and gym enthusiast has access to high quality supplements that are both effective and trustworthy."
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-[#f5b800]" size={16} />
                  <span>100% Authentic Guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiAward className="text-[#f5b800]" size={16} />
                  <span>HPLC Tested Batch Quality</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* SECTION 3: WHY CHOOSE US */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55 }}
          className="space-y-8"
        >
          <div className="text-center space-y-2">
            <span className="text-[#f5b800] text-xs font-black uppercase tracking-widest">
              WHY CHOOSE US
            </span>
            <h2 className="font-heading text-3xl font-extrabold text-white">
              The HR Sports & Nutrition Gold Standard
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-[#131b2e] border border-slate-800 space-y-4 shadow-xl hover:border-amber-500/40 transition flex flex-col items-center text-center">
              <motion.div
                animate={{ y: [-6, 6, -6] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[#f5b800] flex items-center justify-center font-bold"
              >
                <FiShield size={24} />
              </motion.div>
              <h3 className="font-heading text-xl font-bold text-white">Premium Quality</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                HR Sports & Nutrition products are developed with high quality ingredients and tested for purity and performance.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#131b2e] border border-slate-800 space-y-4 shadow-xl hover:border-amber-500/40 transition flex flex-col items-center text-center">
              <motion.div
                animate={{ y: [-6, 6, -6] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[#f5b800] flex items-center justify-center font-bold"
              >
                <FiAward size={24} />
              </motion.div>
              <h3 className="font-heading text-xl font-bold text-white">Trusted Brand</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Thousands of athletes and gym enthusiasts trust HR Sports & Nutrition supplements for their daily performance and recovery.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#131b2e] border border-slate-800 space-y-4 shadow-xl hover:border-amber-500/40 transition flex flex-col items-center text-center">
              <motion.div
                animate={{ y: [-6, 6, -6] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[#f5b800] flex items-center justify-center font-bold"
              >
                <FiTruck size={24} />
              </motion.div>
              <h3 className="font-heading text-xl font-bold text-white">Fast Delivery</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                We deliver genuine HR Sports & Nutrition products across India with fast shipping and secure checkout.
              </p>
            </div>
          </div>
        </motion.div>




        {/* SECTION 6: QUALITY GUARANTEE CALL TO ACTION */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55 }}
          className="p-10 rounded-3xl bg-[#131b2e] border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl"
        >
          <div className="space-y-2">
            <h3 className="font-heading text-2xl font-bold text-white">
              Ready to Upgrade Your Training?
            </h3>
            <p className="text-xs text-slate-400 max-w-md">
              Browse our supplement line and feel the difference of pure bio-available nutrition.
            </p>
          </div>
          <Link
            to="/supplements"
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#f5b800] to-amber-500 text-slate-950 font-black hover:from-amber-400 hover:to-yellow-300 transition text-sm whitespace-nowrap shadow-lg shadow-amber-500/20"
          >
            Explore Supplements
          </Link>
        </motion.div>

      </div>
    </div>
  );
}