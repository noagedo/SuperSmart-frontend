import {
  Box,
  Typography,
  Button,
  Paper,
  createTheme,
  ThemeProvider,
  styled,
  Stack,
  IconButton,
} from "@mui/material";
import { ShoppingCart, BarChart2 } from "lucide-react";
import { useState } from "react";
import { Item, StorePrice } from "../services/item-service";
import PriceChart from "./PriceChart";

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

const ImageContainer = styled(Box)(({ theme }) => ({
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

  const getLatestPrice = (storePrice: StorePrice) => {
    const latestPrice = storePrice.prices.reduce((latest, current) =>
      new Date(current.date) > new Date(latest.date) ? current : latest
    );
    return latestPrice.price;
  };

  const prices = product.storePrices.map(getLatestPrice);
  const lowestPrice = Math.min(...prices);
  const highestPrice = Math.max(...prices);

  return (
    <ThemeProvider theme={theme}>
      <ProductContainer elevation={2}>
        <ImageContainer>
          <GraphButton
            aria-label="הצג גרף מחירים"
            onClick={() => setShowChart(true)}
            size="small"
          >
            <BarChart2 size={18} />
          </GraphButton>
          <Box
            component="img"
            src={
              product.image ||
              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
            }
            alt={product.name}
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
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
            onClick={() =>
              onAddToCart(product, { storeId: "", price: lowestPrice })
            }
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
