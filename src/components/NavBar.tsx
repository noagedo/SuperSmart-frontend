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
  styled,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme,
  Badge,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import HomeIcon from "@mui/icons-material/Home";
import { Apple, Heart, Menu } from "lucide-react";
import Loading from "./Loading";
import NotificationsCenter from "./NotificationsCenter";
import { useNotifications } from "../contexts/NotificationContext"; // ייבוא ה-context החדש

const theme = createTheme({
  palette: {
    primary: {
      main: "#16a34a",
      light: "#22c55e",
      dark: "#15803d",
    },
  },
});

const StyledAppBar = styled(AppBar)(({}) => ({
  backgroundColor: "white",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
}));

const LogoContainer = styled(Box)(({}) => ({
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  transition: "transform 0.2s ease-in-out",
  "&:hover": {
    transform: "scale(1.02)",
  },
}));

const ActionButton = styled(Button)(({}) => ({
  borderRadius: "9999px",
  padding: "8px 24px",
  fontWeight: 600,
  textTransform: "none",
  transition: "all 0.2s ease-in-out",
}));

const NavButton = styled(Button)(({ theme }) => ({
  borderRadius: "8px",
  padding: "6px 16px",
  fontWeight: 500,
  textTransform: "none",
  color: theme.palette.text.secondary,
  "&:hover": {
    backgroundColor: "rgba(22, 163, 74, 0.08)",
    color: theme.palette.primary.main,
  },
}));

const NavBar: React.FC = () => {
  const { user, signOut } = useUsers();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));
  // השימוש ב-context להתראות
  const { unreadChatCount } = useNotifications();

  const handleNavigation = (path: string) => {
    setLoading(true);
    setMobileMenuOpen(false);
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

  const renderNavItems = () => (
    <>
      <NavButton
        startIcon={<HomeIcon />}
        onClick={() => handleNavigation(user ? "/Products" : "/")}
      >
        דף הבית
      </NavButton>
      {user && (
        <NavButton
          onClick={() => navigate("/wishlists")}
          startIcon={<Heart size={18} />}
        >
          רשימות מועדפים
        </NavButton>
      )}
    </>
  );

  const renderAuthButtons = () => (
    <>
      {user ? (
        <>
          <Typography
            variant="subtitle1"
            sx={{
              color: "text.primary",
              fontWeight: 500,
              display: { xs: "none", sm: "block" },
            }}
          >
            שלום, {user.userName}
          </Typography>

          {user._id && <NotificationsCenter />}

          {/* הוספת Badge עם מספר ההתראות לאיקון האזור האישי */}
          <Badge
            badgeContent={unreadChatCount}
            color="error"
            overlap="circular"
            sx={{
              "& .MuiBadge-badge": {
                fontSize: "0.65rem",
                minWidth: "18px",
                height: "18px",
              },
            }}
            invisible={unreadChatCount === 0}
          >
            <IconButton
              onClick={() => handleNavigation("/personal-area")}
              disabled={loading}
              sx={{
                color: theme.palette.primary.main,
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  backgroundColor: theme.palette.primary.light,
                  color: "white",
                  transform: "scale(1.1)",
                },
              }}
            >
              <AccountCircleIcon />
            </IconButton>
          </Badge>

          <IconButton
            onClick={handleLogout}
            disabled={loading}
            sx={{
              color: theme.palette.primary.main,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                backgroundColor: theme.palette.primary.light,
                color: "white",
                transform: "scale(1.1)",
              },
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
              "&:hover": {
                backgroundColor: theme.palette.primary.light,
                borderColor: theme.palette.primary.light,
                color: "white",
                transform: "scale(1.02)",
              },
            }}
          >
            התחברות
          </ActionButton>
          <ActionButton
            variant="contained"
            onClick={() => handleNavigation("/sign-up")}
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: "white",
              "&:hover": {
                backgroundColor: theme.palette.primary.dark,
                transform: "scale(1.02)",
              },
            }}
          >
            הרשמה
          </ActionButton>
        </>
      )}
    </>
  );

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
                  style={{ marginRight: "8px" }}
                />
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                    letterSpacing: "-0.5px",
                    background:
                      "linear-gradient(45deg, #16a34a 30%, #22c55e 90%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  SuperSmart
                </Typography>
              </LogoContainer>

              {/* Desktop Navigation */}
              {!isMobile && (
                <Box sx={{ display: "flex", ml: 4 }}>{renderNavItems()}</Box>
              )}
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              {!isMobile ? (
                renderAuthButtons()
              ) : (
                <>
                  {user && user._id && <NotificationsCenter />}
                  <IconButton
                    onClick={() => setMobileMenuOpen(true)}
                    sx={{ color: theme.palette.primary.main }}
                  >
                    <Menu />
                  </IconButton>
                </>
              )}
            </Box>
          </Toolbar>
        </Container>
      </StyledAppBar>

      {/* Mobile Menu Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        PaperProps={{
          sx: {
            width: "80%",
            maxWidth: "300px",
            bgcolor: "white",
            p: 2,
          },
        }}
      >
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <LogoContainer
            onClick={() => {
              handleNavigation("/Products");
              setMobileMenuOpen(false);
            }}
            sx={{ justifyContent: "center", mb: 2 }}
          >
            <Apple size={32} color={theme.palette.primary.main} />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: theme.palette.primary.main,
                mr: 1,
              }}
            >
              SuperSmart
            </Typography>
          </LogoContainer>
          {user && (
            <Typography variant="subtitle1" sx={{ color: "text.secondary" }}>
              שלום, {user.userName}
            </Typography>
          )}
        </Box>

        <List>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(user ? "/Products" : "/")}
            >
              <ListItemIcon>
                <HomeIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="דף הבית" />
            </ListItemButton>
          </ListItem>

          {user && (
            <>
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNavigation("/wishlists")}>
                  <ListItemIcon>
                    <Heart color="#16a34a" size={24} />
                  </ListItemIcon>
                  <ListItemText primary="רשימות מועדפים" />
                </ListItemButton>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => handleNavigation("/personal-area")}
                >
                  <ListItemIcon>
                    <Badge
                      badgeContent={unreadChatCount}
                      color="error"
                      invisible={unreadChatCount === 0}
                      sx={{
                        "& .MuiBadge-badge": {
                          fontSize: "0.65rem",
                        },
                      }}
                    >
                      <AccountCircleIcon color="primary" />
                    </Badge>
                  </ListItemIcon>
                  <ListItemText primary="אזור אישי" />
                  {unreadChatCount > 0 && (
                    <Box
                      component="span"
                      sx={{
                        bgcolor: "error.main",
                        color: "white",
                        borderRadius: "50%",
                        fontSize: "0.75rem",
                        minWidth: "20px",
                        height: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        ml: 1,
                      }}
                    >
                      {unreadChatCount}
                    </Box>
                  )}
                </ListItemButton>
              </ListItem>
            </>
          )}
        </List>

        <Box sx={{ mt: "auto", p: 2 }}>
          {user ? (
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
            >
              התנתק
            </Button>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => handleNavigation("/sign-in")}
              >
                התחברות
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => handleNavigation("/sign-up")}
              >
                הרשמה
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>

      {loading && <Loading />}
    </ThemeProvider>
  );
};

export default NavBar;
