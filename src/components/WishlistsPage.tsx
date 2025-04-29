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
import { Heart, Plus, Trash2, Edit } from "lucide-react";
import useWishlists from "../hooks/useWishlists";
import useItems from "../hooks/useItems";
import { Link } from "react-router-dom";

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
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          backgroundColor: "primary.light",
          p: 3,
          borderRadius: 2,
          color: "white",
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          My Wishlists
        </Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Plus size={18} />}
          onClick={() => setOpenNewWishlistDialog(true)}
          sx={{
            bgcolor: "white",
            color: "primary.main",
            "&:hover": { bgcolor: "#f0f0f0" },
          }}
        >
          New Wishlist
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
          <Heart size={60} color="#d1d5db" style={{ margin: "0 auto 20px" }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            You don't have any wishlists yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Create your first wishlist to start saving products you love
          </Typography>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => setOpenNewWishlistDialog(true)}
          >
            Create Wishlist
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
                  <Typography variant="h6">{wishlist.name}</Typography>
                  <Box>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => openEditDialog(wishlist)}
                      sx={{ mr: 1 }}
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
                  {wishlist.products.length === 1 ? "product" : "products"}
                </Typography>

                <List dense sx={{ maxHeight: 200, overflow: "auto" }}>
                  {wishlist.products.length > 0 ? (
                    wishlist.products.map((productId) => (
                      <ListItem key={productId} disablePadding>
                        <ListItemText primary={getProductName(productId)} />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText
                        primary="No products added yet"
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
                      sx={{ borderRadius: 2 }}
                    >
                      View Details
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* New Wishlist Dialog */}
      <Dialog
        open={openNewWishlistDialog}
        onClose={() => setOpenNewWishlistDialog(false)}
      >
        <DialogTitle>Create New Wishlist</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Wishlist Name"
            type="text"
            fullWidth
            value={newWishlistName}
            onChange={(e) => setNewWishlistName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewWishlistDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateWishlist} color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Wishlist Dialog */}
      <Dialog
        open={openEditWishlistDialog}
        onClose={() => setOpenEditWishlistDialog(false)}
      >
        <DialogTitle>Edit Wishlist</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Wishlist Name"
            type="text"
            fullWidth
            value={editWishlistName}
            onChange={(e) => setEditWishlistName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditWishlistDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleEditWishlist} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default WishlistsPage;
