import { Toaster } from "react-hot-toast";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { CartProvider } from "./context/CartContext";
import { ProductProvider } from "./context/ProductContext";
import { UserAuthProvider } from "./context/UserAuthContext";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <ProductProvider>
      <UserAuthProvider>
        <CartProvider>
          <AdminAuthProvider>
            <AppRoutes />

            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  borderRadius: "14px",
                  background: "#191e18",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  fontSize: "13px",
                  fontWeight: "600",
                },
              }}
            />
          </AdminAuthProvider>
        </CartProvider>
      </UserAuthProvider>
    </ProductProvider>
  );
}

export default App;