import { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Select,
  MenuItem,
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
import { ShoppingCart as CartIcon, Delete as TrashIcon } from "@mui/icons-material";
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
  const [clearCartDialogOpen, setClearCartDialogOpen] = useState(false);
  const [cartName, setCartName] = useState("");
  const [savedCartId, setSavedCartId] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
const [shareEmail, setShareEmail] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const { user } = useUsers();

  const calculatePriceRange = (storePrices: CartItem["storePrices"] = []) => {
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
    items.forEach((item) =>
      item.storePrices?.forEach((sp) => allStoreIds.add(sp.storeId))
    );
    const shopTotals = new Map<string, { total: number; name: string }>();
    allStoreIds.forEach((storeId) => {
      let storeTotal = 0;
      let hasAllItems = true;
      items.forEach((item) => {
        const sp = item.storePrices?.find((s) => s.storeId === storeId);
        if (!sp) {
          hasAllItems = false;
          return;
        }
        const latest = sp.prices.reduce((a, b) =>
          new Date(b.date) > new Date(a.date) ? b : a
        );
        storeTotal += (latest.price ?? 0) * (item.quantity ?? 1);
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

  const handleSaveCart = async () => {
    if (!user) {
      setSnackbar({ open: true, message: "יש להתחבר כדי לשמור את העגלה", severity: "error" });
      return;
    }
    try {
      const { request } = cartService.createCart({
        name: cartName || `העגלה שלי ${new Date().toLocaleDateString("he-IL")}`,
        ownerId: user._id || "",
        participants: [],
        items: cartService.transformCartItems(items),
      });
      const response = await request;
      setSavedCartId(response.data._id || null);
      setSaveDialogOpen(false);

      setSnackbar({ open: true, message: "העגלה נשמרה בהצלחה", severity: "success" });
      setCartName("");
    } catch {
      setSnackbar({ open: true, message: "שגיאה בשמירת העגלה", severity: "error" });
    }
  };

  const handleShareCart = async () => {
    if (!shareEmail || !savedCartId) {
      setSnackbar({ open: true, message: "יש להזין כתובת מייל תקינה", severity: "error" });
      return;
    }
  
    try {
      const { request } = cartService.addParticipant(savedCartId, shareEmail);
      await request;
      setSnackbar({ open: true, message: "המשתמש שותף לעגלה בהצלחה", severity: "success" });
      setShareDialogOpen(false);
      setShareEmail("");
    } catch {
      setSnackbar({ open: true, message: "שגיאה בשיתוף העגלה", severity: "error" });
    }
  };
  

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Fixed handleClearCart function
  const handleClearCart = () => {
    // Remove all items from cart
    items.forEach(item => onRemoveItem(item._id));
    
    // Close the dialog
    setClearCartDialogOpen(false);
    
    // Show success message
    setSnackbar({ 
      open: true, 
      message: "העגלה נוקתה בהצלחה", 
      severity: "success" 
    });
  };

  if (items.length === 0) {
    return (
      <StyledCard>
        <CardContent
          sx={{
            textAlign: "center",
            py: 8,
            background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
          }}
        >
          <CartIcon sx={{ fontSize: 64, color: "primary.main", opacity: 0.8, mb: 3 }} />
          <Typography variant="h5" sx={{ color: "primary.main", fontWeight: 700, mb: 2 }}>
            העגלה שלך ריקה
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mx: "auto" }}>
            התחל להוסיף מוצרים לעגלה שלך כדי לראות השוואת מחירים בין רשתות
          </Typography>
        </CardContent>
      </StyledCard>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <StyledCard>
        <Box sx={{ bgcolor: "primary.main", p: 4, color: "white", background: "linear-gradient(45deg, #16a34a 30%, #22c55e 90%)" }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            עגלת קניות ({items.length} {items.length === 1 ? "פריט" : "פריטים"})
          </Typography>
        </Box>

        <CardContent
          sx={{
            p: 4,
            maxHeight: "60vh", // גלילה בתוך תוכן העגלה
            overflowY: "auto",
          }}
        >
          {showShopComparison ? (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: "primary.main" }}>
                השוואת מחירים בין חנויות
              </Typography>
              <List sx={{ bgcolor: "#f8fafc", borderRadius: 2, p: 2 }}>
                {calculateShopTotals().map(([storeId, { total, name }], index) => (
                  <ListItem
                    key={storeId}
                    sx={{
                      bgcolor: index === 0 ? "rgba(22, 163, 74, 0.1)" : "white",
                      borderRadius: 2,
                      mb: 2,
                      border: index === 0 ? "2px solid rgba(22, 163, 74, 0.3)" : "1px solid rgba(0, 0, 0, 0.1)",
                      "&:hover": { transform: "translateX(-8px)" },
                    }}
                  >
                    <ListItemText
                      primary={<Typography variant="h6" sx={{ fontWeight: 600 }}>{name}</Typography>}
                      secondary={index === 0 ? "המחיר הנמוך ביותר" : null}
                    />
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      {index === 0 && <Chip label="הכי זול!" color="primary" sx={{ fontWeight: 600 }} />}
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        ₪{total.toFixed(2)}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Box>
          ) : (
            <Box>
              {items.map((item) => (
                <CartItemContainer key={item._id}>
                  <CardMedia
                    component="img"
                    image={item.image || "https://placehold.co/100x100?text=No+Image"}
                    alt={item.name}
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: 2,
                      objectFit: "cover",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = "https://placehold.co/100x100?text=No+Image";
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      {item.name}
                    </Typography>
                    <Typography variant="body1" sx={{ color: "text.secondary", mb: 2 }}>
                      {(() => {
                        const { lowestPrice, highestPrice } = calculatePriceRange(item.storePrices);
                        return `טווח מחירים: ₪${lowestPrice.toFixed(2)} - ₪${highestPrice.toFixed(2)}`;
                      })()}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <StyledSelect
                        value={item.quantity}
                        onChange={(e) => onUpdateQuantity(item._id, Number(e.target.value))}
                        size="small"
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
                      >
                        הסר מהעגלה
                      </ActionButton>
                    </Box>
                  </Box>
                </CartItemContainer>
              ))}
            </Box>
          )}
        </CardContent>

        {/* Action buttons with new Clear Cart button */}
<Box sx={{ p: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
  <ActionButton 
    fullWidth 
    variant="contained" 
    onClick={() => setShowShopComparison(!showShopComparison)}
  >
    {showShopComparison ? "חזרה לעגלה" : "השוואת מחירים בין רשתות"}
  </ActionButton>
  <ActionButton 
    fullWidth 
    variant="outlined" 
    onClick={() => setSaveDialogOpen(true)}
  >
    שמירת עגלה
  </ActionButton>

  {savedCartId && (
    <ActionButton
      fullWidth
      variant="outlined"
      color="primary"
      onClick={() => setShareDialogOpen(true)}
    >
      שיתוף עגלה
    </ActionButton>
  )}

  <ActionButton
    fullWidth
    variant="outlined"
    color="error"
    startIcon={<TrashIcon />}
    onClick={() => setClearCartDialogOpen(true)}
  >
    ניקוי עגלה
  </ActionButton>
</Box>


        {/* Save cart dialog */}
        <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
          <DialogTitle sx={{ bgcolor: "primary.main", color: "white", py: 3 }}>שמירת עגלה</DialogTitle>
          <DialogContent sx={{ p: 4 }}>
            <TextField
              fullWidth
              label="שם העגלה"
              value={cartName}
              onChange={(e) => setCartName(e.target.value)}
              placeholder={`העגלה שלי ${new Date().toLocaleDateString("he-IL")}`}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setSaveDialogOpen(false)}>ביטול</Button>
            <Button onClick={handleSaveCart} variant="contained">
              שמור עגלה
            </Button>
          </DialogActions>
        </Dialog>

        {/* Clear cart confirmation dialog */}
        <Dialog open={clearCartDialogOpen} onClose={() => setClearCartDialogOpen(false)}>
          <DialogTitle sx={{ bgcolor: "error.main", color: "white", py: 3 }}>ניקוי העגלה</DialogTitle>
          <DialogContent sx={{ p: 4 }}>
            <Typography>
              האם אתה בטוח שברצונך למחוק את כל המוצרים מהעגלה?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setClearCartDialogOpen(false)}>ביטול</Button>
            <Button 
              onClick={handleClearCart} 
              variant="contained" 
              color="error"
              startIcon={<TrashIcon />}
            >
              ניקוי העגלה
            </Button>
          </DialogActions>
        </Dialog>

       {/* Share cart dialog */}
<Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)}>
  <DialogTitle sx={{ bgcolor: "primary.main", color: "white", py: 3 }}>שיתוף עגלה</DialogTitle>
  <DialogContent sx={{ p: 4 }}>
    <TextField
      fullWidth
      label="כתובת אימייל של המשתמש"
      value={shareEmail}
      onChange={(e) => setShareEmail(e.target.value)}
      placeholder="example@email.com"
    />
  </DialogContent>
  <DialogActions sx={{ p: 3 }}>
    <Button onClick={() => setShareDialogOpen(false)}>ביטול</Button>
    <Button onClick={handleShareCart} variant="contained">
      שתף
    </Button>
  </DialogActions>
</Dialog>

        {/* Snackbar for notifications */}
        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert severity={snackbar.severity} onClose={handleCloseSnackbar}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </StyledCard>
    </ThemeProvider>
  );
}