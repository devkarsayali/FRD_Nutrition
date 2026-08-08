import { useEffect, useRef, useState } from "react";
import {
  FiChevronDown,
  FiHeart,
  FiLogOut,
  FiMenu,
  FiPackage,
  FiShoppingCart,
  FiUser,
  FiX,
} from "react-icons/fi";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useUserAuth } from "../../context/UserAuthContext";
import oipLogo from "../../assets/OIP.png";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { user, logoutUser } = useUserAuth();
  const { cartCount, wishlist, orders, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  const navLinks = [
    { name: "HOME", path: "/" },
    { name: "SUPPLEMENTS", path: "/supplements" },
    { name: "ABOUT", path: "/about" },
    { name: "CONTACT", path: "/contact" },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Lock background scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
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
  }, [isMobileMenuOpen]);

  const handleProfileClick = () => {
    if (user) {
      setIsProfileDropdownOpen((prev) => !prev);
    } else {
      navigate("/user/login");
    }
  };

  const handleDropdownNavigate = (path) => {
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
    logoutUser();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-[#070a12]/95 backdrop-blur-2xl border-b border-slate-800/90 text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
      <div className="container-custom h-20 flex items-center justify-between">
        {/* FRD Official Brand Emblem Logo Image */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <img
            src={oipLogo}
            alt="FRD Nutrition Official Logo"
            className="h-14 sm:h-16 md:h-18 max-h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_0_20px_rgba(245,184,0,0.4)]"
          />
        </Link>

        {/* Center Floating Glassmorphism Nav Links */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-full border border-slate-800 shadow-inner">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `px-6 py-2 rounded-full font-black text-xs tracking-wider transition-all duration-300 ${isActive
                  ? "bg-gradient-to-r from-[#f5b800] to-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 scale-105"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </nav>

        {/* Right Header Action Controls */}
        <div className="flex items-center gap-3">
          {/* Wishlist Button */}
          <Link
            to="/supplements"
            className="relative p-2.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-[#f5b800] hover:border-amber-500/50 transition hidden sm:flex items-center justify-center shadow-sm"
            title="Wishlist"
          >
            <FiHeart size={18} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center shadow-md">
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* User Profile Button with Dropdown Container */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleProfileClick}
              className={`p-2.5 rounded-full bg-slate-900 border text-slate-300 hover:text-[#f5b800] transition flex items-center justify-center shadow-sm cursor-pointer ${user
                  ? "border-amber-500/50 text-[#f5b800] bg-amber-500/10 hover:border-amber-400"
                  : "border-slate-800 hover:border-amber-500/50"
                }`}
              title={user ? `Logged in as ${user.name || user.email}` : "User Log In / Sign Up"}
            >
              <FiUser size={18} />
            </button>

            {/* Profile Dropdown Menu */}
            {user && isProfileDropdownOpen && (
              <div className="absolute right-0 mt-3 w-60 sm:w-64 max-w-[calc(100vw-1.5rem)] bg-[#0f172a]/95 backdrop-blur-2xl border border-slate-800 rounded-3xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 animate-in fade-in zoom-in-95 duration-200">
                {/* User Identity Header */}
                <div className="px-3.5 py-2.5 mb-2 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#f5b800] to-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md shrink-0">
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden text-left">
                    <h4 className="text-xs font-bold text-white truncate">{user.name || "FRD Athlete"}</h4>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  {/* 1. Account Details */}
                  <button
                    type="button"
                    onClick={() => handleDropdownNavigate("/user/dashboard?tab=profile")}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between text-slate-200 hover:bg-slate-800/80 hover:text-[#f5b800] transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <FiUser size={16} className="text-[#f5b800]" />
                      <span>Account Details</span>
                    </div>
                  </button>

                  {/* 2. Saved Wishlist */}
                  <button
                    type="button"
                    onClick={() => handleDropdownNavigate("/user/dashboard?tab=wishlist")}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between text-slate-200 hover:bg-slate-800/80 hover:text-[#f5b800] transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <FiHeart size={16} className="text-[#f5b800]" />
                      <span>Saved Wishlist</span>
                    </div>
                    {wishlist.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-[#f5b800] border border-amber-500/30">
                        {wishlist.length}
                      </span>
                    )}
                  </button>

                  {/* 3. My Orders */}
                  <button
                    type="button"
                    onClick={() => handleDropdownNavigate("/user/dashboard?tab=orders")}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between text-slate-200 hover:bg-slate-800/80 hover:text-[#f5b800] transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <FiPackage size={16} className="text-[#f5b800]" />
                      <span>My Orders</span>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-800/80" />

                  {/* 4. Log Out */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2.5 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition cursor-pointer"
                  >
                    <FiLogOut size={16} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Shopping Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="p-2.5 rounded-full bg-gradient-to-r from-[#f5b800] to-amber-500 text-slate-950 font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform duration-300 cursor-pointer"
            title="Open Shopping Cart"
          >
            <FiShoppingCart size={18} />
            <span className="text-xs font-black px-1.5 py-0.5 rounded-full bg-slate-950 text-[#f5b800]">
              {cartCount}
            </span>
          </button>

          {/* Mobile Navigation Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white md:hidden cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0a0f1d] border-b border-slate-800 px-6 py-6 space-y-4 animate-in slide-in-from-top duration-300">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-2xl font-black text-xs tracking-wider transition-all ${isActive
                    ? "bg-gradient-to-r from-[#f5b800] to-amber-500 text-slate-950"
                    : "text-slate-300 hover:bg-slate-900"
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}

            {user && (
              <div className="pt-3 mt-3 border-t border-slate-800/80 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest px-4 block">
                  ACCOUNT
                </span>
                <button
                  type="button"
                  onClick={() => handleDropdownNavigate("/user/dashboard?tab=profile")}
                  className="w-full text-left px-4 py-3 rounded-2xl font-bold text-xs text-slate-200 hover:bg-slate-900 flex items-center gap-2.5"
                >
                  <FiUser size={16} className="text-[#f5b800]" />
                  <span>Account Details</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDropdownNavigate("/user/dashboard?tab=wishlist")}
                  className="w-full text-left px-4 py-3 rounded-2xl font-bold text-xs text-slate-200 hover:bg-slate-900 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <FiHeart size={16} className="text-[#f5b800]" />
                    <span>Saved Wishlist</span>
                  </div>
                  {wishlist.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-[#f5b800]">
                      {wishlist.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDropdownNavigate("/user/dashboard?tab=orders")}
                  className="w-full text-left px-4 py-3 rounded-2xl font-bold text-xs text-slate-200 hover:bg-slate-900 flex items-center gap-2.5"
                >
                  <FiPackage size={16} className="text-[#f5b800]" />
                  <span>My Orders</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 rounded-2xl font-bold text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5"
                >
                  <FiLogOut size={16} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}