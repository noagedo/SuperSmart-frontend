import { ShoppingCart as CartIcon, Delete as TrashIcon } from "@mui/icons-material";
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
} from "@mui/material";
import { CartItem } from "../services/item-service";

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
}

export function Cart({ items, onUpdateQuantity, onRemoveItem }: CartProps) {
  const total = items.reduce(
    (sum, item) => sum + item.selectedStorePrice.price * item.quantity,
    0
  );

  if (items.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <CartIcon fontSize="large" color="disabled" />
            <Typography variant="h6" color="textSecondary">
              Your cart is empty
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Start adding some products!
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Shopping Cart
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {items.length} {items.length === 1 ? "item" : "items"}
        </Typography>

        <Divider sx={{ my: 2 }} />

        {items.map((item) => (
          <Box key={item._id} display="flex" alignItems="center" gap={2} mb={2}>
            <CardMedia
              component="img"
              image={
                item.image ||
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
              }
              alt={item.name}
              sx={{ width: 80, height: 80, borderRadius: 1, objectFit: "cover" }}
            />
            <Box flex={1}>
              <Typography variant="subtitle1" fontWeight="bold" noWrap>
                {item.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                ₪{item.selectedStorePrice.price.toFixed(2)}
              </Typography>
              <Box display="flex" alignItems="center" gap={2} mt={1}>
                <Select
                  value={item.quantity}
                  onChange={(e) => onUpdateQuantity(item._id, Number(e.target.value))}
                  size="small"
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <MenuItem key={num} value={num}>
                      {num}
                    </MenuItem>
                  ))}
                </Select>
                <Button
                  onClick={() => onRemoveItem(item._id)}
                  color="error"
                  startIcon={<TrashIcon />}
                  size="small"
                >
                  Remove
                </Button>
              </Box>
            </Box>
          </Box>
        ))}

        <Divider sx={{ my: 2 }} />

        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="body2" color="textSecondary">
            Subtotal
          </Typography>
          <Typography variant="body2" color="textSecondary">
            ₪{total.toFixed(2)}
          </Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="body2" color="textSecondary">
            Shipping
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Free
          </Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" fontWeight="bold" mb={2}>
          <Typography variant="h6">Total</Typography>
          <Typography variant="h6">₪{total.toFixed(2)}</Typography>
        </Box>

        <Button variant="contained" color="primary" fullWidth>
          Proceed to Checkout
        </Button>
      </CardContent>
    </Card>
  );
}