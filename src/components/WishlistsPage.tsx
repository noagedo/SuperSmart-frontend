import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  IconButton,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import { Heart, Plus, Trash2, ShoppingCart } from "lucide-react";
import useWishlists from "../hooks/useWishlists";
import useItems from "../hooks/useItems";
import { Link } from "react-router-dom";
import { BarChart2 } from "lucide-react";
import useCart from "../hooks/useCart";

const WishlistsPage: React.FC = () => {
  const { wishlist, isLoading, error, getOrCreateWishlist, removeProduct } =
    useWishlists();
  const { items } = useItems();
  const { addItem: addItemToCart } = useCart();

  const getProductName = (productId: string) => {
    const product = items?.find((item) => item._id === productId);
    return product ? product.name : "Product not found";
  };

  const getProductImage = (productId: string) => {
    const product = items?.find((item) => item._id === productId);
    return product?.image || "https://via.placeholder.com/80";
  };

  const getProductPrice = (productId: string) => {
    const product = items?.find((item) => item._id === productId);
    if (!product || !product.storePrices || product.storePrices.length === 0) {
      return "מחיר לא זמין";
    }

    // Find lowest price
    const prices = product.storePrices
      .flatMap((store) =>
        store.prices ? store.prices.map((p) => p.price) : []
      )
      .filter(Boolean) as number[];

    if (prices.length === 0) return "מחיר לא זמין";

    const lowestPrice = Math.min(...prices);
    return `₪${lowestPrice.toFixed(2)}`;
  };

  const handleAddToCart = (productId: string) => {
    const product = items?.find((item) => item._id === productId);
    if (!product) return;

    // Find the first store price
    const firstStorePrice =
      product.storePrices && product.storePrices.length > 0
        ? product.storePrices[0]
        : null;

    if (
      firstStorePrice &&
      firstStorePrice.prices &&
      firstStorePrice.prices.length > 0
    ) {
      const firstPrice = firstStorePrice.prices[0];
      addItemToCart({
        _id: product._id,
        name: product.name,
        category: product.category,
        storePrices: product.storePrices,
        quantity: 1,
        selectedStorePrice: {
          storeId: firstStorePrice.storeId,
          price: firstPrice.price ?? 0,
        },
        image: product.image,
      });
    }
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
            המועדפים שלי
          </Typography>
        </Box>

        {/* Price Drop Notification Alert */}
        <Paper
          elevation={1}
          sx={{
            m: 3,
            borderRadius: 2,
            bgcolor: "#f0fdf4",
            border: "1px solid #dcfce7",
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
                boxShadow: "none",
              }}
            >
              תקבלו התראות כאשר המחיר של מוצר ברשימת המועדפים יורד
            </Alert>
          </Box>
        </Paper>

        <Box sx={{ p: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {!wishlist || wishlist.products.length === 0 ? (
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
                אין לך מוצרים ברשימת המועדפים
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                עבור לדף המוצרים והוסף מוצרים לרשימת המועדפים
              </Typography>
              <Button
                component={Link}
                to="/products"
                variant="contained"
                sx={{
                  bgcolor: "#16a34a",
                  "&:hover": { bgcolor: "#15803d" },
                }}
              >
                עבור לדף המוצרים
              </Button>
            </Paper>
          ) : (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                {wishlist.products.length}{" "}
                {wishlist.products.length === 1 ? "מוצר" : "מוצרים"} ברשימת
                המועדפים
              </Typography>

              <Grid container spacing={2}>
                {wishlist.products.map((productId) => (
                  <Grid item xs={12} sm={6} md={4} key={productId}>
                    <Paper
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        transition:
                          "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        },
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                      }}
                    >
                      <Box sx={{ position: "relative", mb: 2 }}>
                        <img
                          src={getProductImage(productId)}
                          alt={getProductName(productId)}
                          style={{
                            width: "100%",
                            height: "120px",
                            objectFit: "contain",
                            borderRadius: "8px",
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => removeProduct(productId)}
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            bgcolor: "white",
                            "&:hover": {
                              bgcolor: "#ffebee",
                              color: "error.main",
                            },
                          }}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Box>

                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, mb: 1 }}
                      >
                        {getProductName(productId)}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          mb: 2,
                          color: "#16a34a",
                          fontWeight: 700,
                        }}
                      >
                        {getProductPrice(productId)}
                      </Typography>

                      <Box sx={{ mt: "auto" }}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<ShoppingCart size={16} />}
                          onClick={() => handleAddToCart(productId)}
                          sx={{
                            borderRadius: 2,
                            bgcolor: "#16a34a",
                            "&:hover": { bgcolor: "#15803d" },
                          }}
                        >
                          הוסף לעגלה
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default WishlistsPage;
