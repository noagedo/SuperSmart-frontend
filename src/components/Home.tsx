import { Box } from '@mui/material';
import Hero from "./Hero";
import ScrollIndicator from "./ScrollIndicator";
import Categories from "./Categories";
import Footer from "./Footer";

const Home = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        bgcolor: 'background.default'
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Hero />
        <ScrollIndicator />
        <Categories />
      </Box>
      <Footer />
    </Box>
  );
};

export default Home;