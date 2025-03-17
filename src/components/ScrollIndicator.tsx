import React from 'react';
import { Box } from '@mui/material';

const ScrollIndicator: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        mt: -4,
      }}
    >
      <Box
        component="span"
        sx={{
          borderBottom: '2px solid white',
          width: '30px',
          animation: 'scrollAnim 1.5s infinite',
          '@keyframes scrollAnim': {
            '0%': { opacity: 0, transform: 'translateY(-10px)' },
            '50%': { opacity: 1 },
            '100%': { opacity: 0, transform: 'translateY(10px)' },
          },
        }}
      />
    </Box>
  );
};

export default ScrollIndicator;
