import { useEffect, useState } from "react";
import { FiArrowRight, FiCheckCircle, FiEye, FiEyeOff, FiLock, FiMail, FiShield, FiX } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import oipLogo from "../../assets/OIP2-removebg-preview.png";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { isValidEmail } from "../../utils/validation";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase/firebase.config";

export default function AdminLoginPage() {
  const { loginAdmin, isAdminLoggedIn } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetSent, setIsResetSent] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdminLoggedIn) {
      navigate("/admin");
    }
  }, [isAdminLoggedIn, navigate]);

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    const success = await loginAdmin(email, password);
    setSubmitting(false);
    if (success) {
      navigate("/admin");
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    const targetEmail = resetEmail.trim();
    if (!isValidEmail(targetEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      setIsResetSent(true);
      toast.success(`Password reset email sent to ${targetEmail}! Check your inbox.`);
    } catch (err) {
      console.error("Firebase reset email error:", err);
      toast.error(err.code === "auth/user-not-found" ? "No admin account found with this email." : err.message || "Failed to send reset link.");
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="bg-[#0e110d] min-h-screen text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#141813] border border-neutral-800 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-lime-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center space-y-2">
          <img
            src={oipLogo}
            alt="FRD Nutrition Official Logo"
            className="h-20 sm:h-24 w-auto object-contain mx-auto mb-2 filter drop-shadow-[0_0_18px_rgba(132,204,22,0.4)]"
          />
          <h1 className="font-heading text-2xl font-black">ADMIN PORTAL LOGIN</h1>
          <p className="text-xs text-neutral-400">
            FRD Nutrition Supplement Management System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
              Admin Email
            </label>
            <div className="relative">
              <FiMail className="absolute left-4 top-3.5 text-neutral-500" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-lime-500 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Admin Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setIsResetSent(false);
                  setIsForgotModalOpen(true);
                }}
                className="text-[11px] text-lime-400 hover:text-lime-300 font-semibold hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <FiLock className="absolute left-4 top-3.5 text-neutral-500" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-12 pr-12 py-3 text-sm text-white focus:outline-none focus:border-lime-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-neutral-500 hover:text-white transition cursor-pointer"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-lime-500 text-neutral-950 font-bold hover:bg-lime-400 disabled:opacity-50 transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-lime-500/20 cursor-pointer"
          >
            <span>{submitting ? "Authenticating with Firebase..." : "Log In to Admin Dashboard"}</span>
            {!submitting && <FiArrowRight size={18} />}
          </button>
        </form>

        <div className="text-center pt-3 border-t border-neutral-800/80">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition font-medium"
          >
            ← Return to Public Storefront
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#141813] border border-neutral-800 rounded-3xl p-6 space-y-5 relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <FiLock className="text-lime-400" size={18} />
                Reset Admin Password
              </h3>
              <button
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              >
                <FiX size={20} />
              </button>
            </div>

            {isResetSent ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-12 h-12 bg-lime-500/20 text-lime-400 rounded-full flex items-center justify-center mx-auto border border-lime-500/30">
                  <FiCheckCircle size={26} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">Reset Link Sent!</p>
                  <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                    We sent password recovery instructions to <span className="text-lime-400 font-semibold">{resetEmail}</span>. Please check your inbox.
                  </p>
                </div>
                <button
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-lime-500 text-neutral-950 font-bold hover:bg-lime-400 transition text-xs cursor-pointer"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <p className="text-xs text-neutral-400">
                  Enter your registered administrator email address to receive a secure password reset link.
                </p>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
                    Admin Email
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-3.5 text-neutral-500" size={18} />
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="admin@ftrnutrition.com"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-lime-500 transition"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-400 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-lime-500 text-neutral-950 font-bold hover:bg-lime-400 transition text-xs shadow-md shadow-lime-500/20 cursor-pointer"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
