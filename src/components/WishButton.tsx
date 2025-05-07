import React, { useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import { Heart } from "lucide-react";
import useWishlists from "../hooks/useWishlists";
import { Item } from "../services/item-service";
import useUsers from "../hooks/useUsers";
import { Link } from "react-router-dom";

interface WishButtonProps {
  product: Item;
}

const WishButton: React.FC<WishButtonProps> = ({ product }) => {
  const { user } = useUsers();
  const { addProduct, removeProduct, isProductInWishlist } = useWishlists();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isInWishlist = isProductInWishlist(product._id);

  const handleToggleWishlist = async (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent click from bubbling up

    if (!user) return; // User should be logged in

    try {
      setIsSubmitting(true);

      if (isInWishlist) {
        // Remove from wishlist
        await removeProduct(product._id);
      } else {
        // Add to wishlist
        await addProduct(product._id);
      }
    } catch (error) {
      console.error("Failed to update wishlist:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    // Return a button that links to sign in
    return (
      <Tooltip title="התחבר כדי להוסיף למועדפים">
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
      </Tooltip>
    );
  }

  return (
    <Tooltip title={isInWishlist ? "הסר מהמועדפים" : "הוסף למועדפים"}>
      <IconButton
        onClick={handleToggleWishlist}
        size="small"
        disabled={isSubmitting}
        sx={{
          position: "absolute",
          top: 8,
          left: 8,
          bgcolor: "white",
          color: isInWishlist ? "error.main" : "inherit",
          "&:hover": {
            bgcolor: "#f5f5f5",
            color: isInWishlist ? "error.main" : "primary.main",
          },
        }}
      >
        <Heart size={18} fill={isInWishlist ? "currentColor" : "none"} />
      </IconButton>
    </Tooltip>
  );
};

export default WishButton;
