import React, { useState } from "react";
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

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAddToWishlist = async (wishlistId: string) => {
    try {
      setIsSubmitting(true);
      await addProduct(wishlistId, product._id);
      handleClose();
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

  if (!user) {
    // Return a button that links to sign in
    return (
      <IconButton
        component={Link}
        to="/sign-in"
        size="small"
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
          "&:hover": { bgcolor: "#f5f5f5", color: "primary.main" },
        }}
      >
        <Heart size={18} />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
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
              onClick={() => handleAddToWishlist(wishlist._id)}
              disabled={isSubmitting}
            >
              <ListItemIcon>
                <Heart size={18} />
              </ListItemIcon>
              <ListItemText primary={wishlist.name} />
            </MenuItem>
          ))
        )}

        <MenuItem onClick={() => setOpenNewDialog(true)}>
          <ListItemIcon>
            <Plus size={18} />
          </ListItemIcon>
          <ListItemText primary="Create new wishlist" />
        </MenuItem>
      </Menu>

      <Dialog open={openNewDialog} onClose={() => setOpenNewDialog(false)}>
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
          <Button onClick={() => setOpenNewDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateNewWishlist}
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
