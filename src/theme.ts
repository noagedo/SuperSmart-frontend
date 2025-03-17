// src/theme.ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#333',
    },
    secondary: {
      main: '#FF4081',
    },
    background: {
      default: '#f0f0f0', 
    },
  },
});

export default theme;
