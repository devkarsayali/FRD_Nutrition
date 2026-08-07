import { createContext, useContext, useEffect, useState } from "react";
import { CATEGORIES, INITIAL_PRODUCTS } from "../data/initialProducts";

const ProductContext = createContext();
const STORAGE_KEY = "frd_products_inventory_v7";

const normalizeStockValue = (product) => {
  if (!product) return product;

  const nextInStock = product.inStock ?? true;
  const rawStock = product.stockQuantity === undefined || product.stockQuantity === null ? "" : String(product.stockQuantity).trim();

  const normalizedStock = nextInStock === false
    ? "0"
    : rawStock || "36";

  return {
    ...product,
    inStock: nextInStock,
    stockQuantity: normalizedStock,
  };
};

const normalizeProducts = (productsList) => {
  if (!Array.isArray(productsList)) return INITIAL_PRODUCTS;
  return productsList.map(normalizeStockValue);
};

export const TAGS = [
  "All Tags",
  "Popular",
  "Just Launched",
  "Editor's Choice",
  "Trending",
];

export function ProductProvider({ children }) {
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return normalizeProducts(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load products from localStorage", error);
    }
    return normalizeProducts(INITIAL_PRODUCTS);
  });

  const [categoriesList, setCategoriesList] = useState([
    "All Categories",
    "Protein",
    "Creatine",
    "BCAA",
    "Mass Gainer",
    "Pre Workout",
    "Post Workout",
    "Vitamins",
  ]);

  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedTag, setSelectedTag] = useState("All Tags");
  const [maxPrice, setMaxPrice] = useState(50000);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("relevance"); // relevance, price-low, price-high, rating

  const loadCategories = () => {
    try {
      const savedCats = localStorage.getItem("frd_admin_categories_v2");
      let catNames = [];
      if (savedCats) {
        const parsed = JSON.parse(savedCats);
        if (Array.isArray(parsed) && parsed.length > 0) {
          catNames = parsed.map((c) => c.name);
        }
      }
      if (catNames.length === 0) {
        catNames = ["Protein", "Creatine", "BCAA", "Mass Gainer", "Pre Workout", "Post Workout", "Vitamins"];
      }

      const uniqueCats = ["All Categories", ...Array.from(new Set(catNames))];
      setCategoriesList(uniqueCats);
    } catch {
      setCategoriesList(["All Categories", "Protein", "Creatine", "BCAA", "Mass Gainer", "Pre Workout", "Post Workout", "Vitamins"]);
    }
  };

  useEffect(() => {
    loadCategories();
    window.addEventListener("frd_categories_updated", loadCategories);
    window.addEventListener("storage", loadCategories);
    return () => {
      window.removeEventListener("frd_categories_updated", loadCategories);
      window.removeEventListener("storage", loadCategories);
    };
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
      console.error("Failed to save products to localStorage", error);
    }
  }, [products]);

  // Admin CRUD Functions
  const addProduct = (newProduct) => {
    const imagesArray = Array.isArray(newProduct.images) && newProduct.images.length > 0
      ? newProduct.images
      : newProduct.image
        ? [newProduct.image]
        : [];

    const videosArray = Array.isArray(newProduct.videos) ? newProduct.videos : [];

    const createdProduct = normalizeStockValue({
      ...newProduct,
      id: `frd-custom-${Date.now()}`,
      rating: newProduct.rating || 5.0,
      reviewsCount: newProduct.reviewsCount || 1,
      image: imagesArray[0] || newProduct.image,
      images: imagesArray,
      videos: videosArray,
      inStock: newProduct.inStock ?? true,
      stockQuantity: newProduct.stockQuantity || "36",
    });

    setProducts((prev) => [createdProduct, ...prev]);
  };

  const updateProduct = (updatedProduct) => {
    const imagesArray = Array.isArray(updatedProduct.images) && updatedProduct.images.length > 0
      ? updatedProduct.images
      : updatedProduct.image
        ? [updatedProduct.image]
        : [];

    const videosArray = Array.isArray(updatedProduct.videos) ? updatedProduct.videos : [];

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== updatedProduct.id) return p;

        return normalizeStockValue({
          ...p,
          ...updatedProduct,
          image: imagesArray[0] || updatedProduct.image || p.image,
          images: imagesArray.length > 0 ? imagesArray : p.images,
          videos: videosArray,
        });
      })
    );
  };

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleStockStatus = (id) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;

        const nextInStock = !p.inStock;
        return normalizeStockValue({
          ...p,
          inStock: nextInStock,
          stockQuantity: nextInStock
            ? (p.stockQuantity && String(p.stockQuantity).trim() !== "0" ? String(p.stockQuantity).trim() : "36")
            : "0",
        });
      })
    );
  };

  const resetToDefaultData = () => {
    const normalizedDefaults = normalizeProducts(INITIAL_PRODUCTS);
    setProducts(normalizedDefaults);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedDefaults));
  };

  // Section-specific dynamic lists (driven by admin flags)
  const latestProducts = products.filter((p) => p.isLatest && p.inStock);
  const trendingProducts = products.filter((p) => p.isTrending && p.inStock);
  const popularProducts = products.filter((p) => p.isPopular && p.inStock);

  // Filtered & Sorted Products
  const filteredProducts = products.filter((product) => {
    const normCategory = selectedCategory.toLowerCase().trim();
    const prodCatRaw = (product.category || "").toLowerCase().trim();

    const matchesCategory =
      normCategory === "all categories" ||
      normCategory === "all" ||
      prodCatRaw === normCategory ||
      prodCatRaw.includes(normCategory) ||
      normCategory.includes(prodCatRaw);

    const matchesPrice = product.price <= maxPrice;

    const normTag = selectedTag.toLowerCase();
    let matchesTag = true;
    if (normTag === "popular") matchesTag = Boolean(product.isPopular || product.isTopSeller);
    else if (normTag === "just launched") matchesTag = Boolean(product.isLatest || product.isJustLaunched || product.badge === "NEW");
    else if (normTag === "editor's choice") matchesTag = Boolean(product.isEditorsChoice);
    else if (normTag === "trending") matchesTag = Boolean(product.isTrending || product.badge === "BEST SELLER");

    const matchesSearch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesPrice && matchesTag && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "rating") return b.rating - a.rating;
    return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
  });

  return (
    <ProductContext.Provider
      value={{
        products,
        latestProducts,
        trendingProducts,
        popularProducts,
        categories: categoriesList,
        tags: TAGS,
        filteredProducts: sortedProducts,
        selectedCategory,
        setSelectedCategory,
        selectedTag,
        setSelectedTag,
        maxPrice,
        setMaxPrice,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleStockStatus,
        resetToDefaultData,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
}
