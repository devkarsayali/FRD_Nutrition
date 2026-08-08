import { useEffect, useState } from "react";
import {
  FiBox,
  FiCalendar,
  FiChevronDown,
  FiGrid,
  FiHome,
  FiLock,
  FiLogOut,
  FiMenu,
  FiMessageSquare,
  FiSettings,
  FiShoppingBag,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import OIPLogo from "../../assets/OIP.png";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useCart } from "../../context/CartContext";

export default function AdminLayout() {
  const { isAdminLoggedIn, logoutAdmin, adminEmail, changeAdminPassword } = useAdminAuth();
  const { orders: cartContextOrders } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  // GLOBAL SEARCH STATE FOR TOPBAR
  const [searchQuery, setSearchQuery] = useState("");

  // Change Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (isPasswordModalOpen || isSidebarOpen) {
      document.documentElement.classList.add("no-scroll");
      document.body.classList.add("no-scroll");
      document.getElementById("root")?.classList.add("no-scroll");
    } else {
      document.documentElement.classList.remove("no-scroll");
      document.body.classList.remove("no-scroll");
      document.getElementById("root")?.classList.remove("no-scroll");
    }
    return () => {
      document.documentElement.classList.remove("no-scroll");
      document.body.classList.remove("no-scroll");
      document.getElementById("root")?.classList.remove("no-scroll");
    };
  }, [isPasswordModalOpen, isSidebarOpen]);

  // Load unread contact messages count for sidebar badge
  const loadUnreadMessagesCount = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("frd_contact_messages") || "[]");
      const unread = saved.filter((m) => m.status === "unread");
      setUnreadMessagesCount(unread.length);
    } catch {
      setUnreadMessagesCount(0);
    }
  };

  useEffect(() => {
    loadUnreadMessagesCount();
    window.addEventListener("frd_contact_messages_updated", loadUnreadMessagesCount);
    window.addEventListener("storage", loadUnreadMessagesCount);
    return () => {
      window.removeEventListener("frd_contact_messages_updated", loadUnreadMessagesCount);
      window.removeEventListener("storage", loadUnreadMessagesCount);
    };
  }, [location.pathname]);

  // Lock body scroll on mobile when sidebar drawer is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  // Load unread customer orders count for sidebar badge
  const loadUnreadOrdersCount = () => {
    try {
      const orderMap = new Map();
      const addOrder = (o) => {
        if (!o || !o.id) return;
        orderMap.set(o.id, o);
      };

      if (Array.isArray(cartContextOrders)) {
        cartContextOrders.forEach(addOrder);
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
            // ignore non-json
          }
        }
      }

      const rawOrders = Array.from(orderMap.values());
      const unreadOrders = rawOrders.filter((o) => o.readStatus === "unread");

      setNewOrdersCount(unreadOrders.length);
    } catch {
      setNewOrdersCount(0);
    }
  };

  useEffect(() => {
    loadUnreadOrdersCount();
    window.addEventListener("frd_orders_updated", loadUnreadOrdersCount);
    window.addEventListener("storage", loadUnreadOrdersCount);
    return () => {
      window.removeEventListener("frd_orders_updated", loadUnreadOrdersCount);
      window.removeEventListener("storage", loadUnreadOrdersCount);
    };
  }, [cartContextOrders, location.pathname]);

  if (!isAdminLoggedIn) {
    return <Navigate to="/admin/login" replace />;
  }

  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // SEPARATE SIDEBAR NAVIGATION LINKS IN OPTIMAL WORKFLOW SEQUENCE
  const adminNav = [
    { name: "Dashboard", path: "/admin", icon: FiGrid },
    { name: "Categories", path: "/admin/categories", icon: FiGrid },
    { name: "Supplements", path: "/admin/products", icon: FiBox },
    { name: "Customer Orders", path: "/admin/orders", icon: FiShoppingBag },
    { name: "Customers", path: "/admin/customers", icon: FiUsers },
    { name: "Contact Messages", path: "/admin/messages", icon: FiMessageSquare },
  ];

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }
    const success = changeAdminPassword(
      passwordForm.currentPassword,
      passwordForm.newPassword
    );
    if (success) {
      setIsPasswordModalOpen(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }
  };

  return (
    <div className="min-h-screen bg-[#0d100c] text-white flex flex-col font-sans">
      {/* TOP HEADER BAR WITH GLOBAL SEARCH BAR */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 sm:h-20 bg-[#121611]/95 backdrop-blur-xl border-b border-neutral-800 px-4 sm:px-8 flex items-center justify-between shadow-2xl gap-3 sm:gap-6">
        {/* Left: FRD Logo */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-neutral-400 hover:text-white md:hidden rounded-xl hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {isSidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>

          <Link to="/admin" className="flex items-center gap-3 sm:gap-5 group shrink-0">
            <img
              src={OIPLogo}
              alt="FRD Nutrition Official Logo"
              className="h-10 sm:h-14 max-h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_0_18px_rgba(132,204,22,0.4)]"
            />
            <span className="text-[11px] font-black tracking-widest text-lime-400 bg-lime-500/10 px-3 py-1 rounded-xl border border-lime-500/30 uppercase hidden sm:inline-block shadow-sm">
              ADMIN PORTAL
            </span>
          </Link>
        </div>

        {/* Right Topbar Actions */}
        <div className="flex items-center gap-2 sm:gap-4 py-1 shrink-0">
          {/* Date Section */}
          <div className="hidden lg:flex items-center gap-2.5 bg-neutral-900/90 border border-neutral-800 px-3.5 py-2 rounded-2xl text-xs font-bold text-neutral-300 shrink-0 shadow-sm">
            <FiCalendar className="text-lime-400" size={15} />
            <span>{currentDate}</span>
          </div>

          {/* Public Storefront Link */}
          <Link
            to="/"
            className="px-3 sm:px-4 py-2 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-300 hover:text-white hover:border-lime-500/50 flex items-center justify-center gap-2 transition shrink-0 whitespace-nowrap shadow-sm hover:scale-105"
          >
            <FiHome size={16} />
            <span className="hidden sm:inline">Storefront</span>
          </Link>

          {/* Topbar Settings Icon Button */}
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="p-2 sm:p-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-lime-400 hover:border-lime-500/50 transition cursor-pointer flex items-center justify-center shrink-0 shadow-sm hover:scale-105"
            title="Admin Profile & Password Settings"
            aria-label="Admin Settings"
          >
            <FiSettings size={18} />
          </button>

          {/* LOGGED IN ADMIN BOX */}
          {adminEmail && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowAdminMenu(!showAdminMenu);
                }}
                className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-lime-500/50 rounded-2xl text-left flex items-center gap-2 sm:gap-3 transition cursor-pointer shadow-sm hover:scale-105"
                title="Click to view Settings & Logout options"
              >
                <div>
                  <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-neutral-400 font-bold block leading-tight">
                    Admin
                  </span>
                  <span className="text-[11px] sm:text-xs font-black text-lime-400 block truncate max-w-[80px] sm:max-w-[140px]">
                    {adminEmail}
                  </span>
                </div>
                <FiChevronDown size={16} className="text-neutral-400" />
              </button>

              {/* DROPDOWN MENU */}
              {showAdminMenu && (
                <div className="absolute right-0 mt-2 w-48 sm:w-52 bg-[#141813] border border-neutral-800 rounded-2xl shadow-2xl py-2 z-50 text-xs animate-in fade-in zoom-in duration-150">
                  <div className="px-4 py-2 border-b border-neutral-800">
                    <span className="text-[9px] text-neutral-400 font-bold uppercase block">
                      Admin Account
                    </span>
                    <span className="font-bold text-white truncate block">
                      {adminEmail}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setShowAdminMenu(false);
                      logoutAdmin();
                    }}
                    className="w-full px-4 py-2.5 hover:bg-red-500/10 text-red-400 font-bold flex items-center gap-2.5 transition cursor-pointer text-left"
                  >
                    <FiLogOut size={15} />
                    <span>Logout Admin</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* MAIN BODY AREA WITH FIXED LEFT SIDEBAR + MAIN CONTENT */}
      <div className="flex-1 flex relative pt-16 sm:pt-20">
        {/* Mobile Slide-Over Backdrop */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar Drawer */}
        <aside
          className={`fixed top-16 sm:top-20 left-0 bottom-0 z-50 md:z-40 h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] w-64 bg-[#121611] border-r border-neutral-800 p-6 flex flex-col justify-between overflow-y-auto no-scrollbar shadow-2xl transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            }`}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between md:block">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-500 block">
                Menu Navigation
              </span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden text-neutral-400 hover:text-white p-1"
              >
                <FiX size={20} />
              </button>
            </div>

            <nav className="space-y-2">
              {adminNav.map((item) => {
                const Icon = item.icon;
                const isCurrentActive =
                  location.pathname === item.path ||
                  (item.path === "/admin/orders" && location.pathname.includes("/admin/orders")) ||
                  (item.path === "/admin/messages" && location.pathname.includes("/admin/messages"));

                let badgeCount = 0;
                if (item.name === "Customer Orders") {
                  badgeCount = newOrdersCount;
                } else if (item.name === "Contact Messages") {
                  badgeCount = unreadMessagesCount;
                }

                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    end={item.path === "/admin"}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl font-semibold text-xs transition ${isCurrentActive
                        ? "bg-lime-500 text-neutral-950 shadow-md shadow-lime-500/20 font-bold"
                        : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} />
                      <span>{item.name}</span>
                    </div>

                    {badgeCount > 0 && (
                      <span
                        className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center border border-[#121611] ${isCurrentActive
                            ? "bg-neutral-950 text-white"
                            : "bg-red-500 text-white"
                          }`}
                      >
                        {badgeCount}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Admin Content View */}
        <main className="flex-1 p-4 sm:p-6 md:p-10 max-w-7xl min-w-0 w-full md:ml-64">
          <Outlet context={{ isAddModalOpen, setIsAddModalOpen, searchQuery, setSearchQuery }} />
        </main>
      </div>

      {/* CHANGE ADMIN PASSWORD / SETTINGS MODAL */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#141813] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-lime-500/20 text-lime-400 font-bold flex items-center justify-center border border-lime-500/30">
                  <FiLock size={18} />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-white">
                    Admin Settings
                  </h3>
                  <span className="text-xs text-neutral-400 block">
                    Change Administrator Password
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-bold mb-1">
                  Current Admin Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter current password (default: admin123)"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-lime-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-bold mb-1">
                  New Admin Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password (min 4 chars)"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-lime-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-bold mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-lime-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-300 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-lime-500 text-neutral-950 font-bold hover:bg-lime-400 transition cursor-pointer text-xs shadow-md shadow-lime-500/20"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
