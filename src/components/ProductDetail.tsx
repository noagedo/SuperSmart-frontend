import React, { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  Button,
  Paper,
  Breadcrumbs,
  CircularProgress,
  Alert,
  IconButton,
} from "@mui/material";
import {
  ShoppingCart,
  ArrowLeft,
  Box as BoxIcon,
  BarChart2,
  Tag,
} from "lucide-react";
import useItems from "../hooks/useItems";
import ProductCard from "./ProductCard";
import useCart from "../hooks/useCart";
import WishButton from "./WishButton";
import PriceChart from "./PriceChart";
import { Item } from "../services/item-service";

const ProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { items, isLoading } = useItems();
  const { addItem: addItemToCart } = useCart();
  const [showChart, setShowChart] = React.useState(false);

  const product = useMemo(
    () => items.find((item) => item._id === productId),
    [items, productId]
  );

  const cheaperProducts = useMemo(() => {
    if (!product) return [];
    const productPrice = Math.min(
      ...product.storePrices.flatMap((store) =>
        store.prices.map((p) => p.price)
      )
    );

    return items.filter((item) => {
      if (item._id === product._id || item.category !== product.category)
        return false;
      const itemPrice = Math.min(
        ...item.storePrices.flatMap((store) => store.prices.map((p) => p.price))
      );
      return itemPrice < productPrice;
    });
  }, [product, items]);

  const handleAddToCart = () => {
    if (!product) return;

    // Find the store with the lowest price
    const prices = product.storePrices.flatMap((store) =>
      store.prices.map((p) => ({ storeId: store.storeId, price: p.price }))
    );
    const lowestPriceOption = prices.reduce(
      (min, current) => (current.price < min.price ? current : min),
      prices[0]
    );

    addItemToCart({
      _id: product._id,
      name: product.name,
      category: product.category,
      storePrices: product.storePrices,
      quantity: 1,
      selectedStorePrice: lowestPriceOption,
      image: product.image,
    });
  };

  // Create a wrapper function that matches ProductCard's expected signature
  const handleAddToCartFromCard = (
    product: Item,
    storePrice: { storeId: string; price: number }
  ) => {
    addItemToCart({
      _id: product._id,
      name: product.name,
      category: product.category,
      storePrices: product.storePrices,
      quantity: 1,
      selectedStorePrice: storePrice,
      image: product.image,
    });
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
        <CircularProgress sx={{ color: "#16a34a" }} />
      </Box>
    );
  }

  if (!product) {
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
            <BoxIcon size={32} color="white" />
            <Typography variant="h5" sx={{ color: "white", fontWeight: 700 }}>
              פרטי מוצר
            </Typography>
          </Box>
          <Box sx={{ p: 4 }}>
            <Alert severity="error">המוצר לא נמצא</Alert>
          </Box>
        </Paper>
      </Box>
    );
  }

  const lowestPrice = Math.min(
    ...product.storePrices.flatMap((store) => store.prices.map((p) => p.price))
  );

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
          maxWidth: 1200,
          mx: "auto",
          borderRadius: 3,
          overflow: "hidden",
          mb: 4,
        }}
      >
        {/* Breadcrumbs */}
        <Box sx={{ p: 2, bgcolor: "#f9fafb" }}>
          <Breadcrumbs>
            <Link
              to="/products"
              style={{
                textDecoration: "none",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ArrowLeft size={16} style={{ marginRight: 4 }} />
              כל המוצרים
            </Link>
            <Typography color="text.primary">{product.name}</Typography>
          </Breadcrumbs>
        </Box>

        {/* Header */}
        <Box
          sx={{
            bgcolor: "#16a34a",
            p: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <BoxIcon size={32} color="white" />
            <Box>
              <Typography variant="h5" sx={{ color: "white", fontWeight: 700 }}>
                {product.name}
              </Typography>
              <Typography variant="body2" sx={{ color: "white", opacity: 0.9 }}>
                קטגוריה: {product.category}
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            startIcon={<ShoppingCart size={18} />}
            onClick={handleAddToCart}
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.2)",
              color: "white",
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.3)" },
            }}
          >
            הוסף לעגלה
          </Button>
        </Box>

        {/* Product Details */}
        <Box sx={{ p: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={5}>
              <Paper
                elevation={2}
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  position: "relative",
                  height: "100%",
                }}
              >
                <IconButton
                  aria-label="הצג גרף מחירים"
                  onClick={() => setShowChart(true)}
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    zIndex: 10,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    "&:hover": {
                      backgroundColor: "#16a34a",
                      color: "white",
                    },
                  }}
                >
                  <BarChart2 size={18} />
                </IconButton>

                <Box sx={{ position: "relative" }}>
                  <WishButton product={product} />
                  <CardMedia
                    component="img"
                    image={product.image || "https://via.placeholder.com/400"}
                    alt={product.name}
                    sx={{
                      height: 400,
                      objectFit: "contain",
                      p: 2,
                      bgcolor: "#ffffff",
                    }}
                  />
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={7}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  height: "100%",
                }}
              >
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{
                    color: "#16a34a",
                    fontWeight: 600,
                    mb: 2,
                  }}
                >
                  {product.name}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 2,
                    p: 1,
                    bgcolor: "#f0fdf4",
                    borderRadius: 1,
                    width: "fit-content",
                  }}
                >
                  <Tag size={18} color="#16a34a" style={{ marginRight: 8 }} />
                  <Typography variant="subtitle1" sx={{ color: "#16a34a" }}>
                    קטגוריה: {product.category}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    mt: 3,
                    mb: 4,
                    display: "inline-block",
                    bgcolor: "#16a34a",
                    color: "white",
                    py: 1.5,
                    px: 3,
                    borderRadius: 2,
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                    ₪{lowestPrice.toFixed(2)}
                  </Typography>
                </Box>

                <Box sx={{ mt: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<ShoppingCart size={20} />}
                    onClick={handleAddToCart}
                    sx={{
                      bgcolor: "#16a34a",
                      py: 1.5,
                      px: 4,
                      borderRadius: 2,
                      "&:hover": { bgcolor: "#15803d" },
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    הוסף לעגלה
                  </Button>

                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => setShowChart(true)}
                    sx={{
                      ml: 2,
                      py: 1.5,
                      px: 4,
                      borderRadius: 2,
                      borderColor: "#16a34a",
                      color: "#16a34a",
                      "&:hover": {
                        borderColor: "#15803d",
                        bgcolor: "rgba(22, 163, 74, 0.04)",
                      },
                    }}
                  >
                    השוואת מחירים
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Cheaper Products Section */}
          <Box sx={{ mt: 6 }}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 2,
                mb: 2,
                bgcolor: "#16a34a",
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  color: "white",
                }}
              >
                מוצרים זולים יותר באותה קטגוריה
              </Typography>
            </Paper>

            {cheaperProducts.length === 0 ? (
              <Paper
                elevation={1}
                sx={{
                  p: 4,
                  textAlign: "center",
                  bgcolor: "#f8fafc",
                  borderRadius: 3,
                }}
              >
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  אין מוצרים זולים יותר בקטגוריה זו
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                {cheaperProducts.map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item._id}>
                    <ProductCard
                      product={item}
                      onAddToCart={handleAddToCartFromCard}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Price Chart Dialog */}
      {product && (
        <PriceChart
          item={product}
          open={showChart}
          onClose={() => setShowChart(false)}
        />
      )}
    </Box>
  );
};

export default ProductDetails;
