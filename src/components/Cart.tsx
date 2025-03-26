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
  createTheme,
  ThemeProvider,
  styled
} from "@mui/material";
import { CartItem } from "../services/item-service";

const theme = createTheme({
  palette: {
    primary: {
      main: '#16a34a',
      light: '#22c55e',
      dark: '#15803d',
    },
  },
});

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  overflow: 'hidden',
}));

const CartItemContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backgroundColor: '#f8fafc',
  borderRadius: theme.spacing(1),
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
  },
}));

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
      <StyledCard>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <CartIcon 
            sx={{ 
              fontSize: 48, 
              color: 'primary.main',
              opacity: 0.6,
              mb: 2
            }} 
          />
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
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
        <Box sx={{ bgcolor: 'primary.main', p: 3, color: 'white' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Shopping Cart ({items.length} {items.length === 1 ? "item" : "items"})
          </Typography>
        </Box>

        <CardContent>
          <Box sx={{ mb: 3 }}>
            {items.map((item) => (
              <CartItemContainer key={item._id}>
                <CardMedia
                  component="img"
                  image={item.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"}
                  alt={item.name}
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    borderRadius: 1.5,
                    objectFit: "cover",
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {item.name}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 600 }}>
                      ₪{(item.selectedStorePrice.price * item.quantity).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Select
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item._id, Number(e.target.value))}
                      size="small"
                      sx={{
                        minWidth: 80,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                      }}
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
                      sx={{
                        '&:hover': {
                          backgroundColor: 'error.light',
                          color: 'white',
                        },
                      }}
                    >
                      Remove
                    </Button>
                  </Box>
                </Box>
              </CartItemContainer>
            ))}
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body1" color="text.secondary">
                Subtotal
              </Typography>
              <Typography variant="body1" color="text.secondary">
                ₪{total.toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body1" color="text.secondary">
                Shipping
              </Typography>
              <Typography variant="body1" sx={{ color: 'primary.main', fontWeight: 500 }}>
                Free
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Total
              </Typography>
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                ₪{total.toFixed(2)}
              </Typography>
            </Box>
          </Box>

          <Button 
            variant="contained" 
            fullWidth
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: 2,
              '&:hover': {
                bgcolor: 'primary.dark',
              },
              '&:active': {
                transform: 'scale(0.98)',
              },
            }}
          >
            Proceed to Checkout
          </Button>
        </CardContent>
      </StyledCard>
    </ThemeProvider>
  );
}