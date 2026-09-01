import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
import { FiCheckCircle, FiUser, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import oipLogo from "../../assets/OIP2-removebg-preview.png";
import { useUserAuth } from "../../context/UserAuthContext";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebase/firebase.config";

export default function AuthModal({ isOpen: customIsOpen, onClose: customOnClose }) {
  const { isAuthOpen, setIsAuthOpen, loginUser, logoutUser, user: contextUser } = useUserAuth();

  const isOpen = customIsOpen !== undefined ? customIsOpen : isAuthOpen;
  const handleClose = customOnClose || (() => setIsAuthOpen(false));

  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen]);

  const activeUser = contextUser;
  const isLoggedIn = Boolean(contextUser);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account",
    });
    try {
      const result = await signInWithPopup(auth, provider);
      const googleUser = {
        id: result.user.uid,
        name: result.user.displayName || (result.user.email ? result.user.email.split("@")[0] : "Customer"),
        email: result.user.email,
        photoURL: result.user.photoURL || "",
      };
      await loginUser(googleUser);
      handleClose();
    } catch (err) {
      console.error("Google login error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        toast.error(err.message || "Google sign-in failed. Please try again.");
      }
    }
  };

  const handleLogoutAction = () => {
    logoutUser();
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-100 my-auto max-h-[90vh] overflow-y-auto"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
            aria-label="Close modal"
          >
            <FiX size={18} />
          </button>

          {/* Logged In View */}
          {isLoggedIn && activeUser ? (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-[#f5b800] flex items-center justify-center mx-auto shadow-inner overflow-hidden">
                {activeUser.photoURL ? (
                  <img src={activeUser.photoURL} alt={activeUser.name} className="w-full h-full object-cover" />
                ) : (
                  <FiUser size={32} />
                )}
              </div>
              <div className="space-y-1">
                <span className="text-xs text-[#f5b800] font-black uppercase tracking-widest block">
                  AUTHENTICATED ATHLETE
                </span>
                <h3 className="font-heading text-2xl font-bold text-white">
                  {activeUser.name}
                </h3>
                <p className="text-xs text-slate-400">{activeUser.email}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-[#f5b800]" size={16} />
                  <span>FRD Premium VIP Member</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-[#f5b800]" size={16} />
                  <span>Free Express Shipping Eligible</span>
                </div>
              </div>

              <button
                onClick={handleLogoutAction}
                className="w-full py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold hover:bg-slate-800 transition text-xs shadow-md cursor-pointer"
              >
                Log Out
              </button>
            </div>
          ) : (
            <>
              {/* Modal Header Branding */}
              <div className="text-center space-y-2">
                <img
                  src={oipLogo}
                  alt="FRD Nutrition Official Logo"
                  className="h-20 sm:h-24 w-auto object-contain mx-auto mb-2 filter drop-shadow-[0_0_18px_rgba(245,184,0,0.4)]"
                />
                <span className="text-[#f5b800] text-xs font-black uppercase tracking-widest block">
                  FRD NUTRITION OFFICIAL STORE
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
                  User Access
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Sign in with your Google account for instant 1-click access to your profile, orders, and exclusive rewards.
                </p>
              </div>

              {/* Google Login Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-bold hover:bg-slate-800 hover:border-slate-700 transition flex items-center justify-center gap-2.5 text-xs cursor-pointer shadow-sm"
              >
                <FcGoogle size={20} />
                <span>Continue with Google</span>
              </button>

              {/* Bullet Points */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2.5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-[#f5b800] font-bold">✓</span>
                  <span>100% Secure &amp; Verified Authentication</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#f5b800] font-bold">✓</span>
                  <span>Track your orders &amp; delivery updates live</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#f5b800] font-bold">✓</span>
                  <span>Fast checkout with saved shipping address</span>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
