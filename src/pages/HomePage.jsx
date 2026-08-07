import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  FiArrowRight,
  FiAward,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiHeadphones,
  FiMail,
  FiMapPin,
  FiPhone,
  FiShield,
  FiShoppingBag,
  FiTruck,
  FiZap,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import ProductCard from "../components/common/ProductCard";
import QuickViewModal from "../components/common/QuickViewModal";
import { useProducts } from "../context/ProductContext";

// Import Assets Images
import About1 from "../assets/About1.jpeg";
import About2 from "../assets/About2.jpeg";
import About3 from "../assets/About3.jpeg";
import About4 from "../assets/About4.jpeg";
import CatProtein from "../assets/Protein.jpeg";
import CatCreatine from "../assets/Creatine.jpeg";
import CatBCAA from "../assets/BCAA1.jpeg";
import CatMassGainer from "../assets/Mass Griner.jpeg";
import CatPreWorkout from "../assets/PRE workout.jpeg";
import CatAll from "../assets/ALL.jpeg";
import HeroBanner1 from "../assets/1.jpeg";
import Home1 from "../assets/Home1.jpeg";
import Home2 from "../assets/Home2.jpeg";
import Home3 from "../assets/Home3.jpeg";
import Home4 from "../assets/Home4.jpeg";
import Home5 from "../assets/Home5.jpeg";
import Home6 from "../assets/Home6.jpeg";
import Home7 from "../assets/Home7.jpeg";
import Home8 from "../assets/Home8.jpeg";
import Home9 from "../assets/Home9.jpeg";
// Latest Collection Product Images
import Latest1 from "../assets/LATEST1.jpeg";
import Latest2 from "../assets/LATEST2.jpeg";
import Latest3 from "../assets/LATEST3.jpeg";
import Latest4 from "../assets/LATEST4.jpeg";

