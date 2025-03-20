import React, { useState } from "react";
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import useUsers from "../hooks/useUsers";
import AccountCircle from "@mui/icons-material/AccountCircle";
import Logout from "@mui/icons-material/Logout";
import Loading from "./Loading";

const NavBar: React.FC = () => {
  const { user, signOut } = useUsers();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    setLoading(true);
    setTimeout(() => {
      navigate(path);
      setLoading(false);
    }, 1000);
  };

  const handleLogout = async () => {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (!confirmed) return;

    setLoading(true);
    await signOut();
    setTimeout(() => {
      navigate("/");
      setLoading(false);
    }, 1000);
  };

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: "#333" }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography
              variant="h4"
              color="inherit"
              sx={{
                fontFamily: "'Comic Sans MS', 'Comic Sans', cursive",
                textShadow: "2px 2px 4px rgba(0, 0, 0, 0.3)",
                color: "#f5f5f5",
                fontWeight: "bold",
                textDecoration: "none",
              }}
              onClick={() => handleNavigation("/Products")}
            >
              SuperSmart
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            {user ? (
              <>
                <Typography
                  variant="h6"
                  color="inherit"
                  sx={{ marginRight: 2 }}
                >
                  Welcome, {user.userName}
                </Typography>
                
                <Button
                  color="inherit"
                  onClick={() => handleNavigation("/personal-area")}
                  sx={{
                    border: "2px solid pink",
                    marginLeft: 2,
                    color: "inherit",
                  }}
                  disabled={loading}
                >
                  <AccountCircle />
                </Button>
                <Button
                  color="inherit"
                  onClick={handleLogout}
                  disabled={loading}
                  sx={{
                    border: "2px solid pink",
                    marginLeft: 2,
                    color: "inherit",
                  }}
                >
                  <Logout />
                </Button>
              </>
            ) : (
              <>
                <Button
                  color="inherit"
                  onClick={() => handleNavigation("/sign-in")}
                  sx={{
                    border: "2px solid pink",
                    marginLeft: 2,
                    color: "inherit",
                  }}
                >
                  Sign In
                </Button>
                <Button
                  color="inherit"
                  onClick={() => handleNavigation("/sign-up")}
                  sx={{
                    border: "2px solid pink",
                    marginLeft: 2,
                    color: "inherit",
                  }}
                >
                  Sign Up
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      {loading && <Loading />}
    </>
  );
};

export default NavBar;
