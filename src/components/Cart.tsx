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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  ShoppingCart as CartIcon,
  Delete as TrashIcon,
} from "@mui/icons-material";
import RoomIcon from "@mui/icons-material/Room";
import { CartItem } from "../services/item-service";
import cartService from "../services/cart-service";
import useUsers from "../hooks/useUsers";
import { getStoreName } from "../utils/storeUtils";
import SuperMap, { Supermarket } from "./SuperMap";
import { CartParticipant } from "../services/cart-service";

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
  flexDirection: "column",
  gap: theme.spacing(2),
  padding: theme.spacing(2),
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
  [theme.breakpoints.up("md")]: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing(3),
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
  width: "100%",
  [theme.breakpoints.up("md")]: {
    width: "auto",
  },
}));

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  participants?: CartParticipant[];
}

const storeLocations: Record<
  string,
  { lat: number; lng: number; address: string }
> = {
  shufersal: { lat: 32.0853, lng: 34.7818, address: "שופרסל, תל אביב" },
  mega: { lat: 32.0836, lng: 34.8004, address: "ויקטורי, תל אביב" },
  yenotbitan: { lat: 32.0707, lng: 34.8245, address: "יינות ביתן, תל אביב" },
  ramilevi: { lat: 31.9522, lng: 34.7998, address: "רמי לוי, ראשון לציון" },
  mahsaneiHashuk: { lat: 32.1019, lng: 34.8271, address: "מחסני השוק, רמת גן" },
};

