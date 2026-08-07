import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

const UserAuthContext = createContext();
const USER_STORAGE_KEY = "frd_user_session_v1";

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        if (user.email) {
          localStorage.setItem("frd_last_user_email", user.email.toLowerCase());
        }
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem("frd_last_user_email");
      }
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const loginUser = (userData) => {
    const userEmail = (userData.email || "").toLowerCase().trim();
    const userId = userData.id || `usr_${userEmail.replace(/[^a-z0-9]/g, "_") || Date.now()}`;
    
    // Check if user has saved profile details in localStorage
    let savedProfile = {};
    try {
      const rawProfile = localStorage.getItem(`frd_user_profile_${userEmail}`);
      if (rawProfile) savedProfile = JSON.parse(rawProfile);
    } catch (e) {}

    const fullUser = {
      id: userId,
      name: userData.name || userEmail.split("@")[0] || "Athlete",
      email: userEmail,
      phone: userData.phone || savedProfile.phone || "",
      address: userData.address || savedProfile.address || "",
      city: userData.city || savedProfile.city || "",
      state: userData.state || savedProfile.state || "",
      pincode: userData.pincode || savedProfile.pincode || "",
      country: userData.country || savedProfile.country || "India",
    };

    setUser(fullUser);
    toast.success(`Welcome, ${fullUser.name}! Logged in successfully.`);
    setIsAuthOpen(false);

    if (pendingAction) {
      setTimeout(() => {
        pendingAction();
        setPendingAction(null);
      }, 300);
    }
  };

  const logoutUser = () => {
    setUser(null);
    setPendingAction(null);
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem("frd_last_user_email");
    } catch (e) {}
    toast.success("Logged out successfully.");
  };

  const updateUserProfile = (updatedData) => {
    setUser((prev) => {
      const next = prev ? { ...prev, ...updatedData } : updatedData;
      try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(next));
        if (next.email) {
          localStorage.setItem(`frd_user_profile_${next.email.toLowerCase()}`, JSON.stringify(next));
        }
      } catch (e) {}
      return next;
    });
    toast.success("Account details updated successfully!");
  };

  const requireAuth = (actionCallback, message = "Please log in first to continue.") => {
    if (user) {
      actionCallback();
    } else {
      toast.error(message);
      setPendingAction(() => actionCallback);
      window.location.href = "/user/login";
    }
  };

  return (
    <UserAuthContext.Provider
      value={{
        user,
        isAuthOpen,
        setIsAuthOpen,
        loginUser,
        logoutUser,
        updateUserProfile,
        requireAuth,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  return useContext(UserAuthContext);
}
