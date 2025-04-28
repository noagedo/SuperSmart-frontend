import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Box, Typography, Button, Grid } from '@mui/material';
import useItems from "../hooks/useItems";
import PriceChart from './PriceChart';
import ProductCard from './ProductCard';

const ProductDetails = () => {
  const { productId } = useParams(); // Extract productId from URL
  console.log('Product ID from URL:', productId);  // Check if it's correct
  const { items, isLoading } = useItems();
  
  // Find the product by its _id
  const product = useMemo(
    () => items.find((item) => item._id === productId), // Search by _id
    [items, productId]
  );

  // Get cheaper products from the same category
  const cheaperProducts = useMemo(() => {
    if (!product) return [];
    return items.filter(
      (item) => item.category === product.category && Math.min(...item.storePrices.map(store => store.prices[0].price)) < Math.min(...product.storePrices.map(store => store.prices[0].price))
    );
  }, [product, items]);

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  if (!product) {
    return <Typography>No product found!</Typography>;
  }

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1">{product.name}</Typography>
        <Typography variant="h6" color="textSecondary">{product.category}</Typography>

        <Box sx={{ mt: 2 }}>
          <PriceChart item={product} open={true} onClose={() => {}} />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">Price: ₪{Math.min(...product.storePrices.map(store => store.prices[0].price)).toFixed(2)}</Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Cheaper Products in the Same Category:</Typography>
          <Grid container spacing={3}>
            {cheaperProducts.map((cheaperProduct) => (
              <Grid item xs={12} sm={6} md={4} key={cheaperProduct._id}>
                <ProductCard product={cheaperProduct} onAddToCart={() => {}} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default ProductDetails;
