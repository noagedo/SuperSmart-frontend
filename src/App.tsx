import React from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import NavBar from "./components/NavBar";
import HomeBeforeSignIn from "./components/Home";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignUp from "./components/SignUp";
import SignIn from "./components/SignIn";
import PersonalArea from "./components/PersonalArea";
import WishlistsPage from "./components/WishlistsPage";
import WishlistDetail from "./components/WishlistDetail";
import PriceCheckDebug from "./components/PriceCheckDebug";
import NotificationDebug from "./components/NotificationDebug";

import useUsers from "./hooks/useUsers";
import theme from "./theme";
import ProductList from "./components/ProductList";

const App: React.FC = () => {
  const { user } = useUsers();

  // Initialize socket and check for price changes on app load
  React.useEffect(() => {
    if (user && user._id) {
      // Ensure socket is connected
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

      // Force check for recent price changes
      localStorage.removeItem("lastPriceCheckTimestamp");
      console.log(
        "App mounted, cleared lastPriceCheckTimestamp for fresh price checks"
      );
    }
  }, [user]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <NavBar />
        <Routes>
          <Route path="/" element={<HomeBeforeSignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/Products" element={<ProductList />} />
          <Route
            path="/personal-area"
            element={user ? <PersonalArea user={user} /> : <SignIn />}
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

          {/* Debug routes - only in development */}
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
    </ThemeProvider>
  );
};

export default App;
