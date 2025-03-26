import React from "react";
import { Box, Container, Typography, Link, IconButton } from "@mui/material";
import { Facebook, Instagram, Twitter, LinkedIn } from "@mui/icons-material";
import { Apple } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#16a34a',
        color: "white",
        paddingY: 4,
        marginTop: "auto",
        borderTop: '4px solid #22c55e',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: "space-between",
            alignItems: "center",
            gap: 3,
          }}
        >
          {/* Logo and Company Name */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
          }}>
            <Apple size={32} />
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(45deg, #ffffff 30%, #dcfce7 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              SuperSmart
            </Typography>
          </Box>

          {/* Links */}
          <Box 
            sx={{ 
              display: "flex", 
              gap: 3,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <Link 
              href="/about" 
              sx={{ 
                color: 'white',
                textDecoration: 'none',
                transition: 'color 0.2s',
                '&:hover': {
                  color: '#dcfce7',
                }
              }}
            >
              אודות
            </Link>
            <Link 
              href="/contact"
              sx={{ 
                color: 'white',
                textDecoration: 'none',
                transition: 'color 0.2s',
                '&:hover': {
                  color: '#dcfce7',
                }
              }}
            >
              צור קשר
            </Link>
            <Link 
              href="/privacy"
              sx={{ 
                color: 'white',
                textDecoration: 'none',
                transition: 'color 0.2s',
                '&:hover': {
                  color: '#dcfce7',
                }
              }}
            >
              מדיניות פרטיות
            </Link>
          </Box>

          {/* Social Media Icons */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton 
              href="https://facebook.com" 
              target="_blank"
              sx={{ 
                color: 'white',
                transition: 'transform 0.2s, background-color 0.2s',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  transform: 'scale(1.1)',
                }
              }}
            >
              <Facebook />
            </IconButton>
            <IconButton 
              href="https://instagram.com" 
              target="_blank"
              sx={{ 
                color: 'white',
                transition: 'transform 0.2s, background-color 0.2s',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  transform: 'scale(1.1)',
                }
              }}
            >
              <Instagram />
            </IconButton>
            <IconButton 
              href="https://twitter.com" 
              target="_blank"
              sx={{ 
                color: 'white',
                transition: 'transform 0.2s, background-color 0.2s',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  transform: 'scale(1.1)',
                }
              }}
            >
              <Twitter />
            </IconButton>
            <IconButton 
              href="https://linkedin.com" 
              target="_blank"
              sx={{ 
                color: 'white',
                transition: 'transform 0.2s, background-color 0.2s',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  transform: 'scale(1.1)',
                }
              }}
            >
              <LinkedIn />
            </IconButton>
          </Box>
        </Box>

        {/* Copyright */}
        <Typography 
          variant="body2" 
          sx={{ 
            textAlign: 'center',
            mt: 4,
            color: 'rgba(255, 255, 255, 0.8)',
          }}
        >
          © {new Date().getFullYear()} SuperSmart. כל הזכויות שמורות.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;