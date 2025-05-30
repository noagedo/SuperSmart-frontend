import { useState, useMemo } from "react";
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
  Dialog,
  DialogContent,
  DialogTitle,
  Fab,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  ShoppingBag,
  Search,
  X,
  FileText,
  ClipboardList,
} from "lucide-react";
import { ProductCard } from "./ProductCard";
import { Cart } from "./Cart";
import { Item } from "../services/item-service";
import useItems from "../hooks/useItems";
import useUsers from "../hooks/useUsers";
import useCart from "../hooks/useCart";
import ReceiptAnalyzer from "../components/ReceiptAnalyzer";

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
  useUsers();
  const {
    cart,
    addItem: addItemToCart,
    updateQuantity,
    removeItem,
  } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [cartOpen, setCartOpen] = useState(false);
  const [visibleProducts, setVisibleProducts] = useState(20);
  const loadMoreIncrement = 10;
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));

  const categories = useMemo(
    () =>
      Array.isArray(items) ? [...new Set(items.map((p) => p.category))] : [],
    [items]
  );

  const totalItems =
    cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

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

  const handleAddToCartFromReceipt = (
    newItems: { _id: string; quantity: number }[]
  ) => {
    if (Array.isArray(items)) {
      newItems.forEach((newItem) => {
        const productToAdd = items.find((item) => item._id === newItem._id);
        if (productToAdd) {
          const firstStorePrice =
            productToAdd.storePrices && productToAdd.storePrices.length > 0
              ? productToAdd.storePrices[0]
              : null;

          if (
            firstStorePrice &&
            firstStorePrice.prices &&
            firstStorePrice.prices.length > 0
          ) {
            const firstPrice = firstStorePrice.prices[0];
            addItemToCart({
                          _id: productToAdd._id,
                          name: productToAdd.name,
                          category: productToAdd.category,
                          nutrition: productToAdd.nutrition,
                          storePrices: productToAdd.storePrices,
                          quantity: newItem.quantity,
                          selectedStorePrice: {
                            storeId: firstStorePrice.storeId,
                            price: firstPrice.price ?? 0,
                          },
                          image: productToAdd.image,
                        });
          }
        }
      });

      if (newItems.length > 0) {
        setCartOpen(true);
        setReceiptDialogOpen(false);
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
      nutrition: product.nutrition,
      storePrices: product.storePrices,
      quantity: 1,
      selectedStorePrice: storePrice,
      image: product.image,
    });
    if (isMobile) {
      setCartOpen(true);
    }
  };

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
          display: "flex",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
        }}
      >
        <Box
          sx={{
            flex: cartOpen && !isMobile ? "0 0 calc(100% - 600px)" : "1",
            transition: "flex 0.3s ease-in-out",
            overflow: "hidden",
            width: "100%",
          }}
        >
          <Container maxWidth="xl">
            <Paper
              elevation={2}
              sx={{
                p: { xs: 2, md: 4 },
                mb: 4,
                borderRadius: 3,
                background:
                  "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  alignItems: "stretch",
                  gap: 2,
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
                        <Search
                          size={20}
                          color={theme.palette.primary.main}
                        />
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  variant="outlined"
                  startIcon={<FileText size={20} />}
                  onClick={() => setReceiptDialogOpen(true)}
                  sx={{
                    color: theme.palette.primary.main,
                    borderColor: theme.palette.primary.main,
                    whiteSpace: "nowrap",
                    minWidth: { xs: "100%", md: "auto" },
                    "&:hover": {
                      backgroundColor: "rgba(22, 163, 74, 0.04)",
                      borderColor: theme.palette.primary.dark,
                    },
                  }}
                >
                  AI סריקת קבלה עם
                </Button>

                <IconButton
                  onClick={toggleCart}
                  sx={{
                    alignSelf: { xs: "flex-end", md: "center" },
                  }}
                >
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
                  sx={{ color: theme.palette.primary.main, fontWeight: 500 }}
                >
                  טוען מוצרים...
                </Typography>
              </Box>
            ) : (
              <>
                <Grid container spacing={2}>
                  {visibleFilteredProducts.map((product) => (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={cartOpen ? 6 : 4}
                      lg={cartOpen ? 4 : 3}
                      key={product._id}
                    >
                      <ProductCard
                        product={product}
                        onAddToCart={handleAddToCart}
                      />
                    </Grid>
                  ))}
                </Grid>

                {filteredProducts.length > visibleProducts && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      mt: 4,
                      mb: { xs: 8, md: 4 },
                    }}
                  >
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

        <Drawer
          anchor={isMobile ? "bottom" : "right"}
          open={cartOpen}
          onClose={toggleCart}
          variant={isMobile ? "temporary" : "persistent"}
          sx={{
            "& .MuiDrawer-paper": {
              width: isMobile ? "100%" : 600,
              height: isMobile ? "90vh" : "100%",
              boxSizing: "border-box",
              bgcolor: "#f8fafc",
              borderLeft: `1px solid ${theme.palette.divider}`,
              borderTopLeftRadius: isMobile ? 16 : 0,
              borderTopRightRadius: isMobile ? 16 : 0,
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
              items={cart?.items || []}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
            />
          </Box>
        </Drawer>

        <Dialog
          open={receiptDialogOpen}
          onClose={() => setReceiptDialogOpen(false)}
          maxWidth="md"
          fullWidth
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 3,
              margin: { xs: 2, md: 4 },
              maxHeight: { xs: "90vh", md: "80vh" },
            },
          }}
        >
          <DialogTitle
            sx={{
              bgcolor: "#16a34a",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ClipboardList size={24} />
              <Typography variant="h6">סריקת קבלה באמצעות AI</Typography>
            </Box>
            <IconButton
              onClick={() => setReceiptDialogOpen(false)}
              sx={{ color: "white" }}
            >
              <X size={24} />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <ReceiptAnalyzer onAddToCart={handleAddToCartFromReceipt} />
          </DialogContent>
        </Dialog>

        <Fab
          color="primary"
          aria-label="סריקת קבלה"
          onClick={() => setReceiptDialogOpen(true)}
          sx={{
            position: "fixed",
            bottom: 20,
            right: 20,
            display: { xs: "flex", md: "none" },
            zIndex: 1000,
          }}
        >
          <FileText size={24} />
        </Fab>
      </Box>
    </ThemeProvider>
  );
}

export default ProductList;