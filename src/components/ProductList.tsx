import { useState, useMemo, useEffect } from "react";
import {
  Container,
  Grid,
  TextField,
  Typography,
  Badge,
  Box,
  Paper,
  InputAdornment,
  createTheme,
  ThemeProvider,
  styled,
} from "@mui/material";
import { ShoppingBag, Search, Apple } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { Cart } from "./Cart";
import { Item, CartItem } from "../services/item-service";
import useItems from "../hooks/useItems";
import useUsers from "../hooks/useUsers";
import cartService from "../services/cart-service";

const theme = createTheme({
  palette: {
    primary: {
      main: "#16a34a",
      light: "#22c55e",
      dark: "#15803d",
    },
  },
});

const SearchInput = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    backgroundColor: "white",
    borderRadius: theme.spacing(2),
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      backgroundColor: "#f8fafc",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    },
    "&.Mui-focused": {
      backgroundColor: "#f8fafc",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
      "& fieldset": {
        borderColor: theme.palette.primary.main,
      },
    },
  },
}));

const CategorySelect = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    backgroundColor: "white",
    borderRadius: theme.spacing(2),
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.main,
    },
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: theme.palette.primary.main,
  },
}));

function ProductList() {
  const { items, isLoading, error } = useItems();
  const { user } = useUsers();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  // Load cart items from localStorage on component mount
  useEffect(() => {
    const savedCartItems = localStorage.getItem("cartItems");
    if (savedCartItems) {
      try {
        const parsedItems: CartItem[] = JSON.parse(savedCartItems);
        if (parsedItems.length > 0) {
          setCartItems(parsedItems);
          setShowCart(true); // Show cart when items exist in localStorage
          console.log("Loaded cart items from localStorage:", parsedItems);
        }
      } catch (error) {
        console.error("Failed to parse cart items from localStorage:", error);
        localStorage.removeItem("cartItems"); // Clear invalid data
      }
    }
  }, []);

  // Save cart items to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("cartItems", JSON.stringify(cartItems));
      console.log(
        "Updated localStorage:",
        JSON.parse(localStorage.getItem("cartItems") || "[]")
      );
    } catch (error) {
      console.error("Failed to save cart items to localStorage:", error);
    }
  }, [cartItems]);

  // Sync cart with server when cart items change (if user is logged in)
  useEffect(() => {
    if (user && user._id && cartItems.length > 0) {
      // Debounce the sync to avoid too many requests
      const timeoutId = setTimeout(() => {
        cartService
          .syncCart(user._id!, cartItems)
          .then((success) => {
            if (!success) {
              console.warn("Cart sync completed with errors");
            }
          })
          .catch((error) => {
            console.error("Failed to sync cart with server:", error);
          });
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [cartItems, user]);

  const categories = useMemo(
    () =>
      Array.isArray(items) ? [...new Set(items.map((p) => p.category))] : [],
    [items]
  );

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        !selectedCategory || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  const handleAddToCart = (
    product: Item,
    storePrice: { storeId: string; price: number }
  ) => {
    // Update local cart state first
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item._id === product._id);
      if (existingItem) {
        return prev.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        { ...product, quantity: 1, selectedStorePrice: storePrice },
      ];
    });
    setShowCart(true);

    // If user is logged in, update the cart on the server
    if (user && user._id) {
      const existingItem = cartItems.find((item) => item._id === product._id);
      const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

      // Let the effect handle synchronization
    }
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) => (item._id === id ? { ...item, quantity } : item))
    );

    // Update quantity on the server if user is logged in
    if (user && user._id) {
      cartService.updateCartItem(user._id, id, quantity).catch((error) => {
        console.error("Failed to update item quantity on server:", error);
      });
    }
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item._id !== id));

    // Remove item from server if user is logged in
    if (user && user._id) {
      cartService.removeCartItem(user._id, id).catch((error) => {
        console.error("Failed to remove item from server cart:", error);
      });
    }
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (error) {
    return (
      <Container>
        <Typography color="error" align="center">
          שגיאה: {error}
        </Typography>
      </Container>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
          py: 4,
        }}
      >
        <Container maxWidth="xl">
          <Paper
            elevation={2}
            sx={{
              p: 4,
              mb: 4,
              borderRadius: 3,
              background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: { xs: "stretch", md: "center" },
                gap: 3,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Apple size={36} color={theme.palette.primary.main} />
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                    background:
                      "linear-gradient(45deg, #16a34a 30%, #22c55e 90%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  SuperSmart
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  flex: 1,
                  maxWidth: { md: "60%" },
                }}
              >
                <SearchInput
                  fullWidth
                  placeholder="חפש מוצרים..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={20} color={theme.palette.primary.main} />
                      </InputAdornment>
                    ),
                  }}
                />

                <Badge
                  badgeContent={totalItems}
                  color="primary"
                  sx={{
                    "& .MuiBadge-badge": {
                      backgroundColor: theme.palette.primary.main,
                      color: "white",
                    },
                  }}
                >
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: "50%",
                      bgcolor: "white",
                      cursor: "pointer",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        bgcolor: theme.palette.primary.light,
                        "& svg": {
                          color: "white",
                        },
                      },
                    }}
                    onClick={() => setShowCart(!showCart)}
                  >
                    <ShoppingBag size={24} color={theme.palette.primary.main} />
                  </Box>
                </Badge>
              </Box>
            </Box>

            <Box sx={{ mt: 3 }}>
              <CategorySelect
                select
                label="קטגוריה"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                SelectProps={{
                  native: true,
                }}
                fullWidth
              >
                <option value="">כל הקטגוריות</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </CategorySelect>
            </Box>
          </Paper>

          {/* Conditionally render the Cart component */}
          {showCart && (
            <Box sx={{ mb: 4 }}>
              <Cart
                items={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
              />
            </Box>
          )}

          {isLoading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 400,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.primary.main,
                  fontWeight: 500,
                }}
              >
                טוען מוצרים...
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filteredProducts.map((product) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                  <ProductCard
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default ProductList;
