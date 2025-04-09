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
  Button,
  Drawer,
  IconButton,
} from "@mui/material";
import { ShoppingBag, Search, X } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { Cart } from "./Cart";
import { Item, CartItem } from "../services/item-service";
import useItems from "../hooks/useItems";
import useUsers from "../hooks/useUsers";

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
  const [cartOpen, setCartOpen] = useState(false);
  const [visibleProducts, setVisibleProducts] = useState(20);
  const loadMoreIncrement = 10;

  // Load cart items from localStorage on component mount
  useEffect(() => {
    const savedCartItems = localStorage.getItem("cartItems");
    if (savedCartItems) {
      try {
        const parsedItems: CartItem[] = JSON.parse(savedCartItems);
        if (parsedItems.length > 0) {
          setCartItems(parsedItems);
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
    } catch (error) {
      console.error("Failed to save cart items to localStorage:", error);
    }
  }, [cartItems]);

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

  const visibleFilteredProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleProducts);
  }, [filteredProducts, visibleProducts]);

  const handleLoadMore = () => {
    setVisibleProducts((prev) => prev + loadMoreIncrement);
  };

  const toggleCart = () => {
    setCartOpen(!cartOpen);
  };

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

    // Open the cart after adding the product
    setCartOpen(true);
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) => (item._id === id ? { ...item, quantity } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item._id !== id));
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
          display: "flex", // Use flexbox for layout
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
        }}
      >
        {/* Main Content */}
        <Box
          sx={{
            flex: cartOpen ? "0 0 calc(100% - 600px)" : "1", // Adjust width when cart is open
            transition: "flex 0.3s ease-in-out", // Smooth transition
            overflow: "hidden", // Prevent content overflow
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
              </Box>
            </Paper>

            <Box sx={{ mt: 3, paddingBottom: 2 }}>
              <CategorySelect
                select
                label=""
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
              <>
                <Grid container spacing={3}>
                  {visibleFilteredProducts.map((product) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                      <ProductCard
                        product={product}
                        onAddToCart={handleAddToCart}
                      />
                    </Grid>
                  ))}
                </Grid>

                {filteredProducts.length > visibleProducts && (
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                    <Button
                      variant="contained"
                      onClick={handleLoadMore}
                      sx={{
                        bgcolor: "primary.main",
                        color: "white",
                        py: 1.5,
                        px: 4,
                        textTransform: "none",
                        fontWeight: 600,
                        borderRadius: 2,
                        "&:hover": {
                          bgcolor: "primary.dark",
                          transform: "scale(1.02)",
                        },
                      }}
                    >
                      טען עוד מוצרים
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Container>
        </Box>

        {/* Cart Sidebar */}
        <Drawer
          anchor="right"
          open={cartOpen}
          onClose={toggleCart}
          variant="persistent"
          sx={{
            "& .MuiDrawer-paper": {
              width: 600,
              boxSizing: "border-box",
              bgcolor: "#f8fafc",
              borderLeft: `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          <Box
            sx={{
              p: 3,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                עגלת קניות
              </Typography>
              <IconButton onClick={toggleCart}>
                <X size={24} />
              </IconButton>
            </Box>

            <Cart
              items={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
            />
          </Box>
        </Drawer>
      </Box>
    </ThemeProvider>
  );
}

export default ProductList;