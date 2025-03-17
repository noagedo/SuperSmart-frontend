import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import backgroundImage from '../assets/picture-HomePage.jpg'; 

const Hero: React.FC = () => {
  const navigate = useNavigate();

  const handleJoinNowClick = () => {
    navigate('/sign-up'); 
  };

  return (
    <Box
      sx={{
        height: '100vh',
        backgroundImage: `url(${backgroundImage})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center', 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        textAlign: 'center',
        position: 'relative', 
      }}
    >
     
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', 
          zIndex: 1,
        }}
      />
     
      <Box sx={{ zIndex: 2, position: 'relative', color: 'white' }}>
        <Typography variant="h3" fontWeight="bold" sx={{ mb: 2 }}>
        Shopping Cart Comparison Between Supermarkets
        </Typography>
        <Typography variant="h6" sx={{ mb: 4 }}>
        Save money on your groceries! Compare prices from leading supermarkets and find the best deals.
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          size="large"
          sx={{
            backgroundColor: '#FF4081',
            '&:hover': { backgroundColor: '#E73370' },
            mb: 3,
          }}
          onClick={handleJoinNowClick}
        >
          Join Now
        </Button>
        <Typography variant="body1" sx={{ fontSize: '1.3rem', maxWidth: '700px', textAlign: 'left', mx: 'auto' }}>
          <strong>Features:</strong><br />
          - External content : AI-powered suggestions for writing a post.<br />
          - Share experiences : Post your travel experiences with text and images.<br />
          - Comments and Likes : Comment on posts and give likes.<br />
          - User Profile : A list of destinations you’ve visited or planned to visit.
        </Typography>
        </Box>
      </Box>
    
  );
};

export default Hero;