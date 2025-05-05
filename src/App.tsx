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
import EditCart from "./components/EditCart";

import useUsers from "./hooks/useUsers";
import theme from "./theme";
import ProductList from "./components/ProductList";

const App: React.FC = () => {
  const { user } = useUsers();

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
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
