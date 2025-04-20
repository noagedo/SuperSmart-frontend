import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useUsers from "../hooks/useUsers";
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Button, 
  IconButton,
  Container,
  createTheme,
  ThemeProvider,
  styled
} from "@mui/material";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home'; // Import home icon
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'; // Import cart icon for consistency
import { Apple } from 'lucide-react';
import Loading from "./Loading";

const theme = createTheme({
  palette: {
    primary: {
      main: '#16a34a',
      light: '#22c55e',
      dark: '#15803d',
    },
  },
});

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: 'white',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.02)',
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: '9999px',
  padding: '8px 24px',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.2s ease-in-out',
}));

const NavButton = styled(Button)(({ theme }) => ({
  borderRadius: '8px',
  padding: '6px 16px',
  fontWeight: 500,
  textTransform: 'none',
  color: theme.palette.text.secondary,
  '&:hover': {
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
    color: theme.palette.primary.main,
  },
}));

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
    const confirmed = window.confirm("האם אתה בטוח שברצונך להתנתק?");
    if (!confirmed) return;

    setLoading(true);
    await signOut();
    setTimeout(() => {
      navigate("/");
      setLoading(false);
    }, 1000);
  };

  return (
    <ThemeProvider theme={theme}>
      <StyledAppBar position="sticky">
        <Container maxWidth="xl">
          <Toolbar sx={{ justifyContent: "space-between", py: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <LogoContainer onClick={() => handleNavigation("/Products")}>
                <Apple 
                  size={32} 
                  color={theme.palette.primary.main}
                  style={{ marginRight: '8px' }}
                />
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                    letterSpacing: '-0.5px',
                    background: 'linear-gradient(45deg, #16a34a 30%, #22c55e 90%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  SuperSmart
                </Typography>
              </LogoContainer>
              
              {/* Navigation Links */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, ml: 4 }}>
                <NavButton 
                  startIcon={<HomeIcon />}
                  onClick={() => handleNavigation("/")}
                >
                  דף הבית
                </NavButton>
                
              
              </Box>
            </Box>

            <Box sx={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 2 
            }}>
              {user ? (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: 'text.primary',
                      fontWeight: 500,
                      display: { xs: 'none', sm: 'block' }
                    }}
                  >
                    שלום, {user.userName}
                  </Typography>
                  
                  <IconButton
                    onClick={() => handleNavigation("/personal-area")}
                    disabled={loading}
                    sx={{
                      color: theme.palette.primary.main,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        backgroundColor: theme.palette.primary.light,
                        color: 'white',
                        transform: 'scale(1.1)',
                      }
                    }}
                  >
                    <AccountCircleIcon />
                  </IconButton>

                  <IconButton
                    onClick={handleLogout}
                    disabled={loading}
                    sx={{
                      color: theme.palette.primary.main,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        backgroundColor: theme.palette.primary.light,
                        color: 'white',
                        transform: 'scale(1.1)',
                      }
                    }}
                  >
                    <LogoutIcon />
                  </IconButton>
                </>
              ) : (
                <>
                  <ActionButton
                    variant="outlined"
                    onClick={() => handleNavigation("/sign-in")}
                    sx={{
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.light,
                        borderColor: theme.palette.primary.light,
                        color: 'white',
                        transform: 'scale(1.02)',
                      }
                    }}
                  >
                    התחברות
                  </ActionButton>
                  <ActionButton
                    variant="contained"
                    onClick={() => handleNavigation("/sign-up")}
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      color: 'white',
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                        transform: 'scale(1.02)',
                      }
                    }}
                  >
                    הרשמה
                  </ActionButton>
                </>
              )}
            </Box>
          </Toolbar>
        </Container>
      </StyledAppBar>
      {loading && <Loading />}
    </ThemeProvider>
  );
};

export default NavBar;