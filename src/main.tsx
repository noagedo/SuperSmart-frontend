import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import theme from './theme';
import { GoogleOAuthProvider } from '@react-oauth/google'; 


createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId="282222794573-ck2v9clpo95rrb2pd3r49k3l1vncsd30.apps.googleusercontent.com">
    <StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </StrictMode>,
  </GoogleOAuthProvider>
 
);
