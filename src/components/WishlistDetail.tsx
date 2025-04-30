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
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  ArrowLeft,
  Trash2,
  ShoppingCart,
  BarChart2,
  Store,
} from "lucide-react";
import { useParams, Link, useNavigate } from "react-router-dom";
import useWishlists from "../hooks/useWishlists";
import useItems from "../hooks/useItems";
import wishlistService from "../services/wishlist-service";
import useCart from "../hooks/useCart";
import { Item } from "../services/item-service";
import PriceChart from "./PriceChart";

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
  const [showChartForProduct, setShowChartForProduct] = useState<string | null>(
    null
  );
  const [showStoresForProduct, setShowStoresForProduct] = useState<
    string | null
  >(null);

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

  const getLatestPrice = (storePrice: any) => {
    if (!storePrice.prices || storePrice.prices.length === 0) return 0;

    const latestPrice = storePrice.prices.reduce((latest: any, current: any) =>
      new Date(current.date) > new Date(latest.date) ? current : latest
    );
    return latestPrice.price || 0;
  };

  const getProductPriceRange = (product: Item) => {
    if (!product.storePrices || product.storePrices.length === 0) {
      return { lowestPrice: 0, highestPrice: 0 };
    }

    const prices = product.storePrices.map(getLatestPrice);
    const lowestPrice = Math.min(...prices);
    const highestPrice = Math.max(...prices);

    return { lowestPrice, highestPrice };
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

  const getLatestStorePrice = (storePrice: any) => {
    if (!storePrice?.prices || storePrice.prices.length === 0) return null;

    const latestPrice = storePrice.prices.reduce((latest: any, current: any) =>
      new Date(current.date) > new Date(latest.date) ? current : latest
    );

    return {
      storeId: storePrice.storeId,
      price: latestPrice.price || 0,
      date: latestPrice.date,
    };
  };

  const getProductStorePrices = (product: Item) => {
    if (!product.storePrices || product.storePrices.length === 0) {
      return [];
    }

    // First map to get the store prices
    const storePrices = product.storePrices.map(getLatestStorePrice);

    // Then filter out null values with explicit type guard
    const validStorePrices = storePrices.filter(
      (price): price is { storeId: string; price: number; date: string } =>
        price !== null
    );

    // Sort the valid prices
    return validStorePrices.sort((a, b) => a.price - b.price);
  };

  const getStoreName = (storeId: string): string => {
    // This function should be expanded with actual store names
    const storeNames: Record<string, string> = {
      "65a4e1e1e1e1e1e1e1e1e1e1": "שופרסל",
      "65a4e1e1e1e1e1e1e1e1e1e2": "רמי לוי",
      // Add more stores as needed
    };
    return storeNames[storeId] || `חנות ${storeId.substring(0, 5)}`;
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
          {wishlistProducts.map((product) => {
            const { lowestPrice, highestPrice } = getProductPriceRange(product);
            return (
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
                    <IconButton
                      aria-label="הצג גרף מחירים"
                      onClick={() => setShowChartForProduct(product._id)}
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        zIndex: 10,
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                        "&:hover": {
                          backgroundColor: "primary.main",
                          color: "white",
                        },
                      }}
                    >
                      <BarChart2 size={16} />
                    </IconButton>

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
                    <Box
                      sx={{
                        mt: 1,
                        display: "inline-block",
                        backgroundColor: "rgba(22, 163, 74, 0.9)",
                        color: "white",
                        px: 1.5,
                        py: 0.75,
                        borderRadius: 1,
                        fontWeight: "bold",
                      }}
                    >
                      {lowestPrice === highestPrice
                        ? `₪${lowestPrice.toFixed(2)}`
                        : `₪${lowestPrice.toFixed(2)} - ₪${highestPrice.toFixed(
                            2
                          )}`}
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="outlined"
                      color="info"
                      startIcon={<Store size={16} />}
                      onClick={() => setShowStoresForProduct(product._id)}
                      sx={{ borderRadius: 2 }}
                    >
                      Store Prices
                    </Button>
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
            );
          })}
        </Grid>
      )}

      {/* Price Chart Dialog */}
      {showChartForProduct && (
        <PriceChart
          item={wishlistProducts.find((p) => p._id === showChartForProduct)!}
          open={!!showChartForProduct}
          onClose={() => setShowChartForProduct(null)}
        />
      )}

      {/* Store Prices Dialog */}
      <Dialog
        open={!!showStoresForProduct}
        onClose={() => setShowStoresForProduct(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Store Prices
          {showStoresForProduct && (
            <Typography variant="subtitle1" color="text.secondary">
              {
                wishlistProducts.find((p) => p._id === showStoresForProduct)
                  ?.name
              }
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {showStoresForProduct && (
            <List>
              {getProductStorePrices(
                wishlistProducts.find((p) => p._id === showStoresForProduct)!
              ).map((storePrice, index) => (
                <React.Fragment key={storePrice.storeId}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="body1">
                            {getStoreName(storePrice.storeId)}
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: "bold",
                              color:
                                index === 0 ? "success.main" : "text.primary",
                            }}
                          >
                            ₪{storePrice.price.toFixed(2)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          Last updated:{" "}
                          {new Date(storePrice.date).toLocaleDateString()}
                        </Typography>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))}
              {getProductStorePrices(
                wishlistProducts.find((p) => p._id === showStoresForProduct)!
              ).length === 0 && (
                <ListItem>
                  <ListItemText primary="No store prices available" />
                </ListItem>
              )}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default WishlistDetail;
