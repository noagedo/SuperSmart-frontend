import React, { useState, useEffect } from "react";
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
} from "@mui/material";
import { Heart, Plus } from "lucide-react";
import useWishlists from "../hooks/useWishlists";
import { Item } from "../services/item-service";
import useUsers from "../hooks/useUsers";
import { Link } from "react-router-dom";

interface WishButtonProps {
  product: Item;
}

const WishButton: React.FC<WishButtonProps> = ({ product }) => {
  const { user } = useUsers();
  const { wishlists, addProduct, createWishlist } = useWishlists();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);

  // Check if product is in any wishlist
  useEffect(() => {
    if (wishlists.length > 0 && product) {
      const exists = wishlists.some((wishlist) =>
        wishlist.products.some((item: any) => {
          // Handle both cases: when item is an object with _id or when item is the ID itself
          if (typeof item === "string") {
            return item === product._id;
          }
          return item._id === product._id;
        })
      );
      setIsInWishlist(exists);
    }
  }, [wishlists, product]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation(); // Prevent event from bubbling up to the ProductCard
    setAnchorEl(event.currentTarget);
  };

  // Update handleClose to match the Menu's onClose expected signature
  const handleClose = (
    event: {},
    reason?: "backdropClick" | "escapeKeyDown"
  ) => {
    // Only try to stop propagation if event has stopPropagation method
    if (event && typeof (event as any).stopPropagation === "function") {
      (event as React.MouseEvent).stopPropagation();
    }
    setAnchorEl(null);
  };

  // Other manual close action without event from Menu
  const closeMenu = () => {
    setAnchorEl(null);
  };

  const handleAddToWishlist = async (
    wishlistId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent click from bubbling up
    try {
      setIsSubmitting(true);
      await addProduct(wishlistId, product._id);
      setIsInWishlist(true); // Set heart to red after adding
      closeMenu(); // Use the simple close function instead
    } catch (error) {
      console.error("Failed to add to wishlist:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNewWishlist = async () => {
    if (!newWishlistName.trim()) return;

    try {
      setIsSubmitting(true);
      await createWishlist(newWishlistName);
      setNewWishlistName("");
      setOpenNewDialog(false);
      // The newly created wishlist should now be in the wishlists array
      // We can find it and add the product to it
      const newWishlist = wishlists.find((w) => w.name === newWishlistName);
      if (newWishlist) {
        await addProduct(newWishlist._id, product._id);
      }
    } catch (error) {
      console.error("Failed to create wishlist:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenNewDialog = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent click from bubbling up
    setOpenNewDialog(true);
  };

  if (!user) {
    // Return a button that links to sign in
    return (
      <IconButton
        component={Link}
        to="/sign-in"
        size="small"
        onClick={(e) => e.stopPropagation()} // Prevent click from bubbling up
        sx={{
          position: "absolute",
          top: 8,
          left: 8,
          bgcolor: "white",
          "&:hover": { bgcolor: "#f5f5f5", color: "primary.main" },
        }}
      >
        <Heart size={18} />
      </IconButton>
    );
  }

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{
          position: "absolute",
          top: 8,
          left: 8,
          bgcolor: "white",
          color: isInWishlist ? "error.main" : "inherit", // Red heart when in wishlist
          "&:hover": {
            bgcolor: "#f5f5f5",
            color: isInWishlist ? "error.main" : "primary.main",
          },
        }}
      >
        <Heart size={18} fill={isInWishlist ? "currentColor" : "none"} />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()} // Prevent any click in the menu from bubbling
        PaperProps={{
          sx: { width: 220, maxHeight: 300, overflowY: "auto" },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Add to wishlist
          </Typography>
        </Box>

        {wishlists.length === 0 ? (
          <MenuItem disabled>
            <ListItemText primary="No wishlists yet" />
          </MenuItem>
        ) : (
          wishlists.map((wishlist) => (
            <MenuItem
              key={wishlist._id}
              onClick={(e) => handleAddToWishlist(wishlist._id, e)}
              disabled={isSubmitting}
            >
              <ListItemIcon>
                <Heart size={18} />
              </ListItemIcon>
              <ListItemText primary={wishlist.name} />
            </MenuItem>
          ))
        )}

        <MenuItem onClick={handleOpenNewDialog}>
          <ListItemIcon>
            <Plus size={18} />
          </ListItemIcon>
          <ListItemText primary="Create new wishlist" />
        </MenuItem>
      </Menu>

      <Dialog
        open={openNewDialog}
        onClose={() => setOpenNewDialog(false)}
        onClick={(e) => e.stopPropagation()} // Prevent dialog clicks from bubbling
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
            onClick={(e) => e.stopPropagation()} // Prevent input field clicks from bubbling
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              setOpenNewDialog(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleCreateNewWishlist();
            }}
            color="primary"
            disabled={isSubmitting || !newWishlistName.trim()}
          >
            Create & Add
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default WishButton;
