import { useEffect, useState } from "react";
import { ShoppingCart as CartIcon, Delete as TrashIcon } from "@mui/icons-material";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Select,
  MenuItem,
  Divider,
  createTheme,
  ThemeProvider,
  styled,
  List,
  ListItem,
  ListItemText,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Paper,
} from "@mui/material";
import { CartItem } from "../services/item-service";
import cartService from "../services/cart-service";
import useUsers from "../hooks/useUsers";

const theme = createTheme({
  palette: {
    primary: {
      main: "#16a34a",
      light: "#22c55e",
      dark: "#15803d",
    },
  },
});

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
  overflow: "hidden",
  background: "linear-gradient(to bottom, #ffffff, #f8fafc)",
}));

const CartItemContainer = styled(Paper)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(3),
  padding: theme.spacing(3),
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(2),
  backgroundColor: "#ffffff",
  transition: "all 0.3s ease-in-out",
  border: "1px solid rgba(22, 163, 74, 0.1)",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 12px 24px rgba(22, 163, 74, 0.08)",
    borderColor: "rgba(22, 163, 74, 0.2)",
  },
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.main,
    borderRadius: theme.spacing(1),
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.dark,
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.dark,
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(1, 3),
  fontWeight: 600,
  textTransform: "none",
  transition: "all 0.2s ease-in-out",
  boxShadow: "none",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 4px 12px rgba(22, 163, 74, 0.15)",
  },
}));

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
}

