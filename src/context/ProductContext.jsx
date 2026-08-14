import { createContext, useContext, useEffect, useState } from "react";
import { CATEGORIES, DEFAULT_ADMIN_CATEGORIES, INITIAL_PRODUCTS } from "../data/initialProducts";
import { db } from "../firebase/firebase.config";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";

const ProductContext = createContext();
const STORAGE_KEY = "frd_products_inventory_v7";

export const calculateQuantitySoldMap = (firestoreOrdersList = []) => {
  const soldMap = {};
  const RESTORABLE_STATUSES = ["cancelled", "rejected", "refunded", "returned"];
  try {
    const orderMap = new Map();
    const addOrder = (o) => {
      if (!o || !o.id) return;
      orderMap.set(o.id, o);
    };

    if (Array.isArray(firestoreOrdersList)) {
      firestoreOrdersList.forEach(addOrder);
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.toLowerCase().includes("order")) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key) || "[]");
          if (Array.isArray(parsed)) {
            parsed.forEach(addOrder);
          } else if (parsed && parsed.id) {
            addOrder(parsed);
          }
        } catch {
          // ignore non-JSON
        }
      }
    }

    const allOrders = Array.from(orderMap.values());
    allOrders.forEach((order) => {
      const status = (order.status || "").toLowerCase().trim();
      if (RESTORABLE_STATUSES.some((s) => status.includes(s))) return;

      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const pId = item.productId || item.product?.id || item.id;
          if (!pId) return;
          const qty = Number(item.quantity) || 1;
          soldMap[pId] = (soldMap[pId] || 0) + qty;
        });
      }
    });
  } catch (err) {
    console.error("Error computing quantity sold:", err);
  }
  return soldMap;
};

const normalizeStockValue = (product, index = 0, soldMap = {}) => {
  if (!product) return product;

  const pId = product.id;
  const calculatedSold = soldMap[pId] !== undefined ? soldMap[pId] : (Number(product.quantitySold) || 0);
  const quantitySold = Math.max(0, calculatedSold);

  const nextInStock = product.inStock;

  let rawStockQty = 0;
  if (product.stockQuantity !== undefined && product.stockQuantity !== null && String(product.stockQuantity).trim() !== "") {
    const extracted = String(product.stockQuantity).replace(/[^\d]/g, "");
    if (extracted !== "") rawStockQty = parseInt(extracted, 10);
  }

  let initialStock = Number(product.initialStock);

  if (isNaN(initialStock) || initialStock < 0) {
    initialStock = quantitySold + rawStockQty;
  }

  // If explicitly requested inStock = true, ensure initialStock > quantitySold
  if (nextInStock === true && initialStock <= quantitySold) {
    const defaultAdd = rawStockQty > 0 ? rawStockQty : 1;
    initialStock = quantitySold + defaultAdd;
  }

  // If explicitly requested inStock = false, initialStock = quantitySold so availableStock = 0
  if (nextInStock === false) {
    initialStock = quantitySold;
  }

  const availableStock = Math.max(0, initialStock - quantitySold);
  const finalInStock = nextInStock === false ? false : availableStock > 0;
  const finalStockQty = finalInStock ? availableStock : 0;

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
    createdAt = new Date(1770000000000 - index * 86400000).toISOString();
  }

  return {
    ...product,
    createdAt,
    initialStock,
    quantitySold,
    availableStock,
    inStock: finalInStock,
    stockQuantity: finalStockQty,
  };
};

const normalizeProducts = (productsList) => {
  const soldMap = calculateQuantitySoldMap();
  if (!Array.isArray(productsList)) return INITIAL_PRODUCTS.map((p, idx) => normalizeStockValue(p, idx, soldMap));
  return productsList.map((p, idx) => normalizeStockValue(p, idx, soldMap));
};

export const getProductCategoryKey = (prod) => {
  if (!prod || !prod.category) return "Protein";
  return prod.category.trim();
};

export const TAGS = [
  "All Tags",
  "Popular",
  "Just Launched",
  "Trending",
  "Editor's Choice",
];

const DEMO_PRODUCT_PREFIXES = [
  "frd-hydro-", "frd-pump-", "frd-combo-", "frd-warcore-", "frd-athletic-",
  "frd-carnitine-", "frd-peanut-", "frd-musli-", "frd-oats-", "frd-glucose-"
];

