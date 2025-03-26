import { Card, CardMedia, CardContent, Typography, Button, Box } from "@mui/material";
import { ShoppingCart } from "lucide-react";
import { Item, StorePrice } from "../services/item-service";

interface ProductCardProps {
  product: Item;
  onAddToCart: (product: Item, storePrice: { storeId: string; price: number }) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
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
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <CardMedia
        component="img"
        height="200"
        width="100"
        image={product.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"}
        alt={product.name}
        
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="div" gutterBottom>
          {product.name}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {product.category}
        </Typography>
        <Box mt={2}>
          <Typography variant="h5" color="textPrimary" fontWeight="bold">
            {lowestPrice === highestPrice
              ? `${lowestPrice} ₪`
              : `${lowestPrice} - ${highestPrice} ₪`}
          </Typography>
        </Box>
      </CardContent>
      <Box p={2}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          startIcon={<ShoppingCart size={18} />}
          onClick={() => onAddToCart(product, { storeId: "", price: lowestPrice })}
        >
          Add to Cart
        </Button>
      </Box>
    </Card>
  );
}