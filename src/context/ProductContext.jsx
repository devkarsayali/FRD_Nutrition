import { createContext, useContext, useEffect, useState } from "react";
import { CATEGORIES, INITIAL_PRODUCTS } from "../data/initialProducts";

const ProductContext = createContext();
const STORAGE_KEY = "frd_products_inventory_v7";

const normalizeStockValue = (product, index = 0) => {
  if (!product) return product;

  const nextInStock = product.inStock ?? true;
  let rawStock = product.stockQuantity;
  let parsedQty;

  if (rawStock === undefined || rawStock === null || String(rawStock).trim() === "") {
    parsedQty = nextInStock === false ? 0 : 36;
  } else {
    const extracted = String(rawStock).replace(/[^\d]/g, "");
    parsedQty = extracted === "" ? (nextInStock === false ? 0 : 36) : parseInt(extracted, 10);
  }

  const finalInStock = nextInStock !== false && parsedQty > 0;
  const finalStockQty = finalInStock ? parsedQty : 0;

  // Infer or preserve creation timestamp for strict creation-date ordering
  let createdAt = product.createdAt || product.created_at;
  if (!createdAt) {
    if (typeof product.id === "string" && product.id.startsWith("frd-custom-")) {
      const tsNum = Number(product.id.replace("frd-custom-", ""));
      if (!isNaN(tsNum) && tsNum > 0) {
        createdAt = new Date(tsNum).toISOString();
      }
    }
  }
  if (!createdAt) {
    // Fallback timestamp for initial catalog items
    createdAt = new Date(1770000000000 - index * 86400000).toISOString();
  }

  return {
    ...product,
    createdAt,
    inStock: finalInStock,
    stockQuantity: finalStockQty,
  };
};

const normalizeProducts = (productsList) => {
  if (!Array.isArray(productsList)) return INITIAL_PRODUCTS.map((p, idx) => normalizeStockValue(p, idx));
  return productsList.map((p, idx) => normalizeStockValue(p, idx));
};

export const getProductCategoryKey = (prod) => {
  if (!prod || !prod.category) return "Protein";
  const cat = prod.category.toLowerCase().trim();

  if (cat.includes("creatine")) return "Creatine";
  if (cat.includes("bcaa") || cat.includes("eaa")) return "BCAA";
  if (cat.includes("mass") || cat.includes("gainer")) return "Mass Gainer";
  if (cat.includes("pre workout") || cat.includes("pre-workout") || cat.includes("pump")) return "Pre Workout";
  if (cat.includes("post workout") || cat.includes("post-workout")) return "Post Workout";
  if (cat.includes("vitamin") || cat.includes("fat burner") || cat.includes("carnitine")) return "Vitamins";
  return "Protein";
};

export const TAGS = [
  "All Tags",
  "Popular",
  "Just Launched",
  "Trending",
  "Editor's Choice",
];