export default function HomePage() {
  const { latestProducts, trendingProducts, popularProducts, setSelectedCategory, setSelectedTag } = useProducts();
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Hero Slider Auto-Animation
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      id: 1,
      image: Home1,
      tagline: "26G PROTEIN | 0G CARBS & FAT",
      title: "DIESEL 100% WHEY ISOLATE",
      subtitle: "Ultra-Filtered Pure Whey Isolate for Fast Muscle Recovery",
      btnText: "SHOP ISOLATE NOW",
      category: "Protein",
    },
    {
      id: 2,
      image: Home2,
      tagline: "PREMIUM SPORTS NUTRITION",
      title: "FUEL YOUR PERFORMANCE",
      subtitle: "Lab Certified Supplements Direct from Official Store",
      btnText: "EXPLORE CATALOG",
      category: "All",
    },
    {
      id: 3,
      image: Home3,
      tagline: "PURE CREATINE MONOHYDRATE",
      title: "MAXIMIZE YOUR STRENGTH",
      subtitle: "Clinically Dosed Creatine for Power, Strength & Explosive Gains",
      btnText: "SHOP CREATINE",
      category: "Creatine",
    },
    {
      id: 4,
      image: Home4,
      tagline: "BCAA AMINO ACIDS",
      title: "RECOVER FASTER, TRAIN HARDER",
      subtitle: "Essential Amino Acids to Reduce Muscle Soreness & Speed Recovery",
      btnText: "SHOP BCAA",
      category: "BCAA",
    },
    {
      id: 5,
      image: Home5,
      tagline: "MASS GAINER FORMULA",
      title: "BULK UP WITH POWER",
      subtitle: "High Calorie Mass Gainer for Serious Size & Strength Goals",
      btnText: "SHOP MASS GAINER",
      category: "Mass Gainer",
    },
    {
      id: 6,
      image: Home6,
      tagline: "PRE-WORKOUT ENERGY",
      title: "UNLEASH YOUR BEAST MODE",
      subtitle: "Explosive Energy & Laser Focus for Every Training Session",
      btnText: "SHOP PRE WORKOUT",
      category: "Pre Workout",
    },
    {
      id: 7,
      image: Home7,
      tagline: "FRD NUTRITION OFFICIAL",
      title: "TRUSTED BY ATHLETES",
      subtitle: "Premium Quality Supplements Trusted by Thousands of Fitness Enthusiasts",
      btnText: "SHOP NOW",
      category: "All",
    },
    {
      id: 8,
      image: Home8,
      tagline: "100% AUTHENTIC PRODUCTS",
      title: "QUALITY YOU CAN TRUST",
      subtitle: "Every Product Lab Tested & Quality Certified for Your Safety",
      btnText: "EXPLORE ALL",
      category: "All",
    },
    {
      id: 9,
      image: Home9,
      tagline: "VISIT OUR OFFICIAL STORE",
      title: "FRD NUTRITION STOREFRONT & HUB",
      subtitle: "Experience 100% Authentic Products & Expert Consultation Live in Rohtak",
      btnText: "VISIT STORE",
      category: "All",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  // Image Category Cards
  const categoryCards = [
    { name: "PROTEIN", categoryKey: "Protein", image: CatProtein },
    { name: "CREATINE", categoryKey: "Creatine", image: CatCreatine },
    { name: "BCAA", categoryKey: "BCAA", image: CatBCAA },
    { name: "MASS GAINER", categoryKey: "Mass Gainer", image: CatMassGainer },
    { name: "PRE WORKOUT", categoryKey: "Pre Workout", image: CatPreWorkout },
    { name: "ALL", categoryKey: "All", image: CatAll },
  ];

  return (
    <div className="bg-[#090d16] text-slate-100 min-h-screen">
      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}

      {/* CONTINUOUS HERO SLIDER BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0f172a] via-[#0b101d] to-[#090d16] border-b border-slate-800/80">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="relative min-h-[440px] sm:h-[480px] lg:h-[520px] w-full flex items-center z-10 py-6 sm:py-0">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 flex items-center justify-center ${
                index === currentSlide ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <div className="container-custom grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center h-full py-4 sm:py-8">
                <div className="lg:col-span-6 space-y-3 sm:space-y-4 text-center lg:text-left z-20">
                  <span className="inline-block px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[#f5b800] font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-md">
                    ⚡ {slide.tagline}
                  </span>

                  <h1 className="font-heading text-2xl sm:text-5xl font-black leading-tight tracking-tight text-white">
                    {slide.title}
                  </h1>

                  <p className="text-slate-300 text-xs sm:text-base max-w-lg leading-relaxed mx-auto lg:mx-0">
                    {slide.subtitle}
                  </p>

                  <div className="pt-2">
                    <Link
                      to="/supplements"
                      onClick={() => setSelectedCategory(slide.category)}
                      className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-[#f5b800] to-amber-500 text-slate-950 font-black hover:from-amber-400 hover:to-yellow-300 transition shadow-xl shadow-amber-500/20 text-xs sm:text-sm"
                    >
                      <span>{slide.btnText}</span>
                      <FiArrowRight size={18} />
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-6 flex justify-center items-center h-full">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="max-h-[160px] sm:max-h-[400px] object-contain drop-shadow-[0_25px_35px_rgba(245,184,0,0.2)] hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Slider Controls */}
          <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-30 flex items-center gap-2">
            <button
              onClick={prevSlide}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-900/80 border border-slate-700 hover:border-[#f5b800] text-slate-200 hover:text-[#f5b800] flex items-center justify-center transition shadow-xl"
              aria-label="Previous Slide"
            >
              <FiChevronLeft size={18} />
            </button>

            <button
              onClick={nextSlide}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-900/80 border border-slate-700 hover:border-[#f5b800] text-slate-200 hover:text-[#f5b800] flex items-center justify-center transition shadow-xl"
              aria-label="Next Slide"
            >
              <FiChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* CATEGORIES CARDS SHOWCASE */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5 }}
        className="py-8 sm:py-12 bg-[#0b101d] border-b border-slate-800/80"
      >
        <div className="container-custom">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {categoryCards.map((cat, index) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <Link
                  to="/supplements"
                  onClick={() => setSelectedCategory(cat.categoryKey)}
                  className="group relative h-36 sm:h-44 rounded-2xl overflow-hidden shadow-lg border border-slate-800 hover:border-amber-500/50 transition-all duration-300 block"
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/40 to-transparent flex items-end justify-center p-3">
                    <span className="font-heading font-black text-white text-[11px] sm:text-xs tracking-wider text-center group-hover:text-[#f5b800] transition-colors">
                      {cat.name}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* SECTION 1: LATEST COLLECTION */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.55 }}
        className="py-8 sm:py-14"
      >
        <div className="container-custom bg-[#0f172a]/90 p-4 sm:p-12 rounded-3xl sm:rounded-[2.5rem] shadow-2xl border border-slate-800/80 space-y-6 sm:space-y-10">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-black text-[#f5b800] uppercase tracking-widest block">
              FRD NUTRITION OFFICIAL WEBSITE
            </span>
            <h2 className="font-heading text-lg sm:text-2xl font-bold tracking-wider text-slate-200 uppercase flex items-center justify-center gap-2 sm:gap-3">
              <span>LATEST</span>
              <span className="font-black text-gradient-gold">COLLECTION</span>
              <span className="w-8 sm:w-12 h-0.5 bg-amber-500/40 inline-block" />
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Fresh arrivals just for you — discover what's new in our store.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
            {latestProducts.length > 0 ? (
              latestProducts.slice(0, 10).map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onQuickView={(p) => setQuickViewProduct(p)}
                />
              ))
            ) : (
              <p className="col-span-2 sm:col-span-5 text-center text-slate-500 text-sm py-8">
                No latest products set yet. Go to Admin → Edit products and enable "Latest".
              </p>
            )}
          </div>

          {/* Centered Button matching screenshot */}
          <div className="flex justify-center pt-2">
            <Link
              to="/supplements?tag=Just Launched"
              onClick={() => setSelectedTag("Just Launched")}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#f5b800] to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black uppercase text-xs sm:text-sm tracking-wider transition shadow-xl shadow-amber-500/20 active:scale-98"
            >
              <span>VIEW ALL PRODUCTS</span>
              <FiArrowRight size={18} />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* SECTION 2: TRENDING PRODUCTS */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.55 }}
        className="py-4 sm:py-6"
      >
        <div className="container-custom bg-[#0f172a]/90 p-4 sm:p-12 rounded-3xl sm:rounded-[2.5rem] shadow-2xl border border-slate-800/80 space-y-6 sm:space-y-10">
          <div className="text-center space-y-2">
            <h2 className="font-heading text-lg sm:text-2xl font-bold tracking-wider text-slate-200 uppercase flex items-center justify-center gap-2 sm:gap-3">
              <span>TRENDING</span>
              <span className="font-black text-gradient-gold">PRODUCTS</span>
              <span className="w-8 sm:w-12 h-0.5 bg-amber-500/40 inline-block" />
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              What's hot right now — trending supplements everyone's talking about.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
            {trendingProducts.length > 0 ? (
              trendingProducts.slice(0, 10).map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onQuickView={(p) => setQuickViewProduct(p)}
                />
              ))
            ) : (
              <p className="col-span-2 sm:col-span-5 text-center text-slate-500 text-sm py-8">
                No trending products set yet. Go to Admin → Edit products and enable "Trending".
              </p>
            )}
          </div>

          {/* Centered Button matching screenshot */}
          <div className="flex justify-center pt-2">
            <Link
              to="/supplements?tag=Trending"
              onClick={() => setSelectedTag("Trending")}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#f5b800] to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black uppercase text-xs sm:text-sm tracking-wider transition shadow-xl shadow-amber-500/20 active:scale-98"
            >
              <span>VIEW ALL PRODUCTS</span>
              <FiArrowRight size={18} />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* SECTION 3: POPULAR SUPPLEMENTS */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.55 }}
        className="py-4 sm:py-6"
      >
        <div className="container-custom bg-[#0f172a]/90 p-4 sm:p-12 rounded-3xl sm:rounded-[2.5rem] shadow-2xl border border-slate-800/80 space-y-6 sm:space-y-10">
          <div className="text-center space-y-2">
            <h2 className="font-heading text-lg sm:text-2xl font-bold tracking-wider text-slate-200 uppercase flex items-center justify-center gap-2 sm:gap-3">
              <span>POPULAR</span>
              <span className="font-black text-gradient-gold">SUPPLEMENTS</span>
              <span className="w-8 sm:w-12 h-0.5 bg-amber-500/40 inline-block" />
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Trusted by athletes and fitness lovers — our most loved supplements.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
            {popularProducts.length > 0 ? (
              popularProducts.slice(0, 10).map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onQuickView={(p) => setQuickViewProduct(p)}
                />
              ))
            ) : (
              <p className="col-span-2 sm:col-span-5 text-center text-slate-500 text-sm py-8">
                No popular products set yet. Go to Admin → Edit products and enable "Popular".
              </p>
            )}
          </div>

          {/* Centered Button matching screenshot */}
          <div className="flex justify-center pt-2">
            <Link
              to="/supplements?tag=Popular"
              onClick={() => setSelectedTag("Popular")}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#f5b800] to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black uppercase text-xs sm:text-sm tracking-wider transition shadow-xl shadow-amber-500/20 active:scale-98"
            >
              <span>VIEW ALL PRODUCTS</span>
              <FiArrowRight size={18} />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* SECTION 4: OUR POLICIES */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.55 }}
        className="py-14"
      >
        <div className="container-custom space-y-8">
          <h2 className="font-heading text-3xl font-extrabold text-center text-gradient-gold">
            Our Policies
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              whileHover={{ y: -6 }}
              className="bg-[#131b2e] p-8 rounded-3xl border border-slate-800 shadow-xl text-center space-y-3"
            >
              <motion.div
                animate={{ y: [-6, 6, -6] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[#f5b800] flex items-center justify-center mx-auto"
              >
                <FiShield size={28} />
              </motion.div>
              <h3 className="font-heading font-extrabold text-base text-white">
                Quality Guarantee
              </h3>
              <p className="text-xs text-slate-400">
                We deliver only the best quality products
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -6 }}
              className="bg-[#131b2e] p-8 rounded-3xl border border-slate-800 shadow-xl text-center space-y-3"
            >
              <motion.div
                animate={{ y: [-6, 6, -6] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[#f5b800] flex items-center justify-center mx-auto"
              >
                <FiShoppingBag size={28} />
              </motion.div>
              <h3 className="font-heading font-extrabold text-base text-white">
                Fast Delivery
              </h3>
              <p className="text-xs text-slate-400">
                Quick and reliable delivery to your doorstep
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -6 }}
              className="bg-[#131b2e] p-8 rounded-3xl border border-slate-800 shadow-xl text-center space-y-3"
            >
              <motion.div
                animate={{ y: [-6, 6, -6] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[#f5b800] flex items-center justify-center mx-auto"
              >
                <FiHeadphones size={28} />
              </motion.div>
              <h3 className="font-heading font-extrabold text-base text-white">
                24/7 Support
              </h3>
              <p className="text-xs text-slate-400">
                We're here anytime you need us
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* VISIT OUR STORE SECTION (AFTER OUR POLICIES) */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.55 }}
        className="py-12"
      >
        <div className="container-custom bg-[#131b2e] p-4 sm:p-12 rounded-3xl sm:rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-6 sm:space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center">
            {/* Left: Storefront & Interior Gallery */}
            <div className="lg:col-span-6 space-y-3 sm:space-y-4">
              {/* Main Large Store Image: About4 */}
              <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-700/80 bg-[#090d16]">
                <img
                  src={About4}
                  alt="FRD Nutrition Premium Storefront - About4"
                  className="w-full h-48 sm:h-[380px] object-cover object-top hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Bottom 3 Grid Images: About2, About3 & About1 */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border border-slate-700/80 bg-[#090d16]">
                  <img
                    src={About2}
                    alt="FRD Store Interior Shelves - About2"
                    className="w-full h-20 sm:h-32 object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border border-slate-700/80 bg-[#090d16]">
                  <img
                    src={About3}
                    alt="FRD Store Exterior Team - About3"
                    className="w-full h-20 sm:h-32 object-cover object-top hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border border-slate-700/80 bg-[#090d16]">
                  <img
                    src={About1}
                    alt="FRD Store Stock Display - About1"
                    className="w-full h-20 sm:h-32 object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            </div>

            {/* Right: Store Live Information */}
            <div className="lg:col-span-6 space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 text-[10px] sm:text-xs font-black text-[#f5b800] uppercase tracking-widest">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <FiMapPin className="text-[#f5b800]" size={14} />
                </div>
                <span>FRD NUTRITION STORE • LIVE EXPERIENCE</span>
              </div>

              <h2 className="font-heading text-xl sm:text-4xl font-extrabold text-white leading-tight">
                Experience Us Live: Visit Our Store
              </h2>

              <p className="text-slate-300 text-sm leading-relaxed">
                Visit the official FRD Nutrition store located in Rohtak, Haryana. We provide premium whey protein, gym supplements, creatine, BCAA, and sports nutrition products trusted by athletes and fitness enthusiasts across India.
              </p>

              <div className="space-y-2.5 text-xs text-slate-300 bg-[#090d16]/80 p-5 rounded-2xl border border-slate-800 shadow-inner">
                <p className="flex items-start gap-2.5">
                  <FiMapPin className="text-[#f5b800] shrink-0 mt-0.5" size={16} />
                  <span><strong>Address:</strong> Dev Colony Gali 1, Delhi Road, Rohtak, Haryana 124001</span>
                </p>
                <p className="flex items-center gap-2.5">
                  <FiPhone className="text-[#f5b800] shrink-0" size={16} />
                  <span><strong>Phone:</strong> +91 9088032004 • 01262 660027</span>
                </p>
                <p className="flex items-center gap-2.5">
                  <FiMail className="text-[#f5b800] shrink-0" size={16} />
                  <span><strong>Email:</strong> support@frdnutritionpremium.com</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="https://maps.google.com/?q=FRD+Nutrition+Dev+Colony+Gali+1+Delhi+Road+Rohtak+Haryana+124001"
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#f5b800] to-amber-500 text-slate-950 font-black hover:from-amber-400 hover:to-yellow-300 transition shadow-lg shadow-amber-500/20 flex items-center gap-2 text-xs"
                >
                  <FiMapPin size={16} />
                  <span>Visit Store on Maps</span>
                </a>

                <Link
                  to="/supplements"
                  className="px-6 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold hover:bg-slate-800 hover:border-[#f5b800] transition text-xs shadow-sm"
                >
                  Explore Our Products
                </Link>
              </div>

              <p className="text-xs text-slate-500 pt-2 border-t border-slate-800">
                Open daily • Premium supplements • Personalized guidance for your fitness journey.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* OFFICIAL BRAND STORY & STORE SHOWCASE SECTION */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.55 }}
        className="py-12 bg-[#0b101d] border-t border-slate-800"
      >
        <div className="container-custom space-y-8">
          <div className="max-w-4xl space-y-3">
            <span className="text-[#f5b800] text-xs font-black uppercase tracking-widest">
              OFFICIAL BRAND HUB
            </span>
            <h2 className="font-heading text-3xl font-extrabold text-white">
              FRD Nutrition Official Website
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              FRD Nutrition is a trusted sports nutrition brand based in Rohtak, Haryana founded by Ram Niwas. We provide premium raw whey protein isolate, gym supplements, creatine, BCAA and mass gainers for athletes and fitness enthusiasts across India.
            </p>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Shop authentic FRD Nutrition supplements directly from our official website. Our mission is to deliver high-quality sports nutrition products that help you build muscle, improve performance and achieve your fitness goals.
            </p>
          </div>
        </div>
      </motion.section>
    </div>
  );
}