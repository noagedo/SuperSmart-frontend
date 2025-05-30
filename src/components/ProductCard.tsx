import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  createTheme,
  ThemeProvider,
  styled,
  IconButton,
} from "@mui/material";
import { ShoppingCart, BarChart2 } from "lucide-react";
import { Item, StorePrice } from "../services/item-service";
import PriceChart from "./PriceChart";
import { useNavigate } from "react-router-dom";
import WishButton from "./WishButton";


const theme = createTheme({
  palette: {
    primary: {
      main: "#16a34a",
      light: "#22c55e",
      dark: "#15803d",
    },
  },
});

const ProductContainer = styled(Paper)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  borderRadius: theme.spacing(2),
  overflow: "hidden",
  transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
  "&:hover": {
    transform: "translateY(-8px)",
    boxShadow:
      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  },
}));

const ImageContainer = styled(Box)(({}) => ({
  position: "relative",
  paddingTop: "75%",
  overflow: "hidden",
}));

const PriceTag = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  backgroundColor: "rgba(22, 163, 74, 0.9)",
  color: "white",
  padding: theme.spacing(1, 2),
  borderRadius: theme.spacing(1),
  fontWeight: "bold",
  backdropFilter: "blur(4px)",
}));

const GraphButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(1),
  right: theme.spacing(1),
  backgroundColor: "rgba(255, 255, 255, 0.9)",
  color: theme.palette.primary.main,
  zIndex: 10,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  "&:hover": {
    backgroundColor: theme.palette.primary.main,
    color: "white",
  },
}));

interface ProductCardProps {
  product: Item;
  onAddToCart: (
    product: Item,
    storePrice: { storeId: string; price: number }
  ) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [showChart, setShowChart] = useState(false);
  const navigate = useNavigate(); // Initialize the navigate function

  const getLatestPrice = (storePrice: StorePrice) => {
    const latestPrice = storePrice.prices.reduce((latest, current) => {
      // Get date from either 'date' or 'data' property with a fallback
      const latestDate = new Date(latest.date || latest.data || "1970-01-01");
      const currentDate = new Date(
        current.date || current.data || "1970-01-01"
      );

      return currentDate > latestDate ? current : latest;
    });

    // Make sure to convert price to number if it's a string
    return typeof latestPrice.price === "string"
      ? parseFloat(latestPrice.price)
      : latestPrice.price;
  };

  const prices = product.storePrices.map(getLatestPrice);
  const lowestPrice = Math.min(...prices);
  const highestPrice = Math.max(...prices);

  // Handler for navigating to the product details page
  const handleCardClick = () => {
    navigate(`/products/${product._id}`); // Ensure it's /products/:productId
  };

  // Prevent the card's click handler from being triggered when the button is clicked
  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from bubbling up to the card click handler
    onAddToCart(product, { storeId: "", price: lowestPrice });
  };

  // Handle the graph button click and prevent the event from propagating to the card
  const handleGraphButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from bubbling up to the card click handler
    setShowChart(true);
  };

  return (
    <ThemeProvider theme={theme}>
      <ProductContainer elevation={2} onClick={handleCardClick}>
        <ImageContainer>
          <GraphButton
            aria-label="הצג גרף מחירים"
            onClick={handleGraphButtonClick} // Use the new handler
            size="small"
          >
            <BarChart2 size={18} />
          </GraphButton>

          {/* Add WishButton component */}
          <WishButton product={product} />

          <Box
            component="img"
            src={
              product.image ||
              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
            }
            alt={product.name}
            sx={{
              position: "absolute",
              top: 2,
              left: 60,
              width: "250px",
              height: "200px",
              transition: "transform 0.3s ease-in-out",
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          />
          <PriceTag>
            {lowestPrice === highestPrice
              ? `₪${lowestPrice.toFixed(2)}`
              : `₪${lowestPrice.toFixed(2)} - ₪${highestPrice.toFixed(2)}`}
          </PriceTag>
        </ImageContainer>

        <Box sx={{ p: 3, flexGrow: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {product.name}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              mb: 2,
            }}
          >
            {product.category}
          </Typography>

          <Button
            variant="contained"
            fullWidth
            startIcon={<ShoppingCart size={18} />}
            onClick={handleAddToCartClick} // Ensure event propagation is stopped here
            sx={{
              bgcolor: "primary.main",
              color: "white",
              py: 1.5,
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              "&:hover": {
                bgcolor: "primary.dark",
                transform: "scale(1.02)",
              },
              "&:active": {
                transform: "scale(0.98)",
              },
            }}
          >
            הוסף לעגלה
          </Button>
        </Box>
      </ProductContainer>

      <PriceChart
        item={product}
        open={showChart}
        onClose={() => setShowChart(false)}
      />
    </ThemeProvider>
  );
}

export default ProductCard;