export function ProductProvider({ children }) {
  const loadStoredProducts = () => {
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
  };

  const [products, setProducts] = useState(loadStoredProducts);

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

  // Real-time listener for products updated from other components or tabs
  useEffect(() => {
    const handleProductsUpdated = () => {
      setProducts(loadStoredProducts());
    };

    window.addEventListener("frd_products_updated", handleProductsUpdated);
    window.addEventListener("storage", handleProductsUpdated);
    return () => {
      window.removeEventListener("frd_products_updated", handleProductsUpdated);
      window.removeEventListener("storage", handleProductsUpdated);
    };
  }, []);

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
      stockQuantity: newProduct.stockQuantity !== undefined ? newProduct.stockQuantity : 36,
    });

    setProducts((prev) => {
      const updated = [createdProduct, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    window.dispatchEvent(new CustomEvent("frd_products_updated"));
  };

  const updateProduct = (updatedProduct) => {
    const imagesArray = Array.isArray(updatedProduct.images) && updatedProduct.images.length > 0
      ? updatedProduct.images
      : updatedProduct.image
        ? [updatedProduct.image]
        : [];

    const videosArray = Array.isArray(updatedProduct.videos) ? updatedProduct.videos : [];

    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== updatedProduct.id) return p;

        return normalizeStockValue({
          ...p,
          ...updatedProduct,
          image: imagesArray[0] || updatedProduct.image || p.image,
          images: imagesArray.length > 0 ? imagesArray : p.images,
          videos: videosArray,
        });
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    window.dispatchEvent(new CustomEvent("frd_products_updated"));
  };

  const deleteProduct = (id) => {
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    window.dispatchEvent(new CustomEvent("frd_products_updated"));
  };

  const toggleStockStatus = (id) => {
    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== id) return p;

        const nextInStock = !p.inStock;
        const nextQty = nextInStock
          ? (p.stockQuantity > 0 ? p.stockQuantity : 36)
          : 0;

        return normalizeStockValue({
          ...p,
          inStock: nextInStock,
          stockQuantity: nextQty,
        });
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    window.dispatchEvent(new CustomEvent("frd_products_updated"));
  };

  // Automatic Stock Management Helpers
  const decreaseProductStock = (items) => {
    if (!Array.isArray(items) || items.length === 0) return;
    setProducts((prev) => {
      let hasChanges = false;
      const updated = prev.map((p) => {
        const matched = items.find(
          (item) => (item.productId || item.product?.id || item.id) === p.id
        );
        if (!matched) return p;

        const qty = Number(matched.quantity) || 1;
        const currentQty = Number(p.stockQuantity) || 0;
        const newQty = Math.max(0, currentQty - qty);
        hasChanges = true;

        return normalizeStockValue({
          ...p,
          stockQuantity: newQty,
          inStock: newQty > 0,
        });
      });

      if (hasChanges) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setTimeout(() => window.dispatchEvent(new CustomEvent("frd_products_updated")), 0);
      }
      return updated;
    });
  };

  const restoreProductStock = (items) => {
    if (!Array.isArray(items) || items.length === 0) return;
    setProducts((prev) => {
      let hasChanges = false;
      const updated = prev.map((p) => {
        const matched = items.find(
          (item) => (item.productId || item.product?.id || item.id) === p.id
        );
        if (!matched) return p;

        const qty = Number(matched.quantity) || 1;
        const currentQty = Number(p.stockQuantity) || 0;
        const newQty = currentQty + qty;
        hasChanges = true;

        return normalizeStockValue({
          ...p,
          stockQuantity: newQty,
          inStock: newQty > 0,
        });
      });

      if (hasChanges) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setTimeout(() => window.dispatchEvent(new CustomEvent("frd_products_updated")), 0);
      }
      return updated;
    });
  };

  const resetToDefaultData = () => {
    const normalizedDefaults = normalizeProducts(INITIAL_PRODUCTS);
    setProducts(normalizedDefaults);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedDefaults));
    window.dispatchEvent(new CustomEvent("frd_products_updated"));
  };

  // Section-specific independent product lists
  // 1. Latest Collection: Determined strictly by product creation date/time (newest first)
  const latestProducts = [...products].sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  // 2. Just Launched: Explicitly marked by admin or tagged as Just Launched
  const justLaunchedProducts = products.filter(
    (p) => p.isJustLaunched || p.badge === "JUST LAUNCHED" || p.badge === "NEW" || p.isLatest
  );

  // 3. Trending Products: Products marked as trending or best sellers
  const trendingProducts = products.filter(
    (p) => p.isTrending || p.badge === "TRENDING" || p.badge === "BEST SELLER"
  );

  // 4. Popular Supplements: Most popular or top seller products
  const popularProducts = products.filter(
    (p) => p.isPopular || p.isTopSeller || p.badge === "POPULAR"
  );

  // Filtered & Sorted Products
  const filteredProducts = products.filter((product) => {
    const normCategory = selectedCategory.toLowerCase().trim();
    const prodCatRaw = (product.category || "").toLowerCase().trim();
    const prodCatKey = getProductCategoryKey(product).toLowerCase().trim();

    const matchesCategory =
      normCategory === "all categories" ||
      normCategory === "all" ||
      prodCatKey === normCategory ||
      prodCatRaw === normCategory ||
      prodCatRaw.includes(normCategory) ||
      normCategory.includes(prodCatRaw);

    const matchesPrice = product.price <= maxPrice;

    const normTag = selectedTag.toLowerCase().trim();
    let matchesTag = true;
    if (normTag === "just launched") {
      matchesTag = Boolean(product.isJustLaunched || product.badge === "JUST LAUNCHED" || product.badge === "NEW" || product.isLatest);
    } else if (normTag === "trending") {
      matchesTag = Boolean(product.isTrending || product.badge === "TRENDING" || product.badge === "BEST SELLER");
    } else if (normTag === "popular") {
      matchesTag = Boolean(product.isPopular || product.isTopSeller || product.badge === "POPULAR");
    } else if (normTag === "editor's choice") {
      matchesTag = Boolean(product.isEditorsChoice);
    }

    const matchesSearch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesPrice && matchesTag && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
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
        justLaunchedProducts,
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
        decreaseProductStock,
        restoreProductStock,
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

