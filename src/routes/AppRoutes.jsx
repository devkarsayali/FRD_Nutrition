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

import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminLoginPage from "../pages/admin/AdminLoginPage";
import AdminOrdersPage from "../pages/admin/AdminOrdersPage";
import AdminProductsPage from "../pages/admin/AdminProductsPage";
import AdminCategoriesPage from "../pages/admin/AdminCategoriesPage";
import AdminCustomersPage from "../pages/admin/AdminCustomersPage";

import PrivacyPolicyPage from "../pages/policies/PrivacyPolicyPage";
import ReturnsPolicyPage from "../pages/policies/ReturnsPolicyPage";
import ShippingPolicyPage from "../pages/policies/ShippingPolicyPage";
import TermsPolicyPage from "../pages/policies/TermsPolicyPage";

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
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Admin Management Panel Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardWrapper />} />
        <Route path="dashboard" element={<AdminDashboardWrapper />} />
        <Route path="products" element={<AdminProductsWrapper />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="orders" element={<AdminOrdersPage defaultTab="orders" />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="messages" element={<AdminOrdersPage defaultTab="messages" />} />
      </Route>

      {/* Catch-all 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}