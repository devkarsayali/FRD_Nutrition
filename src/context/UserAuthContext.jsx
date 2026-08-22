import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { db } from "../firebase/firebase.config";
import { doc, setDoc } from "firebase/firestore";

const UserAuthContext = createContext();
const USER_STORAGE_KEY = "frd_user_session_v1";

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem(USER_STORAGE_KEY) || localStorage.getItem(USER_STORAGE_KEY);
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
        sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      } else {
        sessionStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch (e) {}
  }, [user]);

  const loginUser = async (userData) => {
    const userEmail = (userData.email || "").toLowerCase().trim();
    const userId = userData.id || `usr_${userEmail.replace(/[^a-z0-9]/g, "_") || Date.now()}`;

    const fullUser = {
      id: userId,
      name: userData.name || (userEmail ? userEmail.split("@")[0] : "Customer"),
      email: userEmail,
      photoURL: userData.photoURL || userData.avatar || "",
      phone: userData.phone || "",
      address: userData.address || "",
      city: userData.city || "",
      state: userData.state || "",
      pincode: userData.pincode || "",
      country: userData.country || "India",
    };

    // Save user profile to Firebase Firestore database with merge option
    try {
      if (userEmail) {
        await setDoc(doc(db, "users", userEmail), {
          ...fullUser,
          lastLoginAt: new Date().toISOString(),
        }, { merge: true });
      }
    } catch (firebaseErr) {
      console.warn("Firestore user sync warning:", firebaseErr);
    }

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
      sessionStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch (e) {}
    toast.success("Logged out successfully.");
  };

  const updateUserProfile = async (updatedData) => {
    const next = user ? { ...user, ...updatedData } : updatedData;
    setUser(next);

    if (next.email) {
      const email = next.email.toLowerCase().trim();
      try {
        await setDoc(doc(db, "users", email), {
          ...next,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (err) {
        console.warn("Firestore profile update warning:", err);
      }
    }

    toast.success("Account details updated successfully!");
  };

  const requireAuth = (actionCallback, message = "Please log in first to continue.") => {
    if (user) {
      actionCallback();
    } else {
      toast.error(message);
      setPendingAction(() => actionCallback);
      setIsAuthOpen(true);
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
