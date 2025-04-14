import { useEffect, useState } from "react";
import {
  ShoppingCart as CartIcon,
  Delete as TrashIcon,
} from "@mui/icons-material";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Select,
  MenuItem,
  Divider,
  createTheme,
  ThemeProvider,
  styled,
} from "@mui/material";
import cartService from "../services/personalCartService";

const theme = createTheme({
  palette: {
    primary: {
      main: "#16a34a",
      light: "#22c55e",
      dark: "#15803d",
    },
  },
});

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
  overflow: "hidden",
}));

const CartItemContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backgroundColor: "#f8fafc",
  borderRadius: theme.spacing(1),
  transition: "transform 0.2s ease-in-out",
  "&:hover": {
    transform: "translateY(-2px)",
  },
}));

export function Cart() {
  const [items, setItems] = useState<any[]>([]);

  const fetchCart = async () => {
    try {
      const cartItems = await cartService.getPersonalCart();
      setItems(cartItems);
    } catch (err) {
      console.error("Failed to fetch cart items:", err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    await cartService.addItemToPersonalCart(itemId, quantity);
    fetchCart();
  };

  const handleRemoveItem = async (itemId: string) => {
    await cartService.removeItemFromPersonalCart(itemId);
    fetchCart();
  };

  if (items.length === 0) {
    return (
      <StyledCard>
        <CardContent sx={{ textAlign: "center", py: 6 }}>
          <CartIcon sx={{ fontSize: 48, color: "primary.main", opacity: 0.6, mb: 2 }} />
          <Typography variant="h6" sx={{ color: "primary.main", fontWeight: 600 }}>
            Your cart is empty
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Start adding some products!
          </Typography>
        </CardContent>
      </StyledCard>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <StyledCard>
        <Box sx={{ bgcolor: "primary.main", p: 3, color: "white" }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Personal Cart ({items.length} {items.length === 1 ? "item" : "items"})
          </Typography>
        </Box>

        <CardContent>
          <Box sx={{ mb: 3 }}>
            {items.map((item) => (
              <CartItemContainer key={item.itemId}>
                <CardMedia
                  component="img"
                  image={item.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"}
                  alt={item.name}
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 1.5,
                    objectFit: "cover",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {item.name || item.itemId}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Quantity: {item.quantity}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Select
                      value={item.quantity}
                      onChange={(e) => handleUpdateQuantity(item.itemId, Number(e.target.value))}
                      size="small"
                      sx={{ minWidth: 80, "& .MuiOutlinedInput-notchedOutline": { borderColor: "primary.main" } }}
                    >
                      {[1, 2, 3, 4, 5].map((num) => (
                        <MenuItem key={num} value={num}>{num}</MenuItem>
                      ))}
                    </Select>
                    <Button
                      onClick={() => handleRemoveItem(item.itemId)}
                      color="error"
                      startIcon={<TrashIcon />}
                      size="small"
                      sx={{ "&:hover": { backgroundColor: "error.light", color: "white" } }}
                    >
                      Remove
                    </Button>
                  </Box>
                </Box>
              </CartItemContainer>
            ))}
          </Box>

          <Divider sx={{ my: 3 }} />
        </CardContent>
      </StyledCard>
    </ThemeProvider>
  );
}
