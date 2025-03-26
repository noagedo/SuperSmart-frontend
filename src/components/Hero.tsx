import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, TrendingDown, Clock, Store } from 'lucide-react';
import { 
  Box, 
  Typography, 
  Button, 
  Container,
  Grid,
  createTheme,
  ThemeProvider,
  styled
} from '@mui/material';

const theme = createTheme({
  direction: 'rtl',
  palette: {
    primary: {
      main: '#16a34a',
      light: '#22c55e',
      dark: '#15803d',
    },
  },
});

const FeatureCard = styled(motion.div)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: theme.spacing(2),
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
}));

const Hero: React.FC = () => {
  const navigate = useNavigate();

  const handleJoinNowClick = () => {
    navigate('/sign-up');
  };

  const features = [
    {
      icon: <ShoppingCart size={32} />,
      title: 'השוואת מחירים',
      description: 'השוו מחירים בין רשתות המזון המובילות'
    },
    {
      icon: <TrendingDown size={32} />,
      title: 'חיסכון בזמן וכסף',
      description: 'מצאו את המחירים הטובים ביותר למוצרים שאתם אוהבים'
    },
    {
      icon: <Clock size={32} />,
      title: 'עדכונים בזמן אמת',
      description: 'קבלו התראות על מבצעים והנחות'
    },
    {
      icon: <Store size={32} />,
      title: 'מגוון רשתות',
      description: 'השוואה בין כל רשתות השיווק המובילות'
    }
  ];

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          position: 'relative',
          overflow: 'hidden',
          pt: { xs: 8, md: 12 },
          pb: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center" direction={{ xs: 'column-reverse', md: 'row' }}>
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Typography 
                  variant="h2" 
                  component="h1" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 700,
                    color: 'text.primary',
                    textAlign: { xs: 'center', md: 'right' },
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                  }}
                >
                  השוואת מחירים חכמה בין סופרים
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mb: 4,
                    color: 'text.secondary',
                    textAlign: { xs: 'center', md: 'right' },
                  }}
                >
                  חסכו כסף בקניות! השוו מחירים בין רשתות המזון המובילות ומצאו את העסקאות הטובות ביותר.
                </Typography>
                <Box sx={{ textAlign: { xs: 'center', md: 'right' } }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleJoinNowClick}
                    sx={{
                      borderRadius: '9999px',
                      py: 1.5,
                      px: 4,
                      fontSize: '1.1rem',
                    }}
                  >
                    הצטרפו עכשיו
                  </Button>
                </Box>
              </motion.div>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80"
                alt="Shopping Cart"
                sx={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: 4,
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                }}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: { xs: 8, md: 12 } }}>
            <Typography 
              variant="h3" 
              component="h2" 
              gutterBottom
              sx={{ 
                textAlign: 'center',
                fontWeight: 700,
                mb: 6
              }}
            >
              היתרונות שלנו
            </Typography>
            
            <Grid container spacing={4}>
              {features.map((feature, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <FeatureCard
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Box sx={{ color: 'primary.main' }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </FeatureCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default Hero;