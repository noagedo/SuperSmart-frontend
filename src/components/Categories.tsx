import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';


const ImageBackdrop = styled('div')(({ theme }) => ({
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  background: '#000',
  opacity: 0.5,
  transition: theme.transitions.create('opacity'),
}));

const ImageIconButton = styled(ButtonBase)(({ theme }) => ({
  position: 'relative',
  display: 'block',
  padding: 0,
  borderRadius: 0,
  height: '40vh',
  [theme.breakpoints.down('md')]: {
    width: '100% !important',
    height: 100,
  },
  '&:hover': {
    zIndex: 1,
  },
  '&:hover .imageBackdrop': {
    opacity: 0.15,
  },
  '&:hover .imageMarked': {
    opacity: 0,
  },
  '&:hover .imageTitle': {
    border: '4px solid currentColor',
  },
  '& .imageTitle': {
    position: 'relative',
    padding: `${theme.spacing(2)} ${theme.spacing(4)} 14px`,
  },
  '& .imageMarked': {
    height: 3,
    width: 18,
    background: theme.palette.common.white,
    position: 'absolute',
    bottom: -2,
    left: 'calc(50% - 9px)',
    transition: theme.transitions.create('opacity'),
  },
}));

const images = [
  {
    url: 'https://www.clalit.co.il/he/new_article_images/lifestyle/fruit%20and%20vegetables/GettyImages-683044558/medium.jpg',
    title: 'Search and Compare Prices',
    width: '40%',
  },
  {
    url: 'https://www.karenann.co.il/wp-content/uploads/2021/03/%D7%9E%D7%94-%D7%94%D7%94%D7%92%D7%93%D7%A8%D7%94-%D7%A9%D7%9C-%D7%A1%D7%95%D7%A4%D7%A8-%D7%A4%D7%95%D7%93-768x1152.jpg',
    title: 'AI-Based Purchease prediction',
    width: '20%',
  },
  {
    url: 'https://giving.go-local.co.il/wp-content/uploads/2020/08/%D7%A1%D7%9C-%D7%9E%D7%96%D7%95%D7%9F-50-%D7%A9%D7%97.jpg',
    title: 'Weekly Price Tracking and Notifications',
    width: '40%',
  },
  {
    url: 'https://veg.co.il/wp-content/uploads/assortment-of-sweets-and-snacks.jpg',
    title: 'Shopping basket price trends',
    width: '38%',
  },
  {
    url: 'https://ononews.co.il/wp-content/uploads/2023/04/%D7%A2%D7%99%D7%A6%D7%95%D7%91-%D7%9C%D7%9C%D7%90-%D7%A9%D7%9D-2023-04-02T114322.286.jpg',
    title: 'product price Analysis',
    width: '38%',
  },
  {
    url: 'https://images.ctfassets.net/grb5fvwhwnyo/1sJpRsfp1RJI3AASMiOS1h/d5cca0a1c5d78df3052659f2b56a1225/SEO-Food-Fresh-Groceries.png',
    title: 'Wishlist with price alerts',
    width: '24%',
  },
 
  
];

export default function ProductCategories() {
  return (
    <Container component="section" sx={{ mt: 8, mb: 4 }}>
      <Typography variant="h4" align="center" component="h2">
      Your Journey, Your Story
      </Typography>
      <Box sx={{ mt: 8, display: 'flex', flexWrap: 'wrap' }}>
        {images.map((image) => (
          <ImageIconButton
            key={image.title}
            style={{
              width: image.width,
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                backgroundSize: 'cover',
                backgroundPosition: 'center 40%',
                backgroundImage: `url(${image.url})`,
              }}
            />
            <ImageBackdrop className="imageBackdrop" />
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'common.white',
              }}
            >
              <Typography
                component="h3"
                variant="h6"
                color="inherit"
                className="imageTitle"
              >
                {image.title}
                <div className="imageMarked" />
              </Typography>
            </Box>
          </ImageIconButton>
        ))}
      </Box>
    </Container>
  );
}