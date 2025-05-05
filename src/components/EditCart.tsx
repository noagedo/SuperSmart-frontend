import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  createTheme,
  ThemeProvider,
  Skeleton,
  InputAdornment,
  Autocomplete,
  Chip,
  Divider,
  Snackbar,
} from '@mui/material';
import { 
  Save, 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Minus, 
  ImageOff, 
  Search, 
  ShoppingCart,
  UserPlus,
  UserMinus,
  Users,
} from 'lucide-react';
import cartService, { Cart } from '../services/cart-service';
import useUsers from '../hooks/useUsers';
import useItems from '../hooks/useItems';

const theme = createTheme({
  palette: {
    primary: {
      main: '#16a34a',
      light: '#22c55e',
      dark: '#15803d',
    },
  },
});

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500';

const EditCart = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUsers();
  const { items: allProducts } = useItems();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartName, setCartName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [imageLoadingStates, setImageLoadingStates] = useState<{ [key: string]: boolean }>({});
  const [imageErrorStates, setImageErrorStates] = useState<{ [key: string]: boolean }>({});
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // New states for participants management
  const [participantDialogOpen, setParticipantDialogOpen] = useState(false);
  const [newParticipantEmail, setNewParticipantEmail] = useState('');
  const [removeParticipantDialogOpen, setRemoveParticipantDialogOpen] = useState(false);
  const [participantToRemove, setParticipantToRemove] = useState<string>('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    const fetchCart = async () => {
      if (!id) return;
      try {
        const { request } = cartService.getCartById(id);
        const response = await request;
        setCart(response.data);
        setCartName(response.data.name || '');
        
        const initialLoadingStates: { [key: string]: boolean } = {};
        response.data.items.forEach((item: any) => {
          initialLoadingStates[item.productId] = true;
        });
        setImageLoadingStates(initialLoadingStates);
      } catch (err) {
        setError('Failed to load cart');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [id]);

  const handleImageLoad = (productId: string) => {
    setImageLoadingStates(prev => ({
      ...prev,
      [productId]: false
    }));
  };

  const handleImageError = (productId: string) => {
    setImageErrorStates(prev => ({
      ...prev,
      [productId]: true
    }));
    setImageLoadingStates(prev => ({
      ...prev,
      [productId]: false
    }));
  };

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (!cart || !cart._id) return;
    
    try {
      const updatedItems = cart.items.map(item =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      );

      const updatedCart = {
        ...cart,
        items: updatedItems
      };

      await cartService.updateCart(cart._id, updatedCart).request;
      setCart(updatedCart);
    } catch (err) {
      setError('Failed to update quantity');
      console.error(err);
    }
  };

  const handleDeleteItem = async (productId: string) => {
    if (!cart || !cart._id) return;
    
    try {
      const updatedItems = cart.items.filter(item => item.productId !== productId);
      
      const updatedCart = {
        ...cart,
        items: updatedItems
      };

      await cartService.updateCart(cart._id, updatedCart).request;
      setCart(updatedCart);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (err) {
      setError('Failed to delete item');
      console.error(err);
    }
  };

  const handleAddProduct = async () => {
    if (!cart || !cart._id || !selectedProduct) return;

    try {
      const existingItem = cart.items.find(item => item.productId === selectedProduct._id);
      
      let updatedItems;
      if (existingItem) {
        updatedItems = cart.items.map(item =>
          item.productId === selectedProduct._id
            ? { ...item, quantity: (item.quantity || 1) + 1 }
            : item
        );
      } else {
        updatedItems = [...cart.items, {
          productId: selectedProduct._id,
          quantity: 1
        }];
      }

      const updatedCart = {
        ...cart,
        items: updatedItems
      };

      await cartService.updateCart(cart._id, updatedCart).request;
      setCart(updatedCart);
      setSearchDialogOpen(false);
      setSelectedProduct(null);
      setSearchQuery('');
    } catch (err) {
      setError('Failed to add product');
      console.error(err);
    }
  };

  // Handle adding a new participant
  const handleAddParticipant = async () => {
    if (!cart?._id || !newParticipantEmail) return;

    try {
      const { request } = cartService.addParticipant(cart._id, newParticipantEmail);
      await request;

      setCart(prev => prev ? {
        ...prev,
        participants: [...prev.participants, newParticipantEmail]
      } : null);

      setParticipantDialogOpen(false);
      setNewParticipantEmail('');
      
      setSnackbar({
        open: true,
        message: 'המשתתף נוסף בהצלחה',
        severity: 'success'
      });
    } catch (err) {
      console.error('Failed to add participant:', err);
      setSnackbar({
        open: true,
        message: 'שגיאה בהוספת המשתתף',
        severity: 'error'
      });
    }
  };

  // Handle removing a participant
  const handleRemoveParticipant = async () => {
    if (!cart?._id || !participantToRemove) return;

    try {
      const { request } = cartService.removeParticipant(cart._id, participantToRemove);
      await request;

      setCart(prev => prev ? {
        ...prev,
        participants: prev.participants.filter(p => p !== participantToRemove)
      } : null);

      setRemoveParticipantDialogOpen(false);
      setParticipantToRemove('');
      
      setSnackbar({
        open: true,
        message: 'המשתתף הוסר בהצלחה',
        severity: 'success'
      });
    } catch (err) {
      console.error('Failed to remove participant:', err);
      setSnackbar({
        open: true,
        message: 'שגיאה בהסרת המשתתף',
        severity: 'error'
      });
    }
  };

  const handleSave = async () => {
    if (!cart || !cart._id) return;
    
    try {
      const updatedCart = {
        ...cart,
        name: cartName
      };

      await cartService.updateCart(cart._id, updatedCart).request;
      navigate('/personal-area');
    } catch (err) {
      setError('Failed to save changes');
      console.error(err);
    }
  };

  const getProductDetails = (productId: string) => {
    return allProducts?.find(product => product._id === productId);
  };

  const filteredProducts = allProducts?.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!cart) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Cart not found</Alert>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        p: 4,
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
      }}>
        <Paper sx={{ 
          maxWidth: 1200, 
          mx: 'auto', 
          p: 4,
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <IconButton 
              onClick={() => navigate('/personal-area')}
              sx={{ 
                color: 'primary.main',
                '&:hover': { bgcolor: 'rgba(22, 163, 74, 0.08)' }
              }}
            >
              <ArrowLeft />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', flexGrow: 1 }}>
              עריכת עגלה
            </Typography>
            <Button
              variant="contained"
              onClick={() => setParticipantDialogOpen(true)}
              startIcon={<UserPlus />}
              sx={{
                bgcolor: 'primary.main',
                mr: 1,
                '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              הוסף משתתף
            </Button>
            <Button
              variant="contained"
              onClick={() => setSearchDialogOpen(true)}
              startIcon={<Plus />}
              sx={{
                bgcolor: 'primary.main',
                '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              הוסף מוצר
            </Button>
          </Box>

          <Box sx={{ mb: 4 }}>
            <TextField
              fullWidth
              label="שם העגלה"
              value={cartName}
              onChange={(e) => setCartName(e.target.value)}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: 'primary.main',
                }
              }}
            />

            {cart?.participants && cart.participants.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  color: 'primary.main',
                  mb: 2
                }}>
                  <Users size={20} />
                  משתתפים בעגלה
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {cart.participants.map((participant) => (
                    <Chip
                      key={participant}
                      label={participant}
                      onDelete={() => {
                        setParticipantToRemove(participant);
                        setRemoveParticipantDialogOpen(true);
                      }}
                      deleteIcon={<UserMinus size={16} />}
                      sx={{
                        bgcolor: 'rgba(22, 163, 74, 0.1)',
                        color: 'primary.main',
                        '& .MuiChip-deleteIcon': {
                          color: 'primary.main',
                          '&:hover': {
                            color: 'error.main',
                          },
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 4 }} />

          <Grid container spacing={3}>
            {cart.items.map((item) => {
              const productDetails = getProductDetails(item.productId);
              const isImageLoading = imageLoadingStates[item.productId];
              const hasImageError = imageErrorStates[item.productId];

              return (
                <Grid item xs={12} sm={6} md={4} key={item.productId}>
                  <Card sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
                    }
                  }}>
                    <Box sx={{ position: 'relative', pt: '56.25%' }}>
                      {isImageLoading && (
                        <Skeleton 
                          variant="rectangular" 
                          sx={{ 
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            bgcolor: 'rgba(22, 163, 74, 0.1)'
                          }}
                        />
                      )}
                      
                      {hasImageError ? (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'rgba(0, 0, 0, 0.04)',
                          }}
                        >
                          <ImageOff size={32} color="#16a34a" />
                        </Box>
                      ) : (
                        <CardMedia
                          component="img"
                          image={productDetails?.image || FALLBACK_IMAGE}
                          alt={productDetails?.name || 'Product image'}
                          onLoad={() => handleImageLoad(item.productId)}
                          onError={() => handleImageError(item.productId)}
                          sx={{ 
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'opacity 0.3s',
                            opacity: isImageLoading ? 0 : 1
                          }}
                        />
                      )}
                    </Box>

                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                        {productDetails?.name || `Product ${item.productId}`}
                      </Typography>
                      
                      {productDetails?.category && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {productDetails.category}
                        </Typography>
                      )}
                      
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2 
                      }}>
                        <Box sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          bgcolor: 'rgba(22, 163, 74, 0.08)',
                          borderRadius: 2,
                          p: 1
                        }}>
                          <IconButton 
                            size="small"
                            onClick={() => handleUpdateQuantity(item.productId, Math.max(1, (item.quantity || 1) - 1))}
                            sx={{ color: 'primary.main' }}
                          >
                            <Minus size={16} />
                          </IconButton>
                          <Typography sx={{ minWidth: 30, textAlign: 'center' }}>
                            {item.quantity || 1}
                          </Typography>
                          <IconButton 
                            size="small"
                            onClick={() => handleUpdateQuantity(item.productId, (item.quantity || 1) + 1)}
                            sx={{ color: 'primary.main' }}
                          >
                            <Plus size={16} />
                          </IconButton>
                        </Box>

                        <IconButton 
                          color="error"
                          onClick={() => {
                            setItemToDelete(item.productId);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 size={20} />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/personal-area')}
              sx={{ 
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  bgcolor: 'rgba(22, 163, 74, 0.08)'
                }
              }}
            >
              ביטול
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              startIcon={<Save />}
              sx={{
                bgcolor: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.dark'
                }
              }}
            >
              שמור שינויים
            </Button>
          </Box>
        </Paper>

        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
            מחיקת פריט
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Typography>
              האם אתה בטוח שברצונך למחוק פריט זה מהעגלה?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => setDeleteDialogOpen(false)}
              sx={{ color: 'text.secondary' }}
            >
              ביטול
            </Button>
            <Button
              onClick={() => itemToDelete && handleDeleteItem(itemToDelete)}
              variant="contained"
              color="error"
              startIcon={<Trash2 size={18} />}
            >
              מחק פריט
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={searchDialogOpen}
          onClose={() => {
            setSearchDialogOpen(false);
            setSelectedProduct(null);
            setSearchQuery('');
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
            הוספת מוצר לעגלה
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Autocomplete
              value={selectedProduct}
              onChange={(event, newValue) => {
                setSelectedProduct(newValue);
              }}
              options={filteredProducts}
              getOptionLabel={(option) => option.name}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="חפש מוצר"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={20} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mt: 1 }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Box
                    component="img"
                    src={option.image || FALLBACK_IMAGE}
                    alt={option.name}
                    sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover' }}
                  />
                  <Box>
                    <Typography variant="subtitle1">{option.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.category}
                    </Typography>
                  </Box>
                </Box>
              )}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => {
                setSearchDialogOpen(false);
                setSelectedProduct(null);
                setSearchQuery('');
              }}
              sx={{ color: 'text.secondary' }}
            >
              ביטול
            </Button>
            <Button
              onClick={handleAddProduct}
              variant="contained"
              disabled={!selectedProduct}
              startIcon={<ShoppingCart size={18} />}
              sx={{
                bgcolor: 'primary.main',
                '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              הוסף לעגלה
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={participantDialogOpen}
          onClose={() => {
            setParticipantDialogOpen(false);
            setNewParticipantEmail('');
          }}
        >
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
            הוספת משתתף לעגלה
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="כתובת אימייל"
              value={newParticipantEmail}
              onChange={(e) => setNewParticipantEmail(e.target.value)}
              type="email"
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => {
                setParticipantDialogOpen(false);
                setNewParticipantEmail('');
              }}
            >
              ביטול
            </Button>
            <Button
              variant="contained"
              onClick={handleAddParticipant}
              disabled={!newParticipantEmail}
              sx={{
                bgcolor: 'primary.main',
                '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              הוסף
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={removeParticipantDialogOpen}
          onClose={() => {
            setRemoveParticipantDialogOpen(false);
            setParticipantToRemove('');
          }}
        >
          <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
            הסרת משתתף מהעגלה
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Typography>
              האם אתה בטוח שברצונך להסיר את המשתתף {participantToRemove} מהעגלה?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => {
                setRemoveParticipantDialogOpen(false);
                setParticipantToRemove('');
              }}
            >
              ביטול
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleRemoveParticipant}
            >
              הסר משתתף
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default EditCart;