export function Cart({ items, onUpdateQuantity, onRemoveItem, participants = [] }: CartProps) {
  const [showShopComparison, setShowShopComparison] = useState(false);
  const [showAllStoresMap, setShowAllStoresMap] = useState(false);
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
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));
  const [showSingleStoreMap, setShowSingleStoreMap] =
    useState<null | Supermarket>(null);

  const calculatePriceRange = (storePrices: CartItem["storePrices"] = []) => {
    const latestPricesByStore = storePrices
      .filter((sp) => sp && Array.isArray(sp.prices) && sp.prices.length > 0)
      .map((storePrice) => {
        const latestPrice = storePrice.prices.reduce((latest, current) => {
          const latestDate = new Date(
            latest.date || latest.data || "1970-01-01"
          );
          const currentDate = new Date(
            current.date || current.data || "1970-01-01"
          );
          return currentDate > latestDate ? current : latest;
        });

        return typeof latestPrice.price === "string"
          ? parseFloat(latestPrice.price)
          : latestPrice.price;
      });

    return {
      lowestPrice: latestPricesByStore.length
        ? Math.min(...latestPricesByStore)
        : 0,
      highestPrice: latestPricesByStore.length
        ? Math.max(...latestPricesByStore)
        : 0,
    };
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
        const latest = sp.prices.reduce((a, b) => {
          const dateA = new Date(a.date || a.data || "1970-01-01");
          const dateB = new Date(b.date || b.data || "1970-01-01");
          return dateB > dateA ? b : a;
        });
        const latestPrice =
          typeof latest.price === "string"
            ? parseFloat(latest.price)
            : latest.price ?? 0;
        storeTotal += latestPrice * (item.quantity ?? 1);
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
      const response = await request;
      setSavedCartId(response.data._id || null);
      setSaveDialogOpen(false);

      setSnackbar({
        open: true,
        message: "העגלה נשמרה בהצלחה",
        severity: "success",
      });

      setCartName("");
    } catch {
      setSnackbar({
        open: true,
        message: "שגיאה בשמירת העגלה",
        severity: "error",
      });
    }
  };

  const handleShareCart = async () => {
    if (!shareEmail || !savedCartId) {
      setSnackbar({
        open: true,
        message: "יש להזין כתובת מייל תקינה",
        severity: "error",
      });
      return;
    }

    try {
      const { request } = cartService.addParticipant(savedCartId, shareEmail);
      await request;
      setSnackbar({
        open: true,
        message: "המשתמש שותף לעגלה בהצלחה",
        severity: "success",
      });
      setShareDialogOpen(false);
      setShareEmail("");
    } catch {
      setSnackbar({
        open: true,
        message: "שגיאה בשיתוף העגלה",
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleClearCart = () => {
    items.forEach((item) => onRemoveItem(item._id));
    setClearCartDialogOpen(false);
    setSnackbar({
      open: true,
      message: "העגלה נוקתה בהצלחה",
      severity: "success",
    });
  };

  

  const getMapStores = (): Supermarket[] => {
    return calculateShopTotals().map(([storeId, { name }]) => {
      const location = storeLocations[storeId] || {
        lat: 32.0853,
        lng: 34.7818,
        address: "Israel",
      };
      return {
        id: storeId,
        name: name,
        address: location.address,
        lat: location.lat,
        lng: location.lng,
      };
    });
  };

  const renderParticipants = () => {
    if (!participants.length) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          משתתפים בעגלה:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {participants.map((participant) => (
            <Chip
              key={participant._id}
              label={participant.userName || participant.email}
              variant="outlined"
              color="primary"
              sx={{ borderRadius: 1 }}
            />
          ))}
        </Box>
      </Box>
    );
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
          <CartIcon
            sx={{ fontSize: 64, color: "primary.main", opacity: 0.8, mb: 3 }}
          />
          <Typography
            variant="h5"
            sx={{ color: "primary.main", fontWeight: 700, mb: 2 }}
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
        <Box sx={{ bgcolor: "primary.main", p: 3, color: "white", background: "linear-gradient(45deg, #16a34a 30%, #22c55e 90%)" }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            עגלת קניות ({items.length} {items.length === 1 ? "פריט" : "פריטים"})
          </Typography>
          {renderParticipants()}
        </Box>

        <CardContent
          sx={{
            p: { xs: 2, md: 4 },
            maxHeight: "60vh",
            overflowY: "auto",
          }}
        >
          {showShopComparison ? (
            <Box>
              <Box
                sx={{ display: "flex", alignItems: "center", mb: 2, gap: 2 }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: "primary.main" }}
                >
                  השוואת מחירים בין חנויות
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<RoomIcon />}
                  onClick={() => setShowAllStoresMap((prev) => !prev)}
                  sx={{ ml: 2 }}
                >
                  מפה
                </Button>
              </Box>
              {showAllStoresMap && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    מיקום כל החנויות
                  </Typography>
                  <Box
                    sx={{
                      width: "100%",
                      height: 300,
                      borderRadius: 2,
                      overflow: "hidden",
                      boxShadow: 1,
                    }}
                  >
                    <SuperMap stores={getMapStores()} height={300} />
                  </Box>
                </Box>
              )}
              <List sx={{ bgcolor: "#f8fafc", borderRadius: 2, p: 2 }}>
                {calculateShopTotals().map(
                  ([storeId, { total, name }], index) => {
                    const location = storeLocations[storeId] || {
                      lat: 32.0853,
                      lng: 34.7818,
                      address: "Israel",
                    };
                    const storeForMap: Supermarket = {
                      id: storeId,
                      name,
                      address: location.address,
                      lat: location.lat,
                      lng: location.lng,
                    };
                    return (
                      <ListItem
                        key={storeId}
                        sx={{
                          bgcolor:
                            index === 0 ? "rgba(22, 163, 74, 0.1)" : "white",
                          borderRadius: 2,
                          mb: 2,
                          border:
                            index === 0
                              ? "2px solid rgba(22, 163, 74, 0.3)"
                              : "1px solid rgba(0, 0, 0, 0.1)",
                          flexDirection: isMobile ? "column" : "row",
                          alignItems: isMobile ? "flex-start" : "center",
                          gap: isMobile ? 2 : 0,
                          padding: 2,
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
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            width: isMobile ? "100%" : "auto",
                            justifyContent: isMobile
                              ? "space-between"
                              : "flex-end",
                          }}
                        >
                          {index === 0 && (
                            <Chip
                              label="הכי זול!"
                              color="primary"
                              sx={{ fontWeight: 600 }}
                            />
                          )}
                          <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            ₪{total.toFixed(2)}
                          </Typography>
                          <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<RoomIcon />}
                            onClick={() => setShowSingleStoreMap(storeForMap)}
                          >
                            הצג במפה
                          </Button>
                        </Box>
                      </ListItem>
                    );
                  }
                )}
              </List>
            </Box>
          ) : (
            <Box>
              {items.map((item) => (
                <CartItemContainer key={item._id}>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      width: "100%",
                      flexDirection: isMobile ? "column" : "row",
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={
                        item.image ||
                        "https://placehold.co/100x100?text=No+Image"
                      }
                      alt={item.name}
                      sx={{
                        width: isMobile ? "100%" : 100,
                        height: isMobile ? 200 : 100,
                        borderRadius: 2,
                        objectFit: "cover",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src =
                          "https://placehold.co/100x100?text=No+Image";
                      }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        {item.name}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ color: "text.secondary", mb: 2 }}
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
                          gap: 2,
                          flexDirection: isMobile ? "column" : "row",
                          alignItems: isMobile ? "stretch" : "center",
                        }}
                      >
                        <StyledSelect
                          value={item.quantity}
                          onChange={(e) =>
                            onUpdateQuantity(item._id, Number(e.target.value))
                          }
                          size="small"
                          fullWidth={isMobile}
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
                          fullWidth={isMobile}
                        >
                          הסר מהעגלה
                        </ActionButton>
                      </Box>
                    </Box>
                  </Box>
                </CartItemContainer>
              ))}
            </Box>
          )}
        </CardContent>

        <Box
          sx={{
            p: 3,
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: 2,
          }}
        >
          <ActionButton
            variant="contained"
            onClick={() => setShowShopComparison(!showShopComparison)}
          >
            {showShopComparison ? "חזרה לעגלה" : "השוואת מחירים בין רשתות"}
          </ActionButton>
          <ActionButton
            variant="outlined"
            onClick={() => setSaveDialogOpen(true)}
          >
            שמירת עגלה
          </ActionButton>

          {savedCartId && (
            <ActionButton
              variant="outlined"
              color="primary"
              onClick={() => setShareDialogOpen(true)}
            >
              שיתוף עגלה
            </ActionButton>
          )}

          <ActionButton
            variant="outlined"
            color="error"
            startIcon={<TrashIcon />}
            onClick={() => setClearCartDialogOpen(true)}
          >
            ניקוי עגלה
          </ActionButton>
        </Box>

        <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
          <DialogTitle sx={{ bgcolor: "primary.main", color: "white", py: 3 }}>
            שמירת עגלה
          </DialogTitle>
          <DialogContent sx={{ p: 4 }}>
            <TextField
              fullWidth
              label="שם העגלה"
              value={cartName}
              onChange={(e) => setCartName(e.target.value)}
              placeholder={`העגלה שלי ${new Date().toLocaleDateString(
                "he-IL"
              )}`}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setSaveDialogOpen(false)}>ביטול</Button>
            <Button onClick={handleSaveCart} variant="contained">
              שמור עגלה
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={clearCartDialogOpen}
          onClose={() => setClearCartDialogOpen(false)}
        >
          <DialogTitle sx={{ bgcolor: "error.main", color: "white", py: 3 }}>
            ניקוי העגלה
          </DialogTitle>
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

        <Dialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
        >
          <DialogTitle sx={{ bgcolor: "primary.main", color: "white", py: 3 }}>
            שיתוף עגלה
          </DialogTitle>
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

        <Dialog
          open={!!showSingleStoreMap}
          onClose={() => setShowSingleStoreMap(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ bgcolor: "primary.main", color: "white", py: 3 }}>
            מיקום החנות במפה
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            {showSingleStoreMap && (
              <Box
                sx={{
                  width: "100%",
                  height: 350,
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <SuperMap stores={[showSingleStoreMap]} height={350} />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setShowSingleStoreMap(null)}
              color="primary"
              variant="contained"
            >
              סגור
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={handleCloseSnackbar}
            sx={{
              width: "100%",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              borderRadius: 2,
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </StyledCard>
    </ThemeProvider>
  );
}