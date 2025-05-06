import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Container,
  CircularProgress,
  Alert,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import { Heart, Plus, Trash2, Edit, Apple } from "lucide-react";
import useWishlists from "../hooks/useWishlists";
import useItems from "../hooks/useItems";
import { Link } from "react-router-dom";

import { BarChart2 } from "lucide-react";
const WishlistsPage: React.FC = () => {
  const {
    wishlists,
    isLoading,
    error,
    createWishlist,
    deleteWishlist,
    updateWishlist,
  } = useWishlists();
  const { items } = useItems();
  const [openNewWishlistDialog, setOpenNewWishlistDialog] = useState(false);
  const [openEditWishlistDialog, setOpenEditWishlistDialog] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState("");
  const [selectedWishlist, setSelectedWishlist] = useState<string | null>(null);
  const [editWishlistName, setEditWishlistName] = useState("");

  const handleCreateWishlist = async () => {
    if (!newWishlistName.trim()) return;

    try {
      await createWishlist(newWishlistName);
      setNewWishlistName("");
      setOpenNewWishlistDialog(false);
    } catch (err) {
      console.error("Failed to create wishlist", err);
    }
  };

  const handleEditWishlist = async () => {
    if (!editWishlistName.trim() || !selectedWishlist) return;

    const wishlist = wishlists.find((w) => w._id === selectedWishlist);
    if (!wishlist) return;

    try {
      await updateWishlist({ ...wishlist, name: editWishlistName });
      setEditWishlistName("");
      setSelectedWishlist(null);
      setOpenEditWishlistDialog(false);
    } catch (err) {
      console.error("Failed to update wishlist", err);
    }
  };

  const handleDeleteWishlist = async (id: string) => {
    try {
      await deleteWishlist(id);
    } catch (err) {
      console.error("Failed to delete wishlist", err);
    }
  };

  const openEditDialog = (wishlist: { _id: string; name: string }) => {
    setSelectedWishlist(wishlist._id);
    setEditWishlistName(wishlist.name);
    setOpenEditWishlistDialog(true);
  };

  const getProductName = (productId: string) => {
    const product = items?.find((item) => item._id === productId);
    return product ? product.name : "Product not found";
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "70vh",
        }}
      >
        <CircularProgress color="primary" sx={{ color: "#16a34a" }} />
      </Box>
    );
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
          <Heart size={32} color="white" />
          <Typography variant="h5" sx={{ color: "white", fontWeight: 700 }}>
            הרשימות שלי
          </Typography>
        </Box>
{/* Price Drop Notification Alert */}
<Paper 
  elevation={1}
  sx={{ 
    mb: 3, 
    borderRadius: 2,
    bgcolor: "#f0fdf4",
    border: "1px solid #dcfce7"
  }}
>
  <Box sx={{ p: 2 }}>
    <Alert 
      severity="info" 
      icon={<BarChart2 size={24} color="#16a34a" />}
      sx={{ 
        bgcolor: "transparent", 
        color: "#16a34a", 
        "& .MuiAlert-message": { fontWeight: 500 },
        border: "none",
        boxShadow: "none"
      }}
    >
      עבור פריטים שברשימת המועדפים תקבלו התראות כאשר המחיר יורד
    </Alert>
  </Box>