export function ProductProvider({ children }) {
  const loadStoredProducts = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const nonDemo = parsed.filter(
            (p) => p && typeof p.id === "string" && !DEMO_PRODUCT_PREFIXES.some((prefix) => p.id.startsWith(prefix))
          );
          localStorage.setItem(STORAGE_KEY, JSON.stringify(nonDemo));
          return normalizeProducts(nonDemo);
        }
      }
    } catch (error) {
      console.error("Failed to load products from localStorage", error);
    }
    return [];
  };

  const [products, setProducts] = useState(loadStoredProducts);

  const [categoriesList, setCategoriesList] = useState(["All Categories"]);

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
          catNames = parsed.map((c) => c.name).filter(Boolean);
        } else {
          catNames = DEFAULT_ADMIN_CATEGORIES.map((c) => c.name);
          localStorage.setItem("frd_admin_categories_v2", JSON.stringify(DEFAULT_ADMIN_CATEGORIES));
        }
      } else {
        catNames = DEFAULT_ADMIN_CATEGORIES.map((c) => c.name);
        localStorage.setItem("frd_admin_categories_v2", JSON.stringify(DEFAULT_ADMIN_CATEGORIES));
      }

      const seen = new Set();
      const uniqueAdminCats = [];
      catNames.forEach((name) => {
        const trimmed = (name || "").trim();
        const lower = trimmed.toLowerCase();
        if (trimmed && !seen.has(lower)) {
          seen.add(lower);
          uniqueAdminCats.push(trimmed);
        }
      });

      setCategoriesList(["All Categories", ...uniqueAdminCats]);
    } catch {
      setCategoriesList(["All Categories", ...DEFAULT_ADMIN_CATEGORIES.map((c) => c.name)]);
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

  // Real-time Firebase Firestore Sync for Products
  useEffect(() => {
    try {
      const colRef = collection(db, "products");
      const unsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          if (snapshot.empty) {
            // Upload initial default products to Firebase Firestore database
            const normalized = normalizeProducts(INITIAL_PRODUCTS);
            setProducts(normalized);
            normalized.forEach((p) => {
              if (p.id) {
                setDoc(doc(db, "products", p.id), p).catch(() => { });
              }
            });
          } else {
            const fbProducts = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            }));
            const normalized = normalizeProducts(fbProducts);
            setProducts(normalized);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
          }
        },
        (err) => {
          console.warn("Firebase products listener notice:", err?.message || err);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn("Firebase products sync setup error:", e);
    }
  }, []);

  // Real-time Firebase Firestore Sync for Categories
  useEffect(() => {
    try {
      const colRef = collection(db, "categories");
      const unsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const fbCats = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            }));
            localStorage.setItem("frd_admin_categories_v2", JSON.stringify(fbCats));
            const seen = new Set();
            const names = [];
            fbCats.forEach((c) => {
              const name = (c.name || "").trim();
              const lower = name.toLowerCase();
              if (name && !seen.has(lower)) {
                seen.add(lower);
                names.push(name);
              }
            });
            if (names.length > 0) {
              setCategoriesList(["All Categories", ...names]);
            }
          }
        },
        (err) => {
          console.warn("Firebase categories listener notice:", err?.message || err);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn("Firebase categories sync setup error:", e);
    }
  }, []);

  // Real-time Firebase Firestore Sync for Orders -> updates Quantity Sold & Available Stock
  useEffect(() => {
    let unsubscribeOrders = () => {};
    try {
      unsubscribeOrders = onSnapshot(
        collection(db, "orders"),
        (snapshot) => {
          const fbOrders = [];
          snapshot.forEach((docSnap) => {
            fbOrders.push({ id: docSnap.id, ...docSnap.data() });
          });
          const soldMap = calculateQuantitySoldMap(fbOrders);
          setProducts((prevProducts) => {
            if (!Array.isArray(prevProducts) || prevProducts.length === 0) return prevProducts;
            return prevProducts.map((p, idx) => normalizeStockValue(p, idx, soldMap));
          });
        },
        (err) => {
          console.warn("Firestore orders soldMap sync warning:", err);
        }
      );
    } catch (e) {}

    return () => {
      if (typeof unsubscribeOrders === "function") unsubscribeOrders();
    };
  }, []);

  // Admin CRUD Functions
  const addProduct = async (newProduct) => {
    const imagesArray = Array.isArray(newProduct.images) && newProduct.images.length > 0
      ? newProduct.images
      : newProduct.image
        ? [newProduct.image]
        : [];

    const videosArray = Array.isArray(newProduct.videos) ? newProduct.videos : [];

    const createdProduct = normalizeStockValue({
      ...newProduct,
      id: newProduct.id || `frd-custom-${Date.now()}`,
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

    try {
      await setDoc(doc(db, "products", createdProduct.id), createdProduct);
    } catch (err) {
      console.error("Firebase store product sync error:", err);
    }
  };

  const updateProduct = async (updatedProduct) => {
    const imagesArray = Array.isArray(updatedProduct.images) && updatedProduct.images.length > 0
      ? updatedProduct.images
      : updatedProduct.image
        ? [updatedProduct.image]
        : [];

    const videosArray = Array.isArray(updatedProduct.videos) ? updatedProduct.videos : [];

    let targetProduct = null;

    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== updatedProduct.id) return p;

        targetProduct = normalizeStockValue({
          ...p,
          ...updatedProduct,
          image: imagesArray[0] || updatedProduct.image || p.image,
          images: imagesArray.length > 0 ? imagesArray : p.images,
          videos: videosArray,
        });
        return targetProduct;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    window.dispatchEvent(new CustomEvent("frd_products_updated"));

    if (targetProduct) {
      try {
        await setDoc(doc(db, "products", targetProduct.id), targetProduct);
      } catch (err) {
        console.error("Firebase update product sync error:", err);
      }
    }
  };

  const deleteProduct = async (id) => {
    const targetId = String(id);
    setProducts((prev) => {
      const updated = prev.filter((p) => String(p.id) !== targetId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    window.dispatchEvent(new CustomEvent("frd_products_updated"));

    try {
      await deleteDoc(doc(db, "products", targetId));
    } catch (err) {
      console.error("Firebase delete product sync error:", err);
    }
  };

  const clearAllProducts = async () => {
    const toDelete = [...products];
    setProducts([]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent("frd_products_updated"));

    try {
      for (const p of toDelete) {
        if (p && p.id) {
          await deleteDoc(doc(db, "products", String(p.id)));
        }
      }
    } catch (err) {
      console.error("Firebase clear all products sync error:", err);
    }
  };

  const toggleStockStatus = (id) => {
    setProducts((prev) => {
      const soldMap = calculateQuantitySoldMap();
      const updated = prev.map((p) => {
        if (p.id !== id) return p;

        const nextInStock = !p.inStock;
        const currentSold = soldMap[id] !== undefined ? soldMap[id] : (Number(p.quantitySold) || 0);

        let nextInitialStock;
        let nextQty;

        if (nextInStock) {
          nextQty = Number(p.stockQuantity) > 0 ? Number(p.stockQuantity) : 50;
          nextInitialStock = currentSold + nextQty;
        } else {
          nextQty = 0;
          nextInitialStock = currentSold;
        }

        return normalizeStockValue(
          {
            ...p,
            inStock: nextInStock,
            initialStock: nextInitialStock,
            stockQuantity: nextQty,
          },
          0,
          soldMap
        );
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

  const updateInitialStock = (productId, newInitialStock) => {
    const nextInitial = Math.max(0, parseInt(newInitialStock, 10) || 0);
    setProducts((prev) => {
      const soldMap = calculateQuantitySoldMap();
      const updated = prev.map((p) => {
        if (p.id !== productId) return p;
        const currentSold = soldMap[productId] !== undefined ? soldMap[productId] : (Number(p.quantitySold) || 0);
        const shouldBeInStock = nextInitial > currentSold;
        return normalizeStockValue(
          {
            ...p,
            initialStock: nextInitial,
            inStock: shouldBeInStock,
          },
          0,
          soldMap
        );
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    window.dispatchEvent(new CustomEvent("frd_products_updated"));
  };

  const resetToDefaultData = () => {
    const normalizedDefaults = normalizeProducts(INITIAL_PRODUCTS);
    setProducts(normalizedDefaults);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedDefaults));
    window.dispatchEvent(new CustomEvent("frd_products_updated"));
  };

  // Guarantee safe product list
  const safeProducts = Array.isArray(products) ? products : [];

  // Section-specific independent product lists
  // 1. Latest Collection: Determined strictly by product creation date/time (newest first)
  const latestProducts = [...safeProducts].sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  // 2. Just Launched: Explicitly marked by admin or tagged as Just Launched
  const justLaunchedFiltered = safeProducts.filter(
    (p) => p.isJustLaunched || p.badge === "JUST LAUNCHED" || p.badge === "NEW" || p.isLatest
  );
  const justLaunchedProducts = safeProducts.length > 0 ? (justLaunchedFiltered.length > 0 ? justLaunchedFiltered : safeProducts) : [];

  // 3. Trending Products: Products marked as trending or best sellers
  const trendingFiltered = safeProducts.filter(
    (p) => p.isTrending || p.badge === "TRENDING" || p.badge === "BEST SELLER"
  );
  const trendingProducts = safeProducts.length > 0 ? (trendingFiltered.length > 0 ? trendingFiltered : safeProducts) : [];

  // 4. Popular Supplements: Most popular or top seller products
  const popularFiltered = safeProducts.filter(
    (p) => p.isPopular || p.isTopSeller || p.badge === "POPULAR"
  );
  const popularProducts = safeProducts.length > 0 ? (popularFiltered.length > 0 ? popularFiltered : safeProducts) : [];

  // Filtered & Sorted Products
  const filteredProducts = safeProducts.filter((product) => {
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
        clearAllProducts,
        toggleStockStatus,
        updateInitialStock,
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

