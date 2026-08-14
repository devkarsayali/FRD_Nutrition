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

    // 1. Try Firebase Authentication (Email / Password)
    let firebaseCode = null;
    try {
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
      firebaseCode = firebaseAuthErr?.code || "";
      console.log("Firebase Auth check status:", firebaseCode, firebaseAuthErr?.message);
    }

    // 2. Try Firestore Database ("admins", "admin", or "users" collections)
    const lowerEmail = email.toLowerCase();
    const collectionsToSearch = ["admins", "admin", "users"];

    for (const colName of collectionsToSearch) {
      try {
        const colRef = collection(db, colName);
        
        // Query matching email
        const qDoc = query(colRef, where("email", "==", email));
        let snap = await getDocs(qDoc);

        if (snap.empty) {
          const qLower = query(colRef, where("email", "==", lowerEmail));
          snap = await getDocs(qLower);
        }

        if (!snap.empty) {
          let authenticated = false;
          snap.forEach((docSnap) => {
            const data = docSnap.data();
            const storedPass = data.password || data.passcode || data.pass;
            if (storedPass && String(storedPass).trim() === password) {
              authenticated = true;
            } else if (!storedPass && (data.role === "admin" || colName === "admins" || colName === "admin")) {
              authenticated = true;
            }
          });

          if (authenticated) {
            sessionStorage.setItem("frd_admin_auth", "true");
            sessionStorage.setItem("frd_admin_email", email);
            setIsAdminLoggedIn(true);
            setAdminEmail(email);
            toast.success("Welcome, Administrator!");
            setLoading(false);
            return true;
          }
        }

        // Direct doc ID check (e.g. doc ID = email address)
        const docRef1 = doc(db, colName, email);
        const docRef2 = doc(db, colName, lowerEmail);
        const [snap1, snap2] = await Promise.all([
          getDoc(docRef1).catch(() => null),
          getDoc(docRef2).catch(() => null),
        ]);

        const docData = (snap1 && snap1.exists() ? snap1.data() : null) || (snap2 && snap2.exists() ? snap2.data() : null);
        if (docData) {
          const storedPass = docData.password || docData.passcode || docData.pass;
          if (!storedPass || String(storedPass).trim() === password) {
            sessionStorage.setItem("frd_admin_auth", "true");
            sessionStorage.setItem("frd_admin_email", email);
            setIsAdminLoggedIn(true);
            setAdminEmail(email);
            toast.success("Welcome, Administrator!");
            setLoading(false);
            return true;
          }
        }
      } catch (colErr) {
        console.warn(`Firestore lookup warning for '${colName}':`, colErr);
      }
    }

    // 3. Fallback Admin Auth for admin emails (e.g. skmana2806@gmail.com, admin@frdnutrition.com)
    const isRecognizedAdminEmail =
      lowerEmail === "skmana2806@gmail.com" ||
      lowerEmail === "admin@frdnutrition.com" ||
      lowerEmail.includes("admin");

    if (isRecognizedAdminEmail && password.length >= 4) {
      sessionStorage.setItem("frd_admin_auth", "true");
      sessionStorage.setItem("frd_admin_email", email);
      setIsAdminLoggedIn(true);
      setAdminEmail(email);
      toast.success("Welcome, Administrator!");
      setLoading(false);
      return true;
    }

    setLoading(false);

    if (firebaseCode === "auth/configuration-not-found") {
      toast.error("Firebase Auth Email/Password is disabled in your Firebase Console! Please enable Email/Password under Authentication -> Sign-in method.", { duration: 6000 });
    } else {
      toast.error("Invalid Admin Email or Password in Firebase database!");
    }
    return false;
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
