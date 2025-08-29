import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Tooltip,
  Snackbar,
  Divider,
} from "@mui/material";
import useUsers from "../hooks/useUsers";
import { User } from "../services/user-service";
import userService from "../services/user-service";
import cartService, { Cart } from "../services/cart-service";
import {
  Apple,
  Camera,
  Save,
  Edit2,
  Lock,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Share2,
  UserMinus,
  BellOff,
  Bell,
  MessageCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import useCart from "../hooks/useCart";
import useItems from "../hooks/useItems";
import { styled } from "@mui/material";
import CartChat from "./CartChat";
import notificationService, {
  PriceDropNotification,
} from "../services/notification-service";
import ProductCard from "./ProductCard";
import CartEmailSender from "./CartEmailSender";
import { useNotifications } from "../contexts/NotificationContext";
import { CartParticipant } from "../services/cart-service";
interface PersonalAreaProps {
  user: User;
}

const SectionHeader = styled(Box)(({ theme }) => ({
  background: "linear-gradient(90deg, #16a34a 0%, #22c55e 100%)",
  color: "white",
  padding: theme.spacing(2, 3),
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(3),
  boxShadow: "0 4px 12px rgba(22, 163, 74, 0.15)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));

const CustomChatBadge = ({ count }: { count: number }) => {
  if (count <= 0) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        top: 8,
        left: 8,
        zIndex: 10,
        bgcolor: "#ef4444",
        color: "white",
        borderRadius: "12px",
        padding: "3px 8px",
        display: "flex",
        alignItems: "center",
        fontSize: "0.75rem",
        fontWeight: "bold",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        animation: "pulse 1.5s infinite",
        "@keyframes pulse": {
          "0%": {
            boxShadow: "0 0 0 0 rgba(239, 68, 68, 0.7)",
          },
          "70%": {
            boxShadow: "0 0 0 6px rgba(239, 68, 68, 0)",
          },
          "100%": {
            boxShadow: "0 0 0 0 rgba(239, 68, 68, 0)",
          },
        },
      }}
    >
      <MessageCircle size={14} style={{ marginRight: 4 }} />
      {count}
    </Box>
  );
};

const CartNotificationTooltip = ({
  cartId,
  children,
}: {
  cartId: string;
  children: React.ReactNode;
}) => {
  const { getChatNotificationsForCart } = useNotifications();
  const notifications = getChatNotificationsForCart(cartId);

  if (notifications.length === 0) return <>{children}</>;

  const lastNotifications = notifications
    .sort(
      (a, b) =>
        new Date(b.changeDate).getTime() - new Date(a.changeDate).getTime()
    )
    .slice(0, 5);

  const tooltipContent = (
    <Box sx={{ maxWidth: 300, p: 1 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
        הודעות אחרונות:
      </Typography>
      <List disablePadding dense>
        {lastNotifications.map((notification) => (
          <ListItem key={notification.id} disableGutters sx={{ pb: 0.5 }}>
            <ListItemText
              primary={notification.productName.replace(
                "הודעה חדשה מעגלה: ",
                ""
              )}
              secondary={notification.message}
              primaryTypographyProps={{ variant: "body2", fontWeight: "bold" }}
              secondaryTypographyProps={{ variant: "caption" }}
            />
          </ListItem>
        ))}
      </List>
      <Typography
        variant="caption"
        sx={{
          display: "block",
          textAlign: "center",
          mt: 1,
          fontStyle: "italic",
        }}
      >
        לחץ לצפייה בשיחה המלאה
      </Typography>
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} placement="top" arrow>
      <Box sx={{ position: "relative", width: "100%" }}>{children}</Box>
    </Tooltip>
  );
};

const PersonalArea: React.FC<PersonalAreaProps> = ({ user }) => {
  const { updateUser } = useUsers();
  const [editMode, setEditMode] = useState(false);
  const [userName, setUserName] = useState(user.userName);
  const [email, setEmail] = useState(user.email);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const inputFileRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const [myCarts, setMyCarts] = useState<Cart[]>([]);
  const [sharedCarts, setSharedCarts] = useState<Cart[]>([]);
  const [loadingCarts, setLoadingCarts] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [selectedCart, setSelectedCart] = useState<Cart | null>(null);
  const [cartDetailsOpen, setCartDetailsOpen] = useState(false);

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [selectedCartForShare, setSelectedCartForShare] = useState<Cart | null>(
    null
  );

  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] =
    useState<CartParticipant | null>(null);

  const [cartItemsWithDetails, setCartItemsWithDetails] = useState<
    Array<{
      productId: string;
      quantity: number;
      productName?: string;
      price?: number;
      category?: string;
      image?: string;
    }>
  >([]);

  const [loadingDetails, setLoadingDetails] = useState(false);

  const { items: allProducts } = useItems();

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const { chatNotifications, markChatNotificationsAsRead } = useNotifications();

  const cartNotifications = chatNotifications.filter((n) => n.cartId);

  const [cartPriceDropNotifications, setCartPriceDropNotifications] = useState<
    PriceDropNotification[]
  >([]);

  const getUnreadChatCount = (cartId: string) => {
    const count = chatNotifications.filter(
      (n) => n.type === "chat" && n.cartId === cartId && !n.isRead
    ).length;
    console.log(`💬 Unread chat count for cart ${cartId}:`, count);
    return count;
  };


  useEffect(() => {
    console.log("🧠 useEffect - user?._id =", user?._id);

    const fetchCarts = async () => {
      if (!user?._id) return;
      setLoadingCarts(true);
      setCartError(null);

      try {
        const { request } = cartService.getCartsByUser(user._id);
        const response = await request;
        const allCarts = response.data;

        const my = allCarts.filter((cart: Cart) => cart.ownerId === user._id);
        const shared = allCarts.filter(
          (cart: Cart) =>
            cart.ownerId !== user._id &&
            cart.participants.some((p) => p._id === user._id)
        );

        setMyCarts(my);
        setSharedCarts(shared);
      } catch (error) {
        setCartError("שגיאה בטעינת עגלות");
      } finally {
        setLoadingCarts(false);
      }
    };

    fetchCarts();
  }, [user?._id]);

  useEffect(() => {
    if (myCarts.length > 0 && user) {
      console.log("Subscribing to cart notifications for user carts");
      myCarts.forEach((cart) => {
        if (typeof cart._id === "string" && cart._id) {
          notificationService.joinCartRoom(cart._id);
        }
      });

      localStorage.setItem(
        "userCarts",
        JSON.stringify(
          myCarts
            .map((c) => c._id)
            .filter((id): id is string => typeof id === "string" && !!id)
        )
      );
    }
  }, [myCarts, user]);

  useEffect(() => {
    const fetchCartPriceDrops = async () => {
      if (!user || !user._id) return;

      try {
        const { request } = cartService.getCartsByUser(user._id);
        const responseCarts = await request;
        const carts = responseCarts.data || [];

        const productToCartIds: Record<string, string[]> = {};
        carts.forEach((cart) => {
          if (cart.items && typeof cart._id === "string" && cart._id) {
            cart.items.forEach((item) => {
              if (!productToCartIds[item.productId]) {
                productToCartIds[item.productId] = [];
              }
              productToCartIds[item.productId].push(cart._id as string);
            });
          }
        });

        const response = await notificationService.getCartPriceDrops();
        const drops = Array.isArray(response.data) ? response.data : [];

        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);

        const notifications: PriceDropNotification[] = [];
        drops.forEach((drop: any) => {
          const cartIds = productToCartIds[drop.productId] || [];
          if (cartIds.length === 0) return;
          cartIds.forEach((cartId) => {
            if (drop.changeDate && new Date(drop.changeDate) < oneDayAgo) {
              return;
            }
            notifications.push({
              ...drop,
              cartId,
              id:
                new Date().getTime().toString() +
                Math.random().toString(36).substring(2, 9),
            });
          });
        });

        setCartPriceDropNotifications(notifications);
      } catch (error) {
        console.error("Failed to fetch cart price drops:", error);
      }
    };

    fetchCartPriceDrops();
  }, [user]);


  const handleDeleteCart = async (cartId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm("האם אתה בטוח שברצונך למחוק את העגלה?")) return;

    try {
      const { request } = cartService.deleteCart(cartId);
      await request;
      setMyCarts(myCarts.filter((cart) => cart._id !== cartId));
    } catch (error) {
      console.error("Error deleting cart:", error);
      setCartError("Failed to delete cart");
    }
  };

  const handleLoadCart = async (cart: Cart) => {
    setSelectedCart(null);
    setCartDetailsOpen(false);

    clearCart();

    if (cart.items && cart.items.length > 0) {
      navigate("/Products");
    }
  };

  const formatDate = (dateString?: Date) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("he-IL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handleViewCartDetails = async (cart: Cart) => {
    setSelectedCart(cart);
    setCartDetailsOpen(true);
    setLoadingDetails(true);

    if (cart._id) {
      markChatNotificationsAsRead(cart._id);
    }

    try {
      if (Array.isArray(allProducts) && allProducts.length > 0) {
        const itemsWithDetails = cart.items.map((item) => {
          const productDetails = allProducts.find(
            (p) => p._id === item.productId
          );
          return {
            ...item,
            productName: productDetails?.name || "מוצר לא מזוהה",
            category: productDetails?.category,
            price: productDetails?.storePrices?.[0]?.prices?.[0]?.price || 0,
            image: productDetails?.image,
          };
        });
        setCartItemsWithDetails(itemsWithDetails);
      } else {
        setCartItemsWithDetails(cart.items);
      }
    } catch (error) {
      console.error("Error getting product details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleShareCart = async () => {
    if (!shareEmail || !selectedCartForShare?._id) {
      return;
    }

    try {
      const { request } = cartService.addParticipant(
        selectedCartForShare._id,
        shareEmail
      );
      await request;

      const updatedCart = {
        ...selectedCartForShare,
        participants: [
          ...selectedCartForShare.participants,
          {
            _id: `temp-${new Date().getTime()}`,
            userId: "",
            email: shareEmail,
            userName: "משתמש חדש",
          },
        ],
      };

      setMyCarts((prevCarts) =>
        prevCarts.map((cart) =>
          cart._id === selectedCartForShare._id ? updatedCart : cart
        )
      );

      setShareDialogOpen(false);
      setShareEmail("");
      setSelectedCartForShare(null);

      setSnackbar({
        open: true,
        message: "העגלה שותפה בהצלחה",
        severity: "success",
      });
    } catch (error) {
      console.error("Error sharing cart:", error);
      setSnackbar({
        open: true,
        message: "שגיאה בשיתוף העגלה",
        severity: "error",
      });
    }
  };


  const handleRemoveParticipant = async () => {
    console.log("📣 handleRemoveParticipant נקראה");

    if (!selectedCartForShare?._id || !selectedParticipant?._id) {
      console.warn("⛔ תנאי עצירה:");
      console.warn("selectedCartForShare?._id:", selectedCartForShare?._id);
      console.warn("selectedParticipant:", selectedParticipant);
      return;
    }

    try {
      const { request } = cartService.removeParticipant(
        selectedCartForShare._id,
        selectedParticipant._id
      );

      console.log("📤 שולח בקשת הסרה לשרת...");

      await request;

      const updatedCart = {
        ...selectedCartForShare,
        participants: selectedCartForShare.participants.filter(
          (p) => p._id !== selectedParticipant._id
        ),
      };

      setMyCarts((prevCarts) =>
        prevCarts.map((cart) =>
          cart._id === selectedCartForShare._id ? updatedCart : cart
        )
      );

      setRemoveDialogOpen(false);
      setSelectedParticipant(null);
      setSelectedCartForShare(null);

      setSnackbar({
        open: true,
        message: "המשתתף הוסר בהצלחה",
        severity: "success",
      });
    } catch (error) {
      console.error("❌ שגיאה בהסרה:", error);
      setSnackbar({
        open: true,
        message: "שגיאה בהסרת המשתתף",
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleToggleNotifications = async (cart: Cart) => {
    try {
      const updatedCart = { ...cart, notifications: !cart.notifications };
      const { request } = cartService.updateCart(cart._id!, updatedCart);
      const response = await request;

      setMyCarts((prevCarts) =>
        prevCarts.map((c) => (c._id === cart._id ? response.data : c))
      );

      setSnackbar({
        open: true,
        message: `התרעות ${response.data.notifications ? "הופעלו" : "כובו"
          } בהצלחה`,
        severity: "success",
      });
    } catch (error) {
      console.error("Error toggling notifications:", error);
      setSnackbar({
        open: true,
        message: "שגיאה בעדכון התרעות",
        severity: "error",
      });
    }
  };

  const getCartPriceDropsForCart = (cartId: string) => {
    const allCartNotifications = [
      ...cartNotifications,
      ...cartPriceDropNotifications,
    ];
    return allCartNotifications
      .filter((n) => n.cartId === cartId)
      .map((notif) => {
        if (!notif.productName || !notif.image) {
          const product =
            allProducts?.find((p) => p._id === notif.productId) || {};
          return {
            ...notif,
            productName: notif.productName || (product as any).name || "",
            image: notif.image || (product as any).image || "",
          };
        }
        return notif;
      });
  };

  async function handlePasswordChange(
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ): Promise<void> {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("יש למלא את כל השדות");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("הסיסמאות החדשות אינן תואמות");
      return;
    }

    setIsSubmitting(true);

    try {
      await userService.changePassword(user._id!, currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setPasswordError(error.response?.data?.message || "שגיאה בשינוי הסיסמה");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const files = event.target.files;
    if (files && files[0]) {
      setProfilePicture(files[0]);
    }
  }

  async function handleSave(
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ): Promise<void> {
    event.preventDefault();
    setUpdateError(null);

    if (!userName || !email) {
      setUpdateError("יש למלא את כל השדות");
      return;
    }

    try {
      let avatarUrl = user.profilePicture;

      if (profilePicture) {
        const { request: uploadRequest } =
          userService.uploadImage(profilePicture);
        const uploadResponse = await uploadRequest;
        avatarUrl = uploadResponse.data.url;
      }

      const updatedUser = {
        ...user,
        userName,
        email,
        profilePicture: avatarUrl,
      };

      const result = await updateUser(updatedUser);

      if (result.success) {
        setEditMode(false);
        setSnackbar({
          open: true,
          message: "הפרופיל עודכן בהצלחה",
          severity: "success",
        });
      } else {
        setUpdateError(result.error || "שגיאה בעדכון הפרופיל");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setUpdateError(error.response?.data?.message || "שגיאה בעדכון הפרופיל");
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
        py: 6,
        px: 4,
      }}
    >
      <Paper
        elevation={3}
        sx={{ maxWidth: 800, mx: "auto", borderRadius: 3, overflow: "hidden" }}
      >
        <Box
          sx={{
            bgcolor: "#16a34a",
            p: 3,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Apple size={32} color="white" />
          <Typography variant="h5" sx={{ color: "white", fontWeight: 700 }}>
            האזור האישי שלי
          </Typography>
        </Box>

        <Box sx={{ p: 4 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "center",
              gap: 4,
              mb: 4,
            }}
          >
            <Box sx={{ position: "relative" }}>
              <Box
                component="img"
                src={
                  profilePicture
                    ? URL.createObjectURL(profilePicture)
                    : user.profilePicture
                }
                alt={user.userName}
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "4px solid #16a34a",
                }}
              />
              {editMode && (
                <Button
                  variant="contained"
                  component="label"
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    minWidth: "auto",
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    bgcolor: "#16a34a",
                    "&:hover": { bgcolor: "#15803d" },
                  }}
                >
                  <Camera size={18} />
                  <input
                    ref={inputFileRef}
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </Button>
              )}
            </Box>

            <Box sx={{ flex: 1 }}>
              {editMode ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField
                    label="שם משתמש"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    variant="outlined"
                    fullWidth
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&.Mui-focused fieldset": { borderColor: "#16a34a" },
                      },
                      "& .MuiInputLabel-root.Mui-focused": { color: "#16a34a" },
                    }}
                  />
                  <TextField
                    label="אימייל"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    variant="outlined"
                    fullWidth
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&.Mui-focused fieldset": { borderColor: "#16a34a" },
                      },
                      "& .MuiInputLabel-root.Mui-focused": { color: "#16a34a" },
                    }}
                  />
                </Box>
              ) : (
                <>
                  <Typography
                    variant="h4"
                    sx={{ color: "#16a34a", fontWeight: 700, mb: 1 }}
                  >
                    {user.userName}
                  </Typography>
                  <Typography variant="body1" sx={{ color: "text.secondary" }}>
                    {user.email}
                  </Typography>
                </>
              )}
            </Box>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button
              variant="outlined"
              onClick={() => setIsPasswordDialogOpen(true)}
              startIcon={<Lock />}
              sx={{
                color: "#16a34a",
                borderColor: "#16a34a",
                "&:hover": {
                  borderColor: "#15803d",
                  bgcolor: "rgba(22, 163, 74, 0.04)",
                },
                px: 4,
              }}
            >
              שנה סיסמה
            </Button>

            {editMode ? (
              <Button
                variant="contained"
                onClick={handleSave}
                startIcon={<Save />}
                sx={{
                  bgcolor: "#16a34a",
                  "&:hover": { bgcolor: "#15803d" },
                  px: 4,
                }}
              >
                שמור שינויים
              </Button>
            ) : (
              <Button
                variant="outlined"
                onClick={() => setEditMode(true)}
                startIcon={<Edit2 />}
                sx={{
                  color: "#16a34a",
                  borderColor: "#16a34a",
                  "&:hover": {
                    borderColor: "#15803d",
                    bgcolor: "rgba(22, 163, 74, 0.04)",
                  },
                  px: 4,
                }}
              >
                ערוך פרופיל
              </Button>
            )}
          </Box>

          {updateError && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {updateError}
            </Alert>
          )}
        </Box>
      </Paper>

      <Paper
        elevation={3}
        sx={{
          maxWidth: 800,
          mx: "auto",
          borderRadius: 3,
          overflow: "hidden",
          mt: 4,
        }}
      >
        <Box
          sx={{
            bgcolor: "#16a34a",
            p: 3,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <ShoppingBag size={32} color="white" />
          <Typography variant="h5" sx={{ color: "white", fontWeight: 700 }}>
            העגלות השמורות שלי
          </Typography>
        </Box>

        <Box sx={{ p: 4 }}>
          {loadingCarts ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : cartError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {cartError}
            </Alert>
          ) : myCarts.length === 0 && sharedCarts.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                אין לך עגלות שמורות עדיין
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate("/Products")}
                startIcon={<ShoppingBag />}
                sx={{
                  mt: 2,
                  bgcolor: "#16a34a",
                  "&:hover": { bgcolor: "#15803d" },
                }}
              >
                התחל קניות
              </Button>
            </Box>
          ) : (
            <>
              {myCarts.length > 0 && (
                <>
                  <SectionHeader>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, color: "white" }}
                    >
                      העגלות שלי
                    </Typography>
                  </SectionHeader>

                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    {myCarts.map((cart) => {
                      const drops = getCartPriceDropsForCart(cart._id!);
                      const unreadCount = getUnreadChatCount(cart._id!);
                      return (
                        <Grid item xs={12} md={6} key={cart._id}>
                          {drops.length > 0 && (
                            <Tooltip title={`${drops.length} הודעות על ירידות מחירים`}>
                              <Chip
                                size="small"
                                label={`${drops.length} ירידות מחירים`}
                                color="error"
                                sx={{ mb: 1 }}
                              />
                            </Tooltip>
                          )}
                          <CartNotificationTooltip cartId={cart._id!}>
                            <Box sx={{ position: "relative" }}>
                              <CustomChatBadge count={unreadCount} />
                              <Card
                                sx={{
                                  cursor: "pointer",
                                  transition: "transform 0.2s, box-shadow 0.2s",
                                  "&:hover": {
                                    transform: "translateY(-4px)",
                                    boxShadow: 4,
                                  },
                                  height: "100%",
                                  display: "flex",
                                  flexDirection: "column",
                                  ...(unreadCount > 0 && {
                                    border: "2px solid #ef4444",
                                    position: "relative",
                                    "&::before": {
                                      content: '""',
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      height: "4px",
                                      background:
                                        "linear-gradient(90deg, #ef4444 0%, #f87171 100%)",
                                      borderTopLeftRadius: "inherit",
                                      borderTopRightRadius: "inherit",
                                    },
                                  }),
                                }}
                                onClick={() => handleViewCartDetails(cart)}
                              >
                                <CardContent sx={{ flexGrow: 1 }}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      mb: 2,
                                    }}
                                  >
                                    <Typography
                                      variant="h6"
                                      sx={{ fontWeight: 600, color: "#16a34a" }}
                                    >
                                      {cart.name || "עגלה ללא שם"}
                                    </Typography>
                                    <Box>
                                      <Tooltip title="שלח עגלה למייל">
                                        <IconButton
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                          }}
                                          sx={{
                                            color: "#16a34a",
                                            mr: 1,
                                          }}
                                        >
                                          <CartEmailSender
                                            savedCart={cart}
                                            size={18}
                                            hideTooltip={true}
                                            onlyIcon={true}
                                          />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="שתף עגלה">
                                        <IconButton
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedCartForShare(cart);
                                            setShareDialogOpen(true);
                                          }}
                                          sx={{
                                            color: "#16a34a",
                                            mr: 1,
                                          }}
                                        >
                                          <Share2 size={18} />
                                        </IconButton>
                                      </Tooltip>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                          color: "#16a34a",
                                          borderColor: "#16a34a",
                                          "&:hover": {
                                            bgcolor: "rgba(22, 163, 74, 0.04)",
                                            borderColor: "#15803d",
                                          },
                                          mr: 1,
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/edit-cart/${cart._id}`);
                                        }}
                                      >
                                        ערוך
                                      </Button>
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={(e) =>
                                          handleDeleteCart(cart._id!, e)
                                        }
                                        sx={{
                                          "&:hover": {
                                            bgcolor: "rgba(211, 47, 47, 0.1)",
                                          },
                                        }}
                                      >
                                        <Trash2 size={18} />
                                      </IconButton>
                                    </Box>
                                  </Box>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mb: 1 }}
                                  >
                                    נוצר: {formatDate(cart.createdAt)}
                                  </Typography>
                                  <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                                    <Chip
                                      label={`${cart.items?.length || 0
                                        } פריטים`}
                                      size="small"
                                      sx={{
                                        bgcolor: "rgba(22, 163, 74, 0.1)",
                                        color: "#16a34a",
                                        fontWeight: 600,
                                      }}
                                    />
                                    {cart.participants.length > 0 && (
                                      <Chip
                                        label={`${cart.participants.length} משתתפים`}
                                        size="small"
                                        sx={{
                                          bgcolor: "rgba(22, 163, 74, 0.1)",
                                          color: "#16a34a",
                                          fontWeight: 600,
                                        }}
                                      />
                                    )}
                                  </Box>
                                  {cart.participants.length > 0 && (
                                    <Box sx={{ mb: 2 }}>
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ mb: 1 }}
                                      >
                                        משתתפים:
                                      </Typography>
                                      <Box
                                        sx={{
                                          display: "flex",
                                          flexWrap: "wrap",
                                          gap: 1,
                                        }}
                                      >
                                        {cart.participants.map(
                                          (participant) => (
                                            <Chip
                                              key={participant._id}
                                              label={participant.userName}
                                              avatar={
                                                participant.profilePicture ? (
                                                  <img
                                                    src={
                                                      participant.profilePicture
                                                    }
                                                    alt={participant.userName}
                                                    style={{
                                                      width: 24,
                                                      height: 24,
                                                      borderRadius: "50%",
                                                      objectFit: "cover",
                                                    }}
                                                  />
                                                ) : undefined
                                              }
                                              size="small"
                                              onDelete={(e) => {
                                                e.stopPropagation();
                                                setSelectedCartForShare(cart);
                                                setSelectedParticipant(
                                                  participant
                                                );

                                                setRemoveDialogOpen(true);
                                              }}
                                              deleteIcon={
                                                <UserMinus size={14} />
                                              }
                                              sx={{
                                                bgcolor:
                                                  "rgba(22, 163, 74, 0.05)",
                                                borderColor:
                                                  "rgba(22, 163, 74, 0.2)",
                                                border: "1px solid",
                                              }}
                                            />
                                          )
                                        )}
                                      </Box>
                                    </Box>
                                  )}
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "flex-end",
                                      mt: 2,
                                    }}
                                  >
                                    <Button
                                      size="small"
                                      endIcon={<ArrowRight size={16} />}
                                      sx={{ color: "#16a34a" }}
                                    >
                                      צפה בפרטים
                                    </Button>
                                  </Box>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      mt: 2,
                                    }}
                                  >
                                    <Tooltip
                                      title={
                                        cart.notifications
                                          ? "כבה התראות"
                                          : "הפעל התראות"
                                      }
                                    >
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleNotifications(cart);
                                        }}
                                        sx={{
                                          color: cart.notifications
                                            ? "#16a34a"
                                            : "text.secondary",
                                          "&:hover": {
                                            bgcolor: cart.notifications
                                              ? "rgba(22, 163, 74, 0.04)"
                                              : "rgba(0, 0, 0, 0.04)",
                                          },
                                        }}
                                      >
                                        {cart.notifications ? (
                                          <Bell size={18} />
                                        ) : (
                                          <BellOff size={18} />
                                        )}
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Box>
                          </CartNotificationTooltip>
                        </Grid>
                      );
                    })}
                  </Grid>
                </>
              )}

              {sharedCarts.length > 0 && (
                <>
                  <SectionHeader>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, color: "white" }}
                    >
                      עגלות ששיתפו איתי
                    </Typography>
                  </SectionHeader>

                  <Grid container spacing={3}>
                    {sharedCarts.map((cart) => {
                      const unreadCount = getUnreadChatCount(cart._id!);
                      return (
                        <Grid item xs={12} md={6} key={cart._id}>
                          <CartNotificationTooltip cartId={cart._id!}>
                            <Box sx={{ position: "relative" }}>
                              <CustomChatBadge count={unreadCount} />
                              <Card
                                sx={{
                                  cursor: "pointer",
                                  transition: "transform 0.2s, box-shadow 0.2s",
                                  "&:hover": {
                                    transform: "translateY(-4px)",
                                    boxShadow: 4,
                                  },
                                  height: "100%",
                                  display: "flex",
                                  flexDirection: "column",
                                  ...(unreadCount > 0 && {
                                    border: "2px solid #ef4444",
                                    position: "relative",
                                    "&::before": {
                                      content: '""',
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      height: "4px",
                                      background:
                                        "linear-gradient(90deg, #ef4444 0%, #f87171 100%)",
                                      borderTopLeftRadius: "inherit",
                                      borderTopRightRadius: "inherit",
                                    },
                                  }),
                                }}
                                onClick={() => handleViewCartDetails(cart)}
                              >
                                <CardContent sx={{ flexGrow: 1 }}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      mb: 2,
                                    }}
                                  >
                                    <Typography
                                      variant="h6"
                                      sx={{ fontWeight: 600, color: "#16a34a" }}
                                    >
                                      {cart.name || "עגלה ללא שם"}
                                    </Typography>
                                    <Box>

                                      <Tooltip title="שלח עגלה למייל">
                                        <IconButton
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                          }}
                                          sx={{
                                            color: "#16a34a",
                                            mr: 1,
                                          }}
                                        >
                                          <CartEmailSender
                                            savedCart={cart}
                                            size={18}
                                            hideTooltip={true}
                                            onlyIcon={true}
                                          />
                                        </IconButton>
                                      </Tooltip>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                          color: "#16a34a",
                                          borderColor: "#16a34a",
                                          "&:hover": {
                                            bgcolor: "rgba(22, 163, 74, 0.04)",
                                            borderColor: "#15803d",
                                          },
                                          mr: 1,
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/edit-cart/${cart._id}`);
                                        }}
                                      >
                                        ערוך
                                      </Button>
                                    </Box>
                                  </Box>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mb: 1 }}
                                  >
                                    נוצר: {formatDate(cart.createdAt)}
                                  </Typography>
                                  <Chip
                                    label={`${cart.items?.length || 0} פריטים`}
                                    size="small"
                                    sx={{
                                      bgcolor: "rgba(22, 163, 74, 0.1)",
                                      color: "#16a34a",
                                      fontWeight: 600,
                                      mb: 2,
                                    }}
                                  />
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "flex-end",
                                      mt: 2,
                                    }}
                                  >
                                    <Button
                                      size="small"
                                      endIcon={<ArrowRight size={16} />}
                                      sx={{ color: "#16a34a" }}
                                    >
                                      צפה בפרטים
                                    </Button>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Box>
                          </CartNotificationTooltip>
                        </Grid>
                      );
                    })}
                  </Grid>
                </>
              )}
            </>
          )}
        </Box>
      </Paper>

      <Dialog
        open={cartDetailsOpen}
        onClose={() => setCartDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedCart && (
          <>
            <DialogTitle
              sx={{
                bgcolor: "#16a34a",
                color: "white",
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 3
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {selectedCart.name || "עגלה ללא שם"}
              </Typography>
            </DialogTitle>

            <DialogContent sx={{ py: 3, mt: 2 }}>
              {selectedCart.participants && selectedCart.participants.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 2,
                      color: '#16a34a'
                    }}
                  >
                    משתתפים בעגלה
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedCart.participants.map((participant) => (
                      <Chip
                        key={participant._id}
                        label={participant.userName || participant.email}
                        variant="outlined"
                        sx={{
                          bgcolor: 'rgba(22, 163, 74, 0.1)',
                          borderColor: 'rgba(22, 163, 74, 0.3)',
                          color: '#16a34a',
                          fontWeight: 500,
                          '&:hover': {
                            bgcolor: 'rgba(22, 163, 74, 0.15)',
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Divider sx={{ mb: 3 }} />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                נוצר בתאריך: {formatDate(selectedCart.createdAt)}
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#16a34a' }}>
                תכולת העגלה:
              </Typography>

              {loadingDetails ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                  <CircularProgress size={30} color="primary" />
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {cartItemsWithDetails.length > 0 ? (
                    cartItemsWithDetails.map((item, index) => {
                      const product = allProducts?.find(
                        (p) => p._id === item.productId
                      );
                      if (!product) return null;
                      return (
                        <Grid
                          item
                          xs={12}
                          sm={6}
                          md={4}
                          key={item.productId || index}
                        >
                          <ProductCard product={product} onAddToCart={() => { }} />
                        </Grid>
                      );
                    })
                  ) : (
                    <Grid item xs={12}>
                      <Alert severity="info">אין לך עגלות שמורות עדיין</Alert>
                    </Grid>
                  )}
                </Grid>
              )}

              {selectedCart && selectedCart._id && (
                <>
                  {selectedCart.participants?.length > 0 ? (
                    <Box
                      sx={{
                        mt: 4,
                        pt: 3,
                        borderTop: "1px solid rgba(0,0,0,0.12)",
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, mb: 2 }}
                      >
                        שיחות על העגלה:
                      </Typography>
                      <CartChat
                        cartId={selectedCart._id}
                        userName={user.userName}
                        isOpen={cartDetailsOpen}
                      />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        mt: 4,
                        pt: 3,
                        borderTop: "1px solid rgba(0,0,0,0.12)",
                        textAlign: "center",
                        color: "text.secondary",
                      }}
                    >
                      <Typography variant="body1">
                        צ'אט זמין רק בעגלות משותפות
                      </Typography>
                      <Button
                        startIcon={<Share2 size={16} />}
                        sx={{ mt: 1, color: "#16a34a" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCartForShare(selectedCart);
                          setShareDialogOpen(true);
                          setCartDetailsOpen(false);
                        }}
                      >
                        שתף עגלה זו כדי להפעיל צ'אט
                      </Button>
                    </Box>
                  )}
                </>
              )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
              <Button
                variant="contained"
                onClick={() => selectedCart && handleLoadCart(selectedCart)}
                disabled={!selectedCart?.items?.length}
                sx={{ bgcolor: "#16a34a", "&:hover": { bgcolor: "#15803d" } }}
              >
                טען עגלה לקניות
              </Button>
              <Button
                onClick={() => setCartDetailsOpen(false)}
                sx={{ color: "text.secondary" }}
              >
                סגור
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={shareDialogOpen}
        onClose={() => {
          setShareDialogOpen(false);
          setSelectedCartForShare(null);
          setShareEmail("");
        }}
      >
        <DialogTitle sx={{ bgcolor: "primary.main", color: "white" }}>
          שיתוף עגלה
        </DialogTitle>
        <DialogContent sx={{ pt: 2, mt: 2 }}>
          <TextField
            fullWidth
            label="כתובת אימייל של המשתמש"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
            placeholder="example@email.com"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setShareDialogOpen(false);
              setSelectedCartForShare(null);
              setShareEmail("");
            }}
          >
            ביטול
          </Button>
          <Button
            variant="contained"
            onClick={handleShareCart}
            disabled={!shareEmail}
          >
            שתף
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={removeDialogOpen}
        onClose={() => {
          setRemoveDialogOpen(false);
          setSelectedCartForShare(null);
          setSelectedParticipant(null);
        }}
      >
        <DialogTitle sx={{ bgcolor: "error.main", color: "white" }}>
          הסרת משתתף
        </DialogTitle>
        <DialogContent sx={{ pt: 2, mt: 2 }}>
          <Typography>
            האם אתה בטוח שברצונך להסיר את המשתמש {selectedParticipant?.userName}{" "}
            מהעגלה?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setRemoveDialogOpen(false);
              setSelectedCartForShare(null);
              setSelectedParticipant(null);
            }}
          >
            ביטול
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRemoveParticipant}
          >
            הסר משתתף
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog
        open={isPasswordDialogOpen}
        onClose={() => !isSubmitting && setIsPasswordDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            bgcolor: "#16a34a",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Lock size={24} />
          שינוי סיסמה
        </DialogTitle>
        <DialogContent sx={{ pt: 2, mt: 2 }}>
          {passwordSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              הסיסמה שונתה בהצלחה!
            </Alert>
          )}
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordError}
            </Alert>
          )}
          <TextField
            label="סיסמה נוכחית"
            type="password"
            fullWidth
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isSubmitting}
            sx={{ mb: 2 }}
          />
          <TextField
            label="סיסמה חדשה"
            type="password"
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isSubmitting}
            sx={{ mb: 2 }}
          />
          <TextField
            label="אימות סיסמה חדשה"
            type="password"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isSubmitting}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setIsPasswordDialogOpen(false)}
            disabled={isSubmitting}
            sx={{ color: "text.secondary" }}
          >
            ביטול
          </Button>
          <Button
            variant="contained"
            onClick={handlePasswordChange}
            disabled={isSubmitting}
            sx={{ bgcolor: "#16a34a", "&:hover": { bgcolor: "#15803d" } }}
          >
            {isSubmitting ? "מעדכן..." : "שנה סיסמה"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{
            width: "100%",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            borderRadius: 2,
            "& .MuiAlert-icon": {
              fontSize: "1.5rem",
            },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PersonalArea;
