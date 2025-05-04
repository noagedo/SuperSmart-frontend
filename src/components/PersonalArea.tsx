import { FC, useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import useCart from "../hooks/useCart";
import useItems from "../hooks/useItems"; // Add this import

// 🧩 Props
interface PersonalAreaProps {
  user: User;
}

const PersonalArea: FC<PersonalAreaProps> = ({ user }) => {
  const { updateUser } = useUsers();
  const [editMode, setEditMode] = useState(false);
  const [userName, setUserName] = useState(user.userName);
  const [email, setEmail] = useState(user.email);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const inputFileRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const { addItem, clearCart } = useCart();

  // Add states for carts
  const [myCarts, setMyCarts] = useState<Cart[]>([]);
  const [sharedCarts, setSharedCarts] = useState<Cart[]>([]);
  const [loadingCarts, setLoadingCarts] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [selectedCart, setSelectedCart] = useState<Cart | null>(null);
  const [cartDetailsOpen, setCartDetailsOpen] = useState(false);

  // Add state for cart items with product details
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

  // Add loading state for product details
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Get items hook to access products data
  const { items: allProducts } = useItems();

  // 🔒 Password change
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    setUpdateError(null);
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
        window.location.reload();
      } else {
        setUpdateError(result.error ?? null);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setUpdateError("Failed to update profile. Please try again.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setProfilePicture(files[0]);
    }
  };

  const handlePasswordChange = async () => {
    if (!user._id) {
      setPasswordError("User ID not found");
      return;
    }

    setPasswordError(null);
    setPasswordSuccess(false);
    setIsSubmitting(true);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match");
      setIsSubmitting(false);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      setIsSubmitting(false);
      return;
    }

    try {
      const { request } = userService.changePassword(
        user._id,
        currentPassword,
        newPassword
      );
      await request;
      setPasswordSuccess(true);
      setTimeout(() => {
        setIsPasswordDialogOpen(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setIsSubmitting(false);
      }, 1500);
    } catch (err: any) {
      console.error("Error changing password:", err);
      const errorMessage =
        typeof err.response?.data?.error === "string"
          ? err.response.data.error
          : err.response?.data?.error?.message ||
            "Failed to change password. Please try again.";

      setPasswordError(errorMessage);
      setIsSubmitting(false);
    }
  };

  // Fetch user's carts
  useEffect(() => {
    const fetchCarts = async () => {
      if (!user || !user._id) return;
  
      setLoadingCarts(true);
      setCartError(null);
  
      try {
        const { request } = cartService.getCartsByUser(user._id);
        const response = await request;
        const allCarts = response.data;
  
        const my = allCarts.filter((cart: Cart) => cart.ownerId === user._id);
        const shared = allCarts.filter(
          (cart: Cart) =>
            cart.ownerId !== user._id && cart.participants.includes(user._id!)
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
  

  // Handle deleting a cart
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

  // Handle loading a saved cart
  const handleLoadCart = async (cart: Cart) => {
    setSelectedCart(null);
    setCartDetailsOpen(false);

    // Navigate to products page with cart loaded
    clearCart(); // Clear current cart first

    if (cart.items && cart.items.length > 0) {
      navigate("/Products"); // Navigate to products page
    }
  };

  // Format date for display
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

  // View cart details
  const handleViewCartDetails = async (cart: Cart) => {
    setSelectedCart(cart);
    setCartDetailsOpen(true);
    setLoadingDetails(true);

    try {
      // If we already have all products loaded, use them to get details
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
        // Fallback to using just the IDs and quantities
        setCartItemsWithDetails(cart.items);
      }
    } catch (error) {
      console.error("Error getting product details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  
  

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
        sx={{
          maxWidth: 800,
          mx: "auto",
          borderRadius: 3,
          overflow: "hidden",
          mb: 4,
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
          <Apple size={32} color="white" />
          <Typography variant="h5" sx={{ color: "white", fontWeight: 700 }}>
            האזור האישי שלי
          </Typography>
        </Box>

        {/* Profile content */}
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

          {/* Actions */}
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

     
 {/* Saved Carts Section */}
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
       {/* 🟢 העגלות שלי */}
{myCarts.length > 0 && (
  <>
    <Typography variant="h6" sx={{ mb: 2, color: "#16a34a" }}>
      העגלות שלי
    </Typography>
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {myCarts.map((cart) => (
        <Grid item xs={12} md={6} key={cart._id}>
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
                    onClick={(e) => handleDeleteCart(cart._id!, e)}
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
        </Grid>
      ))}
    </Grid>
  </>
)}

        {/* 🟣 עגלות ששיתפו איתי */}
        {sharedCarts.length > 0 && (
          <>
            <Typography variant="h6" sx={{ mb: 2, color: "#16a34a" }}>
              עגלות ששיתפו איתי
            </Typography>
            <Grid container spacing={3}>
              {sharedCarts.map((cart) => (
                <Grid item xs={12} md={6} key={cart._id}>
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
                        {/* לא ניתן למחוק עגלות ששיתפו איתי */}
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
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </>
    )}
  </Box>
</Paper>


      {/* Cart Details Dialog */}
      <Dialog
        open={cartDetailsOpen}
        onClose={() => setCartDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedCart && (
          <>
            <DialogTitle sx={{ bgcolor: "#16a34a", color: "white" }}>
              {selectedCart.name || "עגלה ללא שם"}
            </DialogTitle>
            <DialogContent sx={{ py: 3, mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                נוצר בתאריך: {formatDate(selectedCart.createdAt)}
              </Typography>

              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                תכולת העגלה:
              </Typography>

              {loadingDetails ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                  <CircularProgress size={30} color="primary" />
                </Box>
              ) : (
                <List sx={{ bgcolor: "#f8fafc", borderRadius: 2 }}>
                  {cartItemsWithDetails.length > 0 ? (
                    cartItemsWithDetails.map((item, index) => (
                      <ListItem
                        key={index}
                        divider={index < cartItemsWithDetails.length - 1}
                        alignItems="flex-start"
                      >
                        {item.image && (
                          <Box
                            component="img"
                            src={
                              item.image ||
                              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
                            }
                            alt={item.productName || `מוצר #${index + 1}`}
                            sx={{
                              width: 60,
                              height: 60,
                              borderRadius: 1.5,
                              objectFit: "cover",
                              mr: 2,
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                              border: "1px solid rgba(22, 163, 74, 0.2)",
                            }}
                          />
                        )}
                        <ListItemText
                          primary={item.productName || `מוצר #${index + 1}`}
                          secondary={
                            <Box>
                              <Typography variant="body2">
                                כמות: {item.quantity || 1}
                              </Typography>
                              {item.category && (
                                <Typography variant="body2">
                                  קטגוריה: {item.category}
                                </Typography>
                              )}
                              {item.price !== undefined && (
                                <Typography variant="body2">
                                  מחיר: ₪{item.price.toFixed(2)}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="אין פריטים בעגלה זו" />
                    </ListItem>
                  )}
                </List>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
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
    </Box>
  );
};

export default PersonalArea;
