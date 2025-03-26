import * as React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { Apple } from 'lucide-react';

const Loading: React.FC = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <Box sx={{ position: 'relative', mb: 3 }}>
        <Apple size={48} color="#16a34a" />
        <CircularProgress
          size={64}
          sx={{
            position: 'absolute',
            top: -8,
            left: -8,
            color: '#16a34a',
          }}
        />
      </Box>
      <Typography
        variant="h6"
        sx={{
          color: '#16a34a',
          fontWeight: 600,
          textAlign: 'center',
          animation: 'pulse 2s infinite',
          '@keyframes pulse': {
            '0%': { opacity: 0.6 },
            '50%': { opacity: 1 },
            '100%': { opacity: 0.6 },
          },
        }}
      >
        טוען...
      </Typography>
    </Box>
  );
};

export default Loading;