import { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { auth, db } from "../firebase/firebase.config";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem("frd_admin_auth") === "true";
  });

  const [adminEmail, setAdminEmail] = useState(() => {
    return sessionStorage.getItem("frd_admin_email") || "";
  });

  const [loading, setLoading] = useState(false);

  // Clear stale local fallback passcode to ensure strict Firebase database auth
  useEffect(() => {
    localStorage.removeItem("frd_admin_passcode");
  }, []);

  // Sync Firebase Auth state if user signed in via Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        sessionStorage.setItem("frd_admin_auth", "true");
        sessionStorage.setItem("frd_admin_email", user.email || "");
        setIsAdminLoggedIn(true);
        setAdminEmail(user.email || "");
      }
    });
    return () => unsubscribe();
  }, []);

  const loginAdmin = async (emailInput, passwordInput) => {
    let email = (emailInput || "").trim();
    let password = (passwordInput || "").trim();

    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid Admin Email address");
      return false;
    }

    if (!password) {
      toast.error("Please enter your Admin Password");
      return false;
    }

    setLoading(true);

    try {
      // Authenticate strictly with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential && userCredential.user) {
        sessionStorage.setItem("frd_admin_auth", "true");
        sessionStorage.setItem("frd_admin_email", email);
        setIsAdminLoggedIn(true);
        setAdminEmail(email);
        toast.success("Welcome, Administrator!");
        setLoading(false);
        return true;
      }
    } catch (firebaseAuthErr) {
      setLoading(false);
      const errorCode = firebaseAuthErr?.code || "";
      console.error("Firebase Auth Error:", errorCode, firebaseAuthErr?.message);

      if (errorCode === "auth/configuration-not-found") {
        toast.error(
          "Email/Password provider is not enabled in Firebase Console! Go to Firebase Console -> Authentication -> Sign-in method and enable Email/Password.",
          { duration: 6000 }
        );
      } else if (
        errorCode === "auth/user-not-found" ||
        errorCode === "auth/wrong-password" ||
        errorCode === "auth/invalid-credential"
      ) {
        toast.error("Invalid Firebase Admin Email or Password!");
      } else if (errorCode === "auth/too-many-requests") {
        toast.error("Too many failed attempts. Please try again later.");
      } else {
        toast.error(`Firebase Auth Error: ${firebaseAuthErr?.message || errorCode}`);
      }
      return false;
    }
  };

  const changeAdminPassword = (currentPass, newPass) => {
    toast.error("To change your Firebase Admin password, please update it in your Firebase Console or profile.");
    return false;
  };

  const logoutAdmin = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.log("Firebase signOut error:", e);
    }
    sessionStorage.removeItem("frd_admin_auth");
    sessionStorage.removeItem("frd_admin_email");
    setIsAdminLoggedIn(false);
    setAdminEmail("");
    toast("Logged out of Admin Panel", { icon: "🔒" });
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAdminLoggedIn,
        adminEmail,
        loading,
        loginAdmin,
        logoutAdmin,
        changeAdminPassword,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}
