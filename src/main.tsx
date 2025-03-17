import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import theme from './theme';
import { GoogleOAuthProvider } from '@react-oauth/google'; 


createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId="724234007789-9c72rt1vq87i902glhhbnv81s2jrfdvb.apps.googleusercontent.com">
    <StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </StrictMode>,
  </GoogleOAuthProvider>
 
);
