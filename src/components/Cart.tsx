// 📁 components/Cart.tsx
import { useEffect, useState } from "react";
import {
  ShoppingCart as CartIcon,
  Delete as TrashIcon,
} from "@mui/icons-material";
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
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
  overflow: "hidden",
}));

const CartItemContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backgroundColor: "#f8fafc",
  borderRadius: theme.spacing(1),
  transition: "transform 0.2s ease-in-out",
  "&:hover": {
    transform: "translateY(-2px)",
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

  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem("cartItems", JSON.stringify(items));
    }
  }, [items]);

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

    // Add safe guards for undefined properties
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
        <CardContent sx={{ textAlign: "center", py: 6 }}>
          <CartIcon
            sx={{ fontSize: 48, color: "primary.main", opacity: 0.6, mb: 2 }}
          />
          <Typography
            variant="h6"
            sx={{ color: "primary.main", fontWeight: 600 }}
          >
            העגלה ריקה
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            הוסף מוצרים כדי להתחיל
          </Typography>
        </CardContent>
      </StyledCard>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <StyledCard>
        <Box sx={{ bgcolor: "primary.main", p: 3, color: "white" }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            עגלת קניות ({items.length} פריטים)
          </Typography>
        </Box>

        <CardContent>
          {showShopComparison ? (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                השוואת מחירים בין חנויות
              </Typography>
              <List>
                {calculateShopTotals().map(
                  ([storeId, { total, name }], index) => (
                    <ListItem
                      key={storeId}
                      sx={{
                        bgcolor:
                          index === 0
                            ? "rgba(22, 163, 74, 0.1)"
                            : "transparent",
                        borderRadius: 1,
                        mb: 1,
                        border:
                          index === 0
                            ? "1px solid rgba(22, 163, 74, 0.3)"
                            : "none",
                      }}
                    >
                      <ListItemText
                        primary={name}
                        secondary={index === 0 ? "המחיר הנמוך ביותר" : null}
                      />
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {index === 0 && (
                          <Chip
                            label="הכי זול"
                            size="small"
                            color="primary"
                            sx={{ mr: 1 }}
                          />
                        )}
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color:
                              index === 0 ? "primary.main" : "text.primary",
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
            <Box sx={{ mb: 3 }}>
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
                      width: 80,
                      height: 80,
                      borderRadius: 1.5,
                      objectFit: "cover",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {item.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      כמות: {item.quantity}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {(() => {
                        const { lowestPrice, highestPrice } =
                          calculatePriceRange(item.storePrices);
                        return `טווח מחיר: ₪${lowestPrice.toFixed(
                          2
                        )} - ₪${highestPrice.toFixed(2)}`;
                      })()}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Select
                        value={item.quantity}
                        onChange={(e) =>
                          onUpdateQuantity(item._id, Number(e.target.value))
                        }
                        size="small"
                        sx={{
                          minWidth: 80,
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "primary.main",
                          },
                        }}
                      >
                        {[1, 2, 3, 4, 5].map((num) => (
                          <MenuItem key={num} value={num}>
                            {num}
                          </MenuItem>
                        ))}
                      </Select>
                      <Button
                        onClick={() => onRemoveItem(item._id)}
                        color="error"
                        startIcon={<TrashIcon />}
                        size="small"
                        sx={{
                          "&:hover": {
                            backgroundColor: "error.light",
                            color: "white",
                          },
                        }}
                      >
                        הסר
                      </Button>
                    </Box>
                  </Box>
                </CartItemContainer>
              ))}
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <Button
              variant="contained"
              fullWidth
              sx={{
                bgcolor: "primary.main",
                color: "white",
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 600,
                borderRadius: 2,
                "&:hover": { bgcolor: "primary.dark" },
                "&:active": { transform: "scale(0.98)" },
              }}
              onClick={() => setShowShopComparison(!showShopComparison)}
            >
              {showShopComparison ? "חזרה לעגלה" : "השוואת מחירים בסופרים"}
            </Button>

            <Button
              variant="outlined"
              fullWidth
              sx={{
                borderColor: "primary.main",
                color: "primary.main",
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 600,
                borderRadius: 2,
                "&:hover": {
                  borderColor: "primary.dark",
                  color: "primary.dark",
                  bgcolor: "rgba(22, 163, 74, 0.05)",
                },
                "&:active": { transform: "scale(0.98)" },
              }}
              onClick={() => setSaveDialogOpen(true)}
              disabled={items.length === 0}
            >
              שמירת עגלה
            </Button>
          </Box>
        </CardContent>

        {/* Save Cart Dialog */}
        <Dialog
          open={saveDialogOpen}
          onClose={() => setSaveDialogOpen(false)}
          dir="rtl"
        >
          <DialogTitle>שמירת עגלה</DialogTitle>
          <DialogContent>
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
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSaveDialogOpen(false)} color="primary">
              ביטול
            </Button>
            <Button
              onClick={handleSaveCart}
              color="primary"
              variant="contained"
            >
              שמור
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success/Error Notification */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </StyledCard>
    </ThemeProvider>
  );
}
