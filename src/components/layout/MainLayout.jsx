import { Outlet, useLocation } from "react-router-dom";
import CartDrawer from "../cart/CartDrawer";
import CheckoutModal from "../cart/CheckoutModal";
import ScrollToTop from "../common/ScrollToTop";
import Footer from "./Footer";
import Navbar from "./Navbar";

export default function MainLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/user/login";

  return (
    <div className="flex flex-col min-h-screen bg-[#10130f]">
      <Navbar />

      <main className="flex-grow">
        <Outlet />
      </main>

      {!isLoginPage && <Footer />}

      {/* Global Interactive Drawer, Modals & Scroll Button */}
      <CartDrawer />
      <CheckoutModal />
      <ScrollToTop />
    </div>
  );
}