import { motion } from "framer-motion";
import { useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import oipLogo from "../../assets/OIP2-removebg-preview.png";
import { useUserAuth } from "../../context/UserAuthContext";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebase/firebase.config";

export default function UserLoginPage() {
  const { loginUser, user } = useUserAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/user/dashboard");
    }
  }, [user, navigate]);

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
      // Immediately sign out from Firebase Auth so Google OAuth account is stored as customer only
      try {
        await auth.signOut();
      } catch (e) { }
      navigate("/user/dashboard");
    } catch (err) {
      console.error("Google login error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        toast.error(err.message || "Google sign-in failed. Please try again.");
      }
    }
  };

  return (
    <div className="bg-[#090d16] text-white min-h-[calc(100vh-80px)] flex items-center justify-center p-4 sm:p-6 py-10 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-auto"
      >
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <img
            src={oipLogo}
            alt="HR Sports & Nutrition Official Logo"
            className="h-20 sm:h-24 w-auto object-contain mx-auto mb-2 filter drop-shadow-[0_0_18px_rgba(245,184,0,0.4)]"
          />
          <span className="text-[#f5b800] text-xs font-black uppercase tracking-widest block">
            HR SPORTS & NUTRITION OFFICIAL STORE
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
            User Access
          </h1>
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
      </motion.div>
    </div>
  );
}
