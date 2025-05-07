import React from "react";
import NavBar from "./components/NavBar";
import HomeBeforeSignIn from "./components/Home";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignUp from "./components/SignUp";
import SignIn from "./components/SignIn";
import PersonalArea from "./components/PersonalArea";
import WishlistsPage from "./components/WishlistsPage";
import WishlistDetail from "./components/WishlistDetail";
import EditCart from "./components/EditCart";
import PriceCheckDebug from "./components/PriceCheckDebug";
import NotificationDebug from "./components/NotificationDebug";
import useUsers from "./hooks/useUsers";
import ProductList from "./components/ProductList";
import ProductDetails from "./components/ProductDetail";

const App: React.FC = () => {
  const { user } = useUsers();

  // Initialize socket and check for price changes on app load
  React.useEffect(() => {
    if (user && user._id) {
      const initializeSocket = async () => {
        try {
          const notificationService = (
            await import("./services/notification-service")
          ).default;
          notificationService.reconnect();
          console.log("Socket initialized on app startup");
        } catch (error) {
          console.error("Failed to initialize socket:", error);
        }
      };

      initializeSocket();
      localStorage.removeItem("lastPriceCheckTimestamp");
      console.log(
        "App mounted, cleared lastPriceCheckTimestamp for fresh price checks"
      );
    }
  }, [user]);

  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomeBeforeSignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/sign-in" element={<SignIn />} />

        {/* Product routes */}
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/:productId" element={<ProductDetails />} />

        {/* Auth-protected routes */}
        <Route
          path="/personal-area"
          element={user ? <PersonalArea user={user} /> : <SignIn />}
        />

        <Route
          path="/edit-cart/:id"
          element={user ? <EditCart /> : <SignIn />}
        />
        {/* Add wishlist routes */}
        <Route
          path="/wishlists"
          element={user ? <WishlistsPage /> : <SignIn />}
        />
        <Route
          path="/wishlists/:id"
          element={user ? <WishlistDetail /> : <SignIn />}
        />

        {/* Debug-only routes */}
        {process.env.NODE_ENV !== "production" && (
          <>
            <Route
              path="/debug"
              element={user ? <PriceCheckDebug /> : <SignIn />}
            />
            <Route
              path="/notification-debug"
              element={user ? <NotificationDebug /> : <SignIn />}
            />
          </>
        )}
      </Routes>
    </Router>
  );
};

export default App;
