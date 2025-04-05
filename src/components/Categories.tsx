import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import ReceiptAnalyzer from '../components/ReceiptAnalyzer';

const ImageBackdrop = styled('div')(({ theme }) => ({
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  background: 'linear-gradient(rgba(22, 163, 74, 0.2), rgba(22, 163, 74, 0.6))',
  opacity: 0.5,
  transition: theme.transitions.create('opacity'),
}));

const ImageIconButton = styled(ButtonBase)(({ theme }) => ({
  position: 'relative',
  display: 'block',
  padding: 0,
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  height: '40vh',
  margin: theme.spacing(0.5),
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.3s ease-in-out',
  [theme.breakpoints.down('md')]: {
    width: '100% !important',
    height: 200,
  },
  '&:hover': {
    transform: 'scale(1.02)',
    zIndex: 1,
  },
  '&:hover .imageBackdrop': {
    opacity: 0.2,
  },
  '&:hover .imageTitle': {
    transform: 'scale(1.1)',
    backgroundColor: 'rgba(22, 163, 74, 0.9)',
  },
  '& .imageTitle': {
    position: 'relative',
    padding: theme.spacing(2, 4),
    borderRadius: theme.spacing(1),
    backgroundColor: 'rgba(22, 163, 74, 0.8)',
    transition: 'all 0.3s ease-in-out',
    fontWeight: 600,
    textAlign: 'center',
  },
}));

const images = [
  {
    url: 'https://www.clalit.co.il/he/new_article_images/lifestyle/fruit%20and%20vegetables/GettyImages-683044558/medium.jpg',
    title: 'השוואת מחירים',
    width: '40%',
  },
  {
    url: 'https://www.karenann.co.il/wp-content/uploads/2021/03/%D7%9E%D7%94-%D7%94%D7%94%D7%92%D7%93%D7%A8%D7%94-%D7%A9%D7%9C-%D7%A1%D7%95%D7%A4%D7%A8-%D7%A4%D7%95%D7%93-768x1152.jpg',
    title: 'חיזוי רכישות מבוסס AI',
    width: '20%',
  },
  {
    url: 'https://giving.go-local.co.il/wp-content/uploads/2020/08/%D7%A1%D7%9C-%D7%9E%D7%96%D7%95%D7%9F-50-%D7%A9%D7%97.jpg',
    title: 'מעקב מחירים שבועי',
    width: '40%',
  },
  {
    url: 'https://veg.co.il/wp-content/uploads/assortment-of-sweets-and-snacks.jpg',
    title: 'מגמות מחירי סל קניות',
    width: '38%',
  },
  {
    url: 'https://ononews.co.il/wp-content/uploads/2023/04/%D7%A2%D7%99%D7%A6%D7%95%D7%91-%D7%9C%D7%9C%D7%90-%D7%A9%D7%9D-2023-04-02T114322.286.jpg',
    title: 'ניתוח מחירי מוצרים',
    width: '38%',
  },
  {
    url: 'https://images.ctfassets.net/grb5fvwhwnyo/1sJpRsfp1RJI3AASMiOS1h/d5cca0a1c5d78df3052659f2b56a1225/SEO-Food-Fresh-Groceries.png',
    title: 'התראות מחירים',
    width: '24%',
  },
];

export default function ProductCategories() {
  return (
    <Container component="section" sx={{ mt: 8, mb: 4 }}>
      <Typography
        variant="h4"
        align="center"
        component="h2"
        sx={{
          color: '#16a34a',
          fontWeight: 700,
          mb: 4,
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 60,
            height: 3,
            backgroundColor: '#16a34a',
            borderRadius: 1,
          }
        }}
      >
        הכלים שלנו לחיסכון בקניות
      </Typography>
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 2
        }}
      >
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
                backgroundPosition: 'center',
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
              </Typography>
            </Box>
          </ImageIconButton>
        ))}
      </Box>
      <Box sx={{ mt: 4 }}>
        <ReceiptAnalyzer />
      </Box>
    </Container>
  );
}