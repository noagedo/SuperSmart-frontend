import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Container,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  IconButton,
  Breadcrumbs,
  Divider,
} from "@mui/material";
import { ArrowLeft, Trash2, ShoppingCart } from "lucide-react";
import { useParams, Link, useNavigate } from "react-router-dom";
import useWishlists from "../hooks/useWishlists";
import useItems from "../hooks/useItems";
import wishlistService from "../services/wishlist-service";
import useCart from "../hooks/useCart";
import { Item } from "../services/item-service";

const WishlistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { wishlists, isLoading, error, removeProduct, deleteWishlist } =
    useWishlists();
  const { items } = useItems();
  const { addItem: addItemToCart } = useCart();
  const [wishlist, setWishlist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [wishlistProducts, setWishlistProducts] = useState<Item[]>([]);

  useEffect(() => {
    const loadWishlist = async () => {
      if (!id) return;

      try {
        setLoading(true);
        // First try to find it in the existing wishlists
        const existingWishlist = wishlists.find((w) => w._id === id);

        if (existingWishlist) {
          setWishlist(existingWishlist);
        } else {
          // If not found, fetch it directly
          const { request } = wishlistService.get(id);
          const response = await request;
          setWishlist(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch wishlist", err);
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, [id, wishlists]);

  useEffect(() => {
    if (wishlist && items) {
      const products = wishlist.products
        .map((productId: string) =>
          items.find((item) => item._id === productId)
        )
        .filter(Boolean); // Remove undefined items
      setWishlistProducts(products);
    }
  }, [wishlist, items]);

  const handleRemoveProduct = async (productId: string) => {
    if (!id) return;

    try {
      await removeProduct(id, productId);
      // Update local state to reflect the change
      setWishlistProducts(wishlistProducts.filter((p) => p._id !== productId));
      if (wishlist) {
        setWishlist({
          ...wishlist,
          products: wishlist.products.filter(
            (pid: string) => pid !== productId
          ),
        });
      }
    } catch (err) {
      console.error("Failed to remove product", err);
    }
  };

  const handleDeleteWishlist = async () => {
    if (!id) return;

    try {
      await deleteWishlist(id);
      navigate("/wishlists");
    } catch (err) {
      console.error("Failed to delete wishlist", err);
    }
  };

  const handleAddToCart = (product: Item) => {
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

  if (loading || isLoading) {
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

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!wishlist) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">Wishlist not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          to="/wishlists"
          style={{
            textDecoration: "none",
            color: "inherit",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ArrowLeft size={16} style={{ marginRight: 4 }} />
          All Wishlists
        </Link>
        <Typography color="text.primary">{wishlist.name}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          bgcolor: "primary.light",
          p: 3,
          borderRadius: 2,
          color: "white",
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            {wishlist.name}
          </Typography>
          <Typography variant="body1" sx={{ mt: 1, opacity: 0.9 }}>
            {wishlist.products.length}{" "}
            {wishlist.products.length === 1 ? "product" : "products"}
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="error"
          startIcon={<Trash2 size={16} />}
          onClick={handleDeleteWishlist}
          sx={{
            bgcolor: "rgba(255, 255, 255, 0.2)",
            color: "white",
            "&:hover": { bgcolor: "rgba(255, 255, 255, 0.3)" },
          }}
        >
          Delete Wishlist
        </Button>
      </Box>

      {/* Products */}
      {wishlistProducts.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: "center",
            bgcolor: "#f8fafc",
            borderRadius: 3,
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            This wishlist is empty
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Browse products and add them to this wishlist
          </Typography>
          <Button component={Link} to="/products" variant="contained">
            Browse Products
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {wishlistProducts.map((product) => (
            <Grid item xs={12} key={product._id}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 2,
                    overflow: "hidden",
                    flexShrink: 0,
                    mr: 3,
                    position: "relative",
                  }}
                >
                  <img
                    src={product.image || "https://via.placeholder.com/80"}
                    alt={product.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Box>

                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ mb: 0.5 }}>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {product.category}
                  </Typography>
                  {product.storePrices && product.storePrices.length > 0 && (
                    <Typography variant="body1" sx={{ mt: 1, fontWeight: 600 }}>
                      ₪
                      {product.storePrices[0]?.prices[0]?.price?.toFixed(2) ||
                        "0.00"}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<ShoppingCart size={16} />}
                    onClick={() => handleAddToCart(product)}
                    sx={{ borderRadius: 2 }}
                  >
                    Add to Cart
                  </Button>
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveProduct(product._id)}
                    sx={{
                      border: "1px solid rgba(239, 68, 68, 0.5)",
                      borderRadius: 2,
                    }}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default WishlistDetail;
