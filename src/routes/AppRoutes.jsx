import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useOutletContext } from "react-router-dom";
import AdminLayout from "../components/layout/AdminLayout";
import MainLayout from "../components/layout/MainLayout";
import AboutPage from "../pages/AboutPage";
import ContactPage from "../pages/ContactPage";
import HomePage from "../pages/HomePage";
import NotFoundPage from "../pages/NotFoundPage";
import ProductDetailsPage from "../pages/ProductDetailsPage";
import SupplementsPage from "../pages/SupplementsPage";
import UserDashboardPage from "../pages/user/UserDashboardPage";
import UserLoginPage from "../pages/user/UserLoginPage";

import PrivacyPolicyPage from "../pages/policies/PrivacyPolicyPage";
import ReturnsPolicyPage from "../pages/policies/ReturnsPolicyPage";
import ShippingPolicyPage from "../pages/policies/ShippingPolicyPage";
import TermsPolicyPage from "../pages/policies/TermsPolicyPage";

// Code-split Admin Pages so customer storefront bundle stays tiny & loads instantly
const AdminDashboardPage = lazy(() => import("../pages/admin/AdminDashboardPage"));
const AdminLoginPage = lazy(() => import("../pages/admin/AdminLoginPage"));
const AdminOrdersPage = lazy(() => import("../pages/admin/AdminOrdersPage"));
const AdminProductsPage = lazy(() => import("../pages/admin/AdminProductsPage"));
const AdminCategoriesPage = lazy(() => import("../pages/admin/AdminCategoriesPage"));
const AdminCustomersPage = lazy(() => import("../pages/admin/AdminCustomersPage"));
const AdminSalesPage = lazy(() => import("../pages/admin/AdminSalesPage"));
const AdminBannersPage = lazy(() => import("../pages/admin/AdminBannersPage"));

const AdminLoadingFallback = () => (
  <div className="min-h-screen bg-[#0d120c] flex items-center justify-center text-lime-400 text-xs font-mono">
    Loading Admin Panel...
  </div>
);

function AdminDashboardWrapper() {
  const { setIsAddModalOpen } = useOutletContext();
  return <AdminDashboardPage onOpenAddModal={() => setIsAddModalOpen(true)} />;
}

function AdminProductsWrapper() {
  const { isAddModalOpen, setIsAddModalOpen } = useOutletContext();
  return (
    <AdminProductsPage
      isAddModalOpen={isAddModalOpen}
      setIsAddModalOpen={setIsAddModalOpen}
    />
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<AdminLoadingFallback />}>
      <Routes>
        {/* Customer Storefront Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/supplements" element={<SupplementsPage />} />
          <Route path="/supplements/:productId" element={<ProductDetailsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/user/login" element={<UserLoginPage />} />
          <Route path="/user/dashboard" element={<UserDashboardPage />} />

          {/* Store Policy Routes */}
          <Route path="/shipping-info" element={<ShippingPolicyPage />} />
          <Route path="/shipping_info" element={<ShippingPolicyPage />} />
          <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
          <Route path="/shipping_policy" element={<ShippingPolicyPage />} />

          <Route path="/returns-policy" element={<ReturnsPolicyPage />} />
          <Route path="/returns_policy" element={<ReturnsPolicyPage />} />

          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/privacy_policy" element={<PrivacyPolicyPage />} />

          <Route path="/terms-conditions" element={<TermsPolicyPage />} />
          <Route path="/terms_conditions" element={<TermsPolicyPage />} />
        </Route>

        {/* Admin Login Route */}
        <Route path="/login" element={<AdminLoginPage />} />
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />

        {/* Admin Management Panel Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardWrapper />} />
          <Route path="dashboard" element={<AdminDashboardWrapper />} />
          <Route path="sales" element={<AdminSalesPage />} />
          <Route path="products" element={<AdminProductsWrapper />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="banners" element={<AdminBannersPage />} />
          <Route path="orders" element={<AdminOrdersPage defaultTab="orders" />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="messages" element={<AdminOrdersPage defaultTab="messages" />} />
        </Route>

        {/* Catch-all 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}