import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FiCheckCircle, FiEye, FiEyeOff, FiLock, FiMail, FiUser, FiX } from "react-icons/fi";
import toast from "react-hot-toast";

export default function AuthModal({ isOpen, onClose }) {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "forgot"
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getRegisteredUsers = () => {
    try {
      const saved = localStorage.getItem("frd_registered_users");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  };

  const saveRegisteredUser = (newUser) => {
    try {
      const users = getRegisteredUsers();
      const existingIndex = users.findIndex(
        (u) => u.email.toLowerCase() === newUser.email.toLowerCase()
      );
      if (existingIndex > -1) {
        users[existingIndex] = { ...users[existingIndex], ...newUser };
      } else {
        users.push(newUser);
      }
      localStorage.setItem("frd_registered_users", JSON.stringify(users));
    } catch (e) {}
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Please enter both email and password.");
      return;
    }
    const registeredUsers = getRegisteredUsers();
    const cleanEmail = formData.email.trim().toLowerCase();
    const foundUser = registeredUsers.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );

    if (foundUser && foundUser.password && foundUser.password !== formData.password) {
      toast.error("Incorrect password. Please try again.");
      return;
    }

    const loggedUser = {
      id: foundUser?.id || `usr_${cleanEmail.replace(/[^a-z0-9]/g, "_")}`,
      name: foundUser?.name || formData.name || cleanEmail.split("@")[0] || "Athlete",
      email: cleanEmail,
    };
    setIsLoggedIn(true);
    setUser(loggedUser);
    toast.success(`Welcome back, ${loggedUser.name}! Logged in successfully.`);
    onClose();
  };

  const handleSignUpSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const cleanEmail = formData.email.trim().toLowerCase();
    const registeredUsers = getRegisteredUsers();
    const existing = registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    if (existing) {
      toast.error("An account with this email address already exists. Please log in.");
      setMode("login");
      return;
    }

    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: formData.name.trim(),
      email: cleanEmail,
      password: formData.password,
    };
    saveRegisteredUser(newUser);

    setIsLoggedIn(true);
    setUser({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
    });
    toast.success(`Welcome to FRD Nutrition, ${newUser.name}! Account created successfully.`);
    onClose();
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!formData.email) {
      toast.error("Please enter your registered email address.");
      return;
    }
    toast.success(`Password reset instructions sent to ${formData.email}!`);
    setMode("login");
  };

  const handleGoogleLogin = () => {
    const googleUser = {
      name: "Ram Athlete",
      email: "athlete@gmail.com",
    };
    setIsLoggedIn(true);
    setUser(googleUser);
    toast.success("Signed in with Google successfully!");
    onClose();
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    toast.success("Logged out successfully.");
    onClose();
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
          className="relative w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-slate-100 my-auto max-h-[90vh] overflow-y-auto"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition"
            aria-label="Close modal"
          >
            <FiX size={18} />
          </button>

          {/* Logged In View */}
          {isLoggedIn && user ? (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-[#f5b800] flex items-center justify-center mx-auto shadow-inner">
                <FiUser size={32} />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-[#f5b800] font-black uppercase tracking-widest block">
                  AUTHENTICATED ATHLETE
                </span>
                <h3 className="font-heading text-2xl font-bold text-white">
                  {user.name}
                </h3>
                <p className="text-xs text-slate-400">{user.email}</p>
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
                onClick={handleLogout}
                className="w-full py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold hover:bg-slate-800 transition text-xs shadow-md"
              >
                Log Out
              </button>
            </div>
          ) : (
            <>
              {/* Modal Title & Tab Toggle */}
              <div className="text-center space-y-2">
                <span className="text-[#f5b800] text-xs font-black uppercase tracking-widest block">
                  FRD NUTRITION OFFICIAL
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
                  {mode === "login"
                    ? "Sign In"
                    : mode === "signup"
                    ? "Create Account"
                    : "Reset Password"}
                </h2>
                <p className="text-xs text-slate-400">
                  {mode === "login"
                    ? "Welcome back! Enter your details to access your account"
                    : mode === "signup"
                    ? "Join us and start transforming your body today"
                    : "Enter your registered email address to receive reset link"}
                </p>
              </div>

              {/* FORGOT PASSWORD FORM */}
              {mode === "forgot" ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Email address *
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-[#f5b800] transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#f5b800] to-amber-500 text-slate-950 font-black hover:from-amber-400 hover:to-yellow-300 transition text-xs shadow-lg shadow-amber-500/20 uppercase tracking-wider cursor-pointer"
                  >
                    Send Reset Link
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-xs text-slate-400 hover:text-[#f5b800] transition font-bold cursor-pointer"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {/* LOGIN & SIGNUP FORM */}
                  <form
                    onSubmit={mode === "login" ? handleLoginSubmit : handleSignUpSubmit}
                    className="space-y-4"
                  >
                    {/* Name field (Sign Up Only) */}
                    {mode === "signup" && (
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                          Full Name *
                        </label>
                        <div className="relative">
                          <FiUser className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                          <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-[#f5b800] transition"
                          />
                        </div>
                      </div>
                    )}

                    {/* Email Field */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Email address *
                      </label>
                      <div className="relative">
                        <FiMail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter your email"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-[#f5b800] transition"
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-300">
                          Password *
                        </label>
                        {mode === "login" && (
                          <button
                            type="button"
                            onClick={() => setMode("forgot")}
                            className="text-[11px] text-[#f5b800] hover:underline font-bold cursor-pointer"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <FiLock className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          required
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Enter your password"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-20 py-3 text-xs text-white focus:outline-none focus:border-[#f5b800] transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          {showPassword ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                          <span>{showPassword ? "Hide" : "Show"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#f5b800] to-amber-500 text-slate-950 font-black hover:from-amber-400 hover:to-yellow-300 transition text-xs shadow-lg shadow-amber-500/20 uppercase tracking-wider cursor-pointer mt-2"
                    >
                      {mode === "login" ? "Sign In" : "Sign up"}
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="relative flex items-center justify-center my-4">
                    <div className="w-full border-t border-slate-800" />
                    <span className="bg-[#0f172a] px-3 text-[10px] text-slate-500 uppercase font-bold absolute">
                      OR
                    </span>
                  </div>

                  {/* Google Login Button */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-bold hover:bg-slate-800 hover:border-slate-700 transition flex items-center justify-center gap-2.5 text-xs cursor-pointer shadow-sm"
                  >
                    <FcGoogle size={18} />
                    <span>Continue with Google</span>
                  </button>

                  {/* Switch Mode Footer Text */}
                  <div className="text-center pt-2">
                    {mode === "login" ? (
                      <p className="text-xs text-slate-400">
                        Need an account?{" "}
                        <button
                          type="button"
                          onClick={() => setMode("signup")}
                          className="text-[#f5b800] font-black hover:underline ml-1 cursor-pointer"
                        >
                          Create Account
                        </button>
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400">
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={() => setMode("login")}
                          className="text-[#f5b800] font-black hover:underline ml-1 cursor-pointer"
                        >
                          Sign In
                        </button>
                      </p>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
