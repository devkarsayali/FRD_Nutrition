import { createContext, useContext, useState } from "react";
import toast from "react-hot-toast";

const AdminAuthContext = createContext();

const DEFAULT_ADMIN_EMAIL = "admin@ftrnutrition.com";
const DEFAULT_ADMIN_PASSCODE = "admin123";

export function AdminAuthProvider({ children }) {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem("frd_admin_auth") === "true";
  });

  const [adminEmail, setAdminEmail] = useState(() => {
    return sessionStorage.getItem("frd_admin_email") || DEFAULT_ADMIN_EMAIL;
  });

  const [adminPasscode, setAdminPasscode] = useState(() => {
    return localStorage.getItem("frd_admin_passcode") || DEFAULT_ADMIN_PASSCODE;
  });

  const loginAdmin = (emailOrPasscode, passcodeArg) => {
    let email = emailOrPasscode;
    let passcode = passcodeArg;

    if (passcodeArg === undefined && typeof emailOrPasscode === "string") {
      if (emailOrPasscode.includes("@")) {
        email = emailOrPasscode;
        passcode = "";
      } else {
        passcode = emailOrPasscode;
        email = DEFAULT_ADMIN_EMAIL;
      }
    }

    if (!email || !email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid Admin Email address");
      return false;
    }

    const trimmedPasscode = (passcode || "").trim();
    if (!trimmedPasscode) {
      toast.error("Please enter your Admin Password");
      return false;
    }

    const activeStoredPass = localStorage.getItem("frd_admin_passcode") || DEFAULT_ADMIN_PASSCODE;

    // STRICT PASSWORD CHECK: Only allow login if entered password matches the active admin password
    if (trimmedPasscode === activeStoredPass || trimmedPasscode === adminPasscode) {
      sessionStorage.setItem("frd_admin_auth", "true");
      sessionStorage.setItem("frd_admin_email", email.trim());
      setIsAdminLoggedIn(true);
      setAdminEmail(email.trim());
      toast.success("Welcome, Administrator!");
      return true;
    } else {
      toast.error("Incorrect Admin Password! Please enter the correct password.");
      return false;
    }
  };

  const changeAdminPassword = (currentPass, newPass) => {
    const activeStoredPass = localStorage.getItem("frd_admin_passcode") || DEFAULT_ADMIN_PASSCODE;

    if (currentPass !== activeStoredPass && currentPass !== adminPasscode) {
      toast.error("Current admin password is incorrect.");
      return false;
    }

    if (!newPass || newPass.trim().length < 4) {
      toast.error("New password must be at least 4 characters.");
      return false;
    }

    const updatedPass = newPass.trim();
    setAdminPasscode(updatedPass);
    localStorage.setItem("frd_admin_passcode", updatedPass);
    toast.success("Admin password changed successfully! Use your new password to log in.");
    return true;
  };

  const logoutAdmin = () => {
    sessionStorage.removeItem("frd_admin_auth");
    sessionStorage.removeItem("frd_admin_email");
    setIsAdminLoggedIn(false);
    setAdminEmail(DEFAULT_ADMIN_EMAIL);
    toast("Logged out of Admin Panel", { icon: "🔒" });
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAdminLoggedIn,
        adminEmail,
        adminPasscode,
        loginAdmin,
        logoutAdmin,
        changeAdminPassword,
        defaultAdminEmail: DEFAULT_ADMIN_EMAIL,
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
