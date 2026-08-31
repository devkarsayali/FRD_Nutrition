import Latest1 from "../assets/LATEST1.jpeg";
import Latest2 from "../assets/LATEST2.jpeg";
import Latest3 from "../assets/LATEST3.jpeg";
import Latest4 from "../assets/LATEST4.jpeg";
import CatProtein from "../assets/Protein.jpeg";
import CatCreatine from "../assets/Creatine.jpeg";
import CatBCAA from "../assets/BCAA1.jpeg";
import CatPreWorkout from "../assets/PRE workout.jpeg";

export const INITIAL_PRODUCTS = [
  {
    id: "frd-prod-1",
    name: "FRD RAW WHEY ISOLATE 100% PURE",
    category: "Protein",
    price: 3499,
    originalPrice: 4299,
    image: Latest1,
    images: [Latest1],
    description: "Ultra-pure whey protein isolate engineered for ultra-fast muscle recovery, lean muscle gain and maximum bioavailability.",
    badge: "POPULAR",
    inStock: true,
    stockQuantity: 50,
    rating: 5.0,
    reviewsCount: 42,
    createdAt: "2026-08-30T10:00:00.000Z",
    isLatest: true,
    isTrending: true,
  },
  {
    id: "frd-prod-2",
    name: "FRD CREATINE MONOHYDRATE ULTRA MICRONIZED",
    category: "Creatine",
    price: 999,
    originalPrice: 1499,
    image: Latest2,
    images: [Latest2],
    description: "Pure micronized creatine monohydrate to enhance explosive power, strength and endurance during intense athletic training.",
    badge: "TRENDING",
    inStock: true,
    stockQuantity: 40,
    rating: 4.9,
    reviewsCount: 38,
    createdAt: "2026-08-29T10:00:00.000Z",
    isLatest: true,
    isTrending: true,
  },
  {
    id: "frd-prod-3",
    name: "FRD PRE-WORKOUT EXPLOSIVE PUMP & ENERGY",
    category: "Pre Workout",
    price: 1899,
    originalPrice: 2499,
    image: Latest3,
    images: [Latest3],
    description: "High-intensity pre-workout formula designed for insane focus, laser mental clarity, and intense muscle pumps.",
    badge: "JUST LAUNCHED",
    inStock: true,
    stockQuantity: 35,
    rating: 4.8,
    reviewsCount: 29,
    createdAt: "2026-08-28T10:00:00.000Z",
    isLatest: true,
    isTrending: true,
  },
  {
    id: "frd-prod-4",
    name: "FRD BCAA AMINO ACIDS 2:1:1 RECOVERY FORMULA",
    category: "BCAA",
    price: 1499,
    originalPrice: 1999,
    image: Latest4,
    images: [Latest4],
    description: "Essential branched-chain amino acids to prevent muscle breakdown during workout and speed up post-workout repair.",
    badge: "POPULAR",
    inStock: true,
    stockQuantity: 45,
    rating: 4.9,
    reviewsCount: 31,
    createdAt: "2026-08-27T10:00:00.000Z",
    isLatest: true,
    isTrending: true,
  },
];

export const CATEGORIES = ["All Categories"];

export const DEFAULT_ADMIN_CATEGORIES = [
  {
    id: "cat-vitamins",
    name: "Vitamins",
    slug: "vitamins",
    description: "Essential vitamins and micronutrient supplements that support immunity, energy production, bone health, metabolism, and overall health.",
    badge: "Active",
  },
  {
    id: "cat-protein",
    name: "Protein",
    slug: "protein",
    description: "High-quality protein supplements designed to support muscle growth, recovery, strength, and daily protein requirements.",
    badge: "Active",
  },
  {
    id: "cat-creatine",
    name: "Creatine",
    slug: "creatine",
    description: "Premium creatine supplements that improve strength, power, endurance, and muscle performance during high-intensity workouts.",
    badge: "Active",
  },
  {
    id: "cat-bcaa",
    name: "BCAA",
    slug: "bcaa",
    description: "Branched Chain Amino Acid supplements formulated to reduce muscle breakdown, improve recovery, and support lean muscle maintenance.",
    badge: "Active",
  },
  {
    id: "cat-massgainer",
    name: "Mass Gainer",
    slug: "mass-gainer",
    description: "High calorie nutrition supplements enriched with protein and carbohydrates to help increase healthy body weight and muscle mass.",
    badge: "Active",
  },
  {
    id: "cat-preworkout",
    name: "Pre Workout",
    slug: "pre-workout",
    description: "Energy boosting formulas containing performance enhancing ingredients to improve focus, endurance, strength, and workout intensity.",
    badge: "Active",
  },
  {
    id: "cat-postworkout",
    name: "Post Workout",
    slug: "post-workout",
    description: "Recovery supplements designed to replenish nutrients, repair muscle tissue, and reduce muscle soreness after intense exercise.",
    badge: "Active",
  },
];