</Paper>
        <Box sx={{ p: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mb: 3,
            }}
          >
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={() => setOpenNewWishlistDialog(true)}
              sx={{
                bgcolor: "#16a34a",
                "&:hover": { bgcolor: "#15803d" },
              }}
            >
              רשימה חדשה
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {wishlists.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: "center",
                bgcolor: "#f8fafc",
                borderRadius: 3,
              }}
            >
              <Heart
                size={60}
                color="#d1d5db"
                style={{ margin: "0 auto 20px" }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                אין לך רשימות שמורות עדיין
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                 צור את הרשימה הראשונה שלך כדי להתחיל לשמור מוצרים שאתה אוהב
              </Typography>
              <Button
                variant="contained"
                startIcon={<Plus size={18} />}
                onClick={() => setOpenNewWishlistDialog(true)}
                sx={{
                  bgcolor: "#16a34a",
                  "&:hover": { bgcolor: "#15803d" },
                }}
              >
                צור רשימה
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {wishlists.map((wishlist) => (
                <Grid item xs={12} md={6} key={wishlist._id}>
                  <Paper
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      position: "relative",
                      transition:
                        "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      },
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
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
                        sx={{
                          fontWeight: 600,
                          color: "#16a34a",
                        }}
                      >
                        {wishlist.name}
                      </Typography>
                      <Box>
                        <IconButton
                          size="small"
                          sx={{
                            color: "#16a34a",
                            mr: 1,
                          }}
                          onClick={() => openEditDialog(wishlist)}
                        >
                          <Edit size={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteWishlist(wishlist._id)}
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </Box>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {wishlist.products.length}{" "}
                      {wishlist.products.length === 1 ? "מוצר" : "מוצרים"}
                    </Typography>

                    <List
                      dense
                      sx={{ maxHeight: 200, overflow: "auto", flexGrow: 1 }}
                    >
                      {wishlist.products.length > 0 ? (
                        wishlist.products.map((productId) => (
                          <ListItem key={productId} disablePadding>
                            <ListItemText primary={getProductName(productId)} />
                          </ListItem>
                        ))
                      ) : (
                        <ListItem>
                          <ListItemText
                            primary="אין מוצרים ברשימה זו"
                            primaryTypographyProps={{
                              color: "text.secondary",
                              fontSize: "0.875rem",
                            }}
                          />
                        </ListItem>
                      )}
                    </List>

                    {wishlist.products.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          component={Link}
                          to={`/wishlists/${wishlist._id}`}
                          variant="outlined"
                          size="small"
                          sx={{
                            borderRadius: 2,
                            color: "#16a34a",
                            borderColor: "#16a34a",
                            "&:hover": {
                              borderColor: "#15803d",
                              bgcolor: "rgba(22, 163, 74, 0.04)",
                            },
                          }}
                        >
                          צפה בפרטים
                        </Button>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Paper>

      {/* New Wishlist Dialog */}
      <Dialog
        open={openNewWishlistDialog}
        onClose={() => setOpenNewWishlistDialog(false)}
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
          <Plus size={24} />
          יצירת רשימה חדשה
        </DialogTitle>
        <DialogContent sx={{ pt: 2, mt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="שם הרשימה"
            type="text"
            fullWidth
            value={newWishlistName}
            onChange={(e) => setNewWishlistName(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                "&.Mui-focused fieldset": { borderColor: "#16a34a" },
              },
              "& .MuiInputLabel-root.Mui-focused": { color: "#16a34a" },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenNewWishlistDialog(false)}
            sx={{ color: "text.secondary" }}
          >
            ביטול
          </Button>
          <Button
            onClick={handleCreateWishlist}
            sx={{
              bgcolor: "#16a34a",
              color: "white",
              "&:hover": { bgcolor: "#15803d" },
            }}
          >
            צור
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Wishlist Dialog */}
      <Dialog
        open={openEditWishlistDialog}
        onClose={() => setOpenEditWishlistDialog(false)}
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
          <Edit size={24} />
          עריכת רשימה
        </DialogTitle>
        <DialogContent sx={{ pt: 2, mt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="שם הרשימה"
            type="text"
            fullWidth
            value={editWishlistName}
            onChange={(e) => setEditWishlistName(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                "&.Mui-focused fieldset": { borderColor: "#16a34a" },
              },
              "& .MuiInputLabel-root.Mui-focused": { color: "#16a34a" },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenEditWishlistDialog(false)}
            sx={{ color: "text.secondary" }}
          >
            ביטול
          </Button>
          <Button
            onClick={handleEditWishlist}
            sx={{
              bgcolor: "#16a34a",
              color: "white",
              "&:hover": { bgcolor: "#15803d" },
            }}
          >
            שמור
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WishlistsPage;