export function Cart({ items, onUpdateQuantity, onRemoveItem }: CartProps) {
  const [showShopComparison, setShowShopComparison] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [cartName, setCartName] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const { user } = useUsers();

  const calculatePriceRange = (storePrices: CartItem["storePrices"] = []) => {
    if (!storePrices || !Array.isArray(storePrices)) {
      return { lowestPrice: 0, highestPrice: 0 };
    }

    const allPrices = storePrices
      .filter((sp) => sp && Array.isArray(sp.prices))
      .flatMap((sp) => sp.prices.map((p) => p.price ?? 0));

    return {
      lowestPrice: allPrices.length ? Math.min(...allPrices) : 0,
      highestPrice: allPrices.length ? Math.max(...allPrices) : 0,
    };
  };

  const getStoreName = (storeId: string) => {
    const storeNames: Record<string, string> = {
      "65a4e1e1e1e1e1e1e1e1e1e1": "חצי חינם",
      "65a4e1e1e1e1e1e1e1e1e1e2": "רמי לוי",
    };
    return storeNames[storeId] || `חנות ${storeId.substring(0, 5)}`;
  };

  const calculateShopTotals = () => {
    const allStoreIds = new Set<string>();

    items.forEach((item) => {
      if (item.storePrices && Array.isArray(item.storePrices)) {
        item.storePrices.forEach((sp) => {
          if (sp && sp.storeId) {
            allStoreIds.add(sp.storeId);
          }
        });
      }
    });

    const shopTotals = new Map<string, { total: number; name: string }>();

    allStoreIds.forEach((storeId) => {
      let storeTotal = 0;
      let hasAllItems = true;

      items.forEach((item) => {
        const storePriceObj = item.storePrices?.find(
          (sp) => sp.storeId === storeId
        );

        if (storePriceObj) {
          const latest = storePriceObj.prices.reduce((a, b) =>
            new Date(b.date) > new Date(a.date) ? b : a
          );
          storeTotal += (latest.price ?? 0) * (item.quantity ?? 1);
        } else {
          hasAllItems = false;
        }
      });

      if (hasAllItems) {
        shopTotals.set(storeId, {
          total: storeTotal,
          name: getStoreName(storeId),
        });
      }
    });

    return Array.from(shopTotals.entries()).sort(
      (a, b) => a[1].total - b[1].total
    );
  };

  const total = items.reduce((sum, item) => {
    const price = item.selectedStorePrice?.price ?? 0;
    const quantity = item.quantity ?? 1;
    return sum + price * quantity;
  }, 0);

  const handleSaveCart = async () => {
    if (!user) {
      setSnackbar({
        open: true,
        message: "יש להתחבר כדי לשמור את העגלה",
        severity: "error",
      });
      return;
    }

    try {
      const { request } = cartService.createCart({
        name: cartName || `העגלה שלי ${new Date().toLocaleDateString("he-IL")}`,
        ownerId: user._id || "",
        participants: [],
        items: cartService.transformCartItems(items),
      });

      await request;
      setSaveDialogOpen(false);
      setSnackbar({
        open: true,
        message: "העגלה נשמרה בהצלחה",
        severity: "success",
      });
      setCartName("");
    } catch (error) {
      console.error("Failed to save cart:", error);
      setSnackbar({
        open: true,
        message: "שגיאה בשמירת העגלה",
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (items.length === 0) {
    return (
      <StyledCard>
        <CardContent sx={{ 
          textAlign: "center", 
          py: 8,
          background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
        }}>
          <CartIcon
            sx={{ 
              fontSize: 64,
              color: "primary.main",
              opacity: 0.8,
              mb: 3
            }}
          />
          <Typography
            variant="h5"
            sx={{ 
              color: "primary.main",
              fontWeight: 700,
              mb: 2
            }}
          >
            העגלה שלך ריקה
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ maxWidth: 400, mx: "auto" }}
          >
            התחל להוסיף מוצרים לעגלה שלך כדי לראות השוואת מחירים בין רשתות
          </Typography>
        </CardContent>
      </StyledCard>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <StyledCard>
        <Box 
          sx={{ 
            bgcolor: "primary.main",
            p: 4,
            color: "white",
            background: "linear-gradient(45deg, #16a34a 30%, #22c55e 90%)"
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            עגלת קניות ({items.length} {items.length === 1 ? "פריט" : "פריטים"})
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {showShopComparison ? (
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3,
                  fontWeight: 700,
                  color: "primary.main"
                }}
              >
                השוואת מחירים בין חנויות
              </Typography>
              <List sx={{ bgcolor: "#f8fafc", borderRadius: 2, p: 2 }}>
                {calculateShopTotals().map(
                  ([storeId, { total, name }], index) => (
                    <ListItem
                      key={storeId}
                      sx={{
                        bgcolor: index === 0 ? "rgba(22, 163, 74, 0.1)" : "white",
                        borderRadius: 2,
                        mb: 2,
                        border: index === 0 
                          ? "2px solid rgba(22, 163, 74, 0.3)"
                          : "1px solid rgba(0, 0, 0, 0.1)",
                        transition: "transform 0.2s ease-in-out",
                        "&:hover": {
                          transform: "translateX(-8px)",
                        },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {name}
                          </Typography>
                        }
                        secondary={index === 0 ? "המחיר הנמוך ביותר" : null}
                      />
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        {index === 0 && (
                          <Chip
                            label="הכי זול!"
                            color="primary"
                            sx={{ 
                              fontWeight: 600,
                              bgcolor: "primary.main",
                              "& .MuiChip-label": { px: 2 }
                            }}
                          />
                        )}
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 700,
                            color: index === 0 ? "primary.main" : "text.primary",
                          }}
                        >
                          ₪{total.toFixed(2)}
                        </Typography>
                      </Box>
                    </ListItem>
                  )
                )}
              </List>
            </Box>
          ) : (
            <Box sx={{ mb: 4 }}>
              {items.map((item) => (
                <CartItemContainer key={item._id}>
                  <CardMedia
                    component="img"
                    image={
                      item.image ||
                      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
                    }
                    alt={item.name}
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: 2,
                      objectFit: "cover",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 700,
                        mb: 1,
                        color: "text.primary"
                      }}
                    >
                      {item.name}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: "text.secondary",
                        mb: 2
                      }}
                    >
                      {(() => {
                        const { lowestPrice, highestPrice } =
                          calculatePriceRange(item.storePrices);
                        return `טווח מחירים: ₪${lowestPrice.toFixed(
                          2
                        )} - ₪${highestPrice.toFixed(2)}`;
                      })()}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                      }}
                    >
                      <StyledSelect
                        value={item.quantity}
                        onChange={(e) =>
                          onUpdateQuantity(item._id, Number(e.target.value))
                        }
                        size="small"
                        sx={{ minWidth: 100 }}
                      >
                        {[1, 2, 3, 4, 5].map((num) => (
                          <MenuItem key={num} value={num}>
                            {num} יח׳
                          </MenuItem>
                        ))}
                      </StyledSelect>
                      <ActionButton
                        onClick={() => onRemoveItem(item._id)}
                        color="error"
                        startIcon={<TrashIcon />}
                        variant="outlined"
                        sx={{
                          borderColor: "error.main",
                          color: "error.main",
                          "&:hover": {
                            bgcolor: "error.main",
                            color: "white",
                          },
                        }}
                      >
                        הסר מהעגלה
                      </ActionButton>
                    </Box>
                  </Box>
                </CartItemContainer>
              ))}
            </Box>
          )}

          <Divider sx={{ my: 4 }} />

          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            <ActionButton
              variant="contained"
              fullWidth
              onClick={() => setShowShopComparison(!showShopComparison)}
              sx={{
                bgcolor: "primary.main",
                color: "white",
                py: 2,
                fontSize: "1.1rem",
              }}
            >
              {showShopComparison ? "חזרה לעגלה" : "השוואת מחירים בין רשתות"}
            </ActionButton>

            <ActionButton
              variant="outlined"
              fullWidth
              onClick={() => setSaveDialogOpen(true)}
              disabled={items.length === 0}
              sx={{
                borderColor: "primary.main",
                color: "primary.main",
                py: 2,
                fontSize: "1.1rem",
                "&:hover": {
                  borderColor: "primary.dark",
                  bgcolor: "rgba(22, 163, 74, 0.05)",
                },
              }}
            >
              שמירת עגלה
            </ActionButton>
          </Box>
        </CardContent>

        <Dialog
          open={saveDialogOpen}
          onClose={() => setSaveDialogOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: 2,
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle
            sx={{
              bgcolor: "primary.main",
              color: "white",
              py: 3,
            }}
          >
            שמירת עגלה
          </DialogTitle>
          <DialogContent sx={{ p: 4 }}>
            <TextField
              autoFocus
              margin="dense"
              label="שם העגלה"
              fullWidth
              variant="outlined"
              value={cartName}
              onChange={(e) => setCartName(e.target.value)}
              placeholder={`העגלה שלי ${new Date().toLocaleDateString(
                "he-IL"
              )}`}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": {
                    borderColor: "primary.main",
                  },
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "primary.main",
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setSaveDialogOpen(false)}
              sx={{ color: "text.secondary" }}
            >
              ביטול
            </Button>
            <Button
              onClick={handleSaveCart}
              variant="contained"
              sx={{
                bgcolor: "primary.main",
                "&:hover": { bgcolor: "primary.dark" },
              }}
            >
              שמור עגלה
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{
              width: "100%",
              borderRadius: 2,
              bgcolor: snackbar.severity === "success" ? "#16a34a" : undefined,
              color: snackbar.severity === "success" ? "white" : undefined,
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </StyledCard>
    </ThemeProvider>
  );
}