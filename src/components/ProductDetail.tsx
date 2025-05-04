import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  Button,
} from '@mui/material';
import useItems from '../hooks/useItems';
import ProductCard from './ProductCard';

const ProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { items, isLoading } = useItems();

  const product = useMemo(
    () => items.find((item) => item._id === productId),
    [items, productId]
  );

  const cheaperProducts = useMemo(() => {
    if (!product) return [];
    const productPrice = Math.min(
      ...product.storePrices.flatMap((store) => store.prices.map((p) => p.price))
    );

    return items.filter((item) => {
      if (item._id === product._id || item.category !== product.category) return false;
      const itemPrice = Math.min(
        ...item.storePrices.flatMap((store) => store.prices.map((p) => p.price))
      );
      return itemPrice < productPrice;
    });
  }, [product, items]);

  if (isLoading) {
    return <Typography>טוען נתונים...</Typography>;
  }

  if (!product) {
    return <Typography>לא נמצא מוצר</Typography>;
  }

  const lowestPrice = Math.min(
    ...product.storePrices.flatMap((store) => store.prices.map((p) => p.price))
  );

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Button variant="outlined" onClick={() => navigate(-1)} sx={{ mb: 3 }}>
          ← לחזור אחורה
        </Button>

        <Grid container spacing={4}>
          <Grid item xs={12} md={5}>
            <Card>
              <CardMedia
                component="img"
                height="300"
                image={product.image}
                alt={product.name}
                sx={{ objectFit: 'contain', p: 2 }}
              />
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            <Typography variant="h4" gutterBottom>
              {product.name}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary" gutterBottom>
              קטגוריה: {product.category}
            </Typography>
            <Typography variant="h6" sx={{ mt: 2 }}>
              מחיר נמוך ביותר: ₪{lowestPrice.toFixed(2)}
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            מוצרים זולים באותה קטגוריה:
          </Typography>
          {cheaperProducts.length === 0 ? (
            <Typography>לא נמצאו מוצרים זולים יותר.</Typography>
          ) : (
            <Grid container spacing={3}>
              {cheaperProducts.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item._id}>
                  <ProductCard product={item} onAddToCart={() => {}} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default ProductDetails;
