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
import { Item } from "../services/item-service";
import useItems from "../hooks/useItems";
import useUsers from "../hooks/useUsers";
import useCart from "../hooks/useCart";

import { useEffect } from "react";
import ReceiptAnalyzer from "../components/ReceiptAnalyzer"; // Import ReceiptAnalyzer

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
    const {
        cart,
        addItem: addItemToCart, // Rename to avoid confusion
        updateQuantity,
        removeItem,
        save,
    } = useCart();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [cartOpen, setCartOpen] = useState(false);
    const [visibleProducts, setVisibleProducts] = useState(20);
    const loadMoreIncrement = 10;

    const categories = useMemo(
        () => (Array.isArray(items) ? [...new Set(items.map((p) => p.category))] : []),
        [items]
    );

    const totalItems = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

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

    const handleAddToCartFromReceipt = (newItems: { _id: string; quantity: number }[]) => {
      if (Array.isArray(items)) {
          newItems.forEach(newItem => {
              const productToAdd = items.find(item => item._id === newItem._id);
              if (productToAdd) {
                  // Find the first store price.  You'll likely want better logic here.
                  const firstStorePrice = productToAdd.storePrices && productToAdd.storePrices.length > 0
                      ? productToAdd.storePrices[0]
                      : null;
  
                  if (firstStorePrice && firstStorePrice.prices && firstStorePrice.prices.length > 0) {
                      const firstPrice = firstStorePrice.prices[0];
                      addItemToCart({
                          _id: productToAdd._id,
                          name: productToAdd.name,
                          category: productToAdd.category,
                          storePrices: productToAdd.storePrices,
                          quantity: newItem.quantity,
                          selectedStorePrice: {
                              storeId: firstStorePrice.storeId,
                              price: firstPrice.price ?? 0,
                          },
                          image: productToAdd.image,
                      });
                      setCartOpen(true); // Open the cart only once, after adding all items
                  } else if (firstStorePrice) {
                      console.warn(`Product with ID ${newItem._id} in store ${firstStorePrice.storeId} has no prices.`);
                      //  Consider adding a user-friendly message here.
                  }
                   else {
                      console.warn(`Product with ID ${newItem._id} has no store prices.`);
                  }
              } else {
                  console.warn(`Product with ID ${newItem._id} not found in product list.`);
              }
          });
           if (newItems.length > 0) {
               setCartOpen(true); //make sure to open cart
           }
      }
  };

    const handleAddToCart = (
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
        });
        setCartOpen(true);
    };

    const handleUpdateQuantity = (id: string, quantity: number) => {
        updateQuantity(id, quantity);
    };

    const handleRemoveItem = (id: string) => {
        removeItem(id);
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            save();
        }, 1000);
        return () => clearTimeout(debounce);
    }, [cart?.items]);

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
            <Box sx={{ display: "flex", minHeight: "100vh", background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)" }}>
                <Box sx={{ flex: cartOpen ? "0 0 calc(100% - 600px)" : "1", transition: "flex 0.3s ease-in-out", overflow: "hidden" }}>
                    <Container maxWidth="xl">
                        <Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 3, background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)" }}>
                            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { xs: "stretch", md: "center" }, gap: 3 }}>
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
                                <IconButton onClick={toggleCart} sx={{ position: "relative" }}>
                                    <Badge badgeContent={totalItems} color="primary">
                                        <ShoppingBag size={28} />
                                    </Badge>
                                </IconButton>
                            </Box>
                        </Paper>

                        <Box sx={{ mt: 3, paddingBottom: 2 }}>
                            <CategorySelect
                                select
                                label=""
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                SelectProps={{ native: true }}
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

                        <Box sx={{ mt: 4 }}>
                            <ReceiptAnalyzer onAddToCart={handleAddToCartFromReceipt} />
                        </Box>

                        {isLoading ? (
                            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
                                <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 500 }}>
                                    טוען מוצרים...
                                </Typography>
                            </Box>
                        ) : (
                            <>
                                <Grid container spacing={3}>
                                    {visibleFilteredProducts.map((product) => (
                                        <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                                            <ProductCard product={product} onAddToCart={handleAddToCart} />
                                        </Grid>
                                    ))}
                                </Grid>

                                {filteredProducts.length > visibleProducts && (
                                    <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                                        <Button variant="contained" onClick={handleLoadMore} sx={{ bgcolor: "primary.main", color: "white", py: 1.5, px: 4, textTransform: "none", fontWeight: 600, borderRadius: 2, "&:hover": { bgcolor: "primary.dark", transform: "scale(1.02)" } }}>
                                            טען עוד מוצרים
                                        </Button>
                                    </Box>
                                )}
                            </>
                        )}
                    </Container>
                </Box>


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
              borderLeft: `1px solid ${theme.palette.divider}` 
            } 
          }}
        >
          <Box sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                עגלת קניות
              </Typography>
              <IconButton onClick={toggleCart}>
                <X size={24} />
              </IconButton>
            </Box>

            <Cart
              items={cart?.items || []}
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