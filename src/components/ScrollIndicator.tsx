import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Box, createTheme, ThemeProvider } from '@mui/material';

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

const ScrollIndicator: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <motion.div
          initial={{ y: 0 }}
          animate={{ 
            y: [0, 10, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <ChevronDown 
              size={32}
              color={theme.palette.primary.main}
              strokeWidth={2.5}
            />
            <ChevronDown 
              size={24}
              color={theme.palette.primary.light}
              strokeWidth={2}
              style={{ marginTop: -16 }}
            />
          </Box>
        </motion.div>
      </Box>
    </ThemeProvider>
  );
};

export default ScrollIndicator;