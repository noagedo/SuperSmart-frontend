import React, { useState } from 'react';
import { 
  Button, 
  Typography, 
  Box, 
  Paper,
  styled,
  createTheme,
  ThemeProvider,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  ButtonProps
} from '@mui/material';
import { Upload, FileText, Check } from 'lucide-react';
import itemService from '../services/item-service';

const theme = createTheme({
  palette: {
    primary: {
      main: '#16a34a',
      light: '#22c55e',
      dark: '#15803d',
    },
  },
});

const UploadContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  border: '2px dashed rgba(22, 163, 74, 0.2)',
  transition: 'all 0.3s ease-in-out',
  maxWidth: '400px',
  margin: '0 auto',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
  },
}));

const ResultContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  marginTop: theme.spacing(3),
  background: '#ffffff',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  maxWidth: '400px',
  margin: '16px auto 0',
}));

interface ReceiptAnalyzerProps {
  onAddToCart?: (items: { _id: string; quantity: number }[]) => void;
}

const ReceiptAnalyzer: React.FC<ReceiptAnalyzerProps> = ({ onAddToCart }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | { cartItems: { _id: string; quantity: number }[] } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedImage(event.target.files[0]);
      setAnalysisResult(null);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) {
      setError('אנא בחר תמונה תחילה');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append('receiptImage', selectedImage);

    try {
      const { request } = itemService.analyzeReceipt(formData);
      const response = await request;

      if (response.data?.cartItems) {
        const cartItems = response.data.cartItems;
        setAnalysisResult({ cartItems });
        if (onAddToCart) {
          onAddToCart(cartItems);
        }
      } else if (response.data?.message) {
        setAnalysisResult(response.data.message);
      } else {
        setAnalysisResult('לא ניתן לעבד את הקבלה');
      }
    } catch (err: any) {
      setError(err.message || 'שגיאה בניתוח הקבלה');
      console.error('Error analyzing receipt:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        mt: 8,
        mb: 4,
        pt: 4,
        pb: 4,
        px: 2,
        borderTop: '1px solid rgba(22, 163, 74, 0.1)',
        borderBottom: '1px solid rgba(22, 163, 74, 0.1)',
        bgcolor: 'rgba(22, 163, 74, 0.02)'
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 2, 
            fontWeight: 700,
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            justifyContent: 'center'
          }}
        >
          <FileText size={24} />
          ניתוח קבלות באמצעות AI
        </Typography>

        <UploadContainer>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 1.5
          }}>
            <Upload size={32} color={theme.palette.primary.main} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
              העלה תמונת קבלה
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ fontSize: '0.875rem' }}>
              התמונה תנותח באמצעות AI כדי לזהות את המוצרים והכמויות
            </Typography>

            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="raised-button-file"
              type="file"
              onChange={handleImageChange}
            />
            <label htmlFor="raised-button-file">
              <Button
                component="span"
                variant="contained"
                sx={{
                  borderRadius: 1.5,
                  padding: '8px 24px',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  boxShadow: 'none',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.15)',
                  },
                }}
              >
                <Upload size={16} style={{ marginRight: 8 }} />
                בחר תמונה
              </Button>
            </label>

            {selectedImage && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontSize: '0.875rem'
                }}
              >
                <Check size={14} />
                {selectedImage.name}
              </Typography>
            )}

            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!selectedImage || loading}
              sx={{
                mt: 1,
                borderRadius: 1.5,
                padding: '8px 24px',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.875rem',
                boxShadow: 'none',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.15)',
                },
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} color="inherit" />
                  מנתח...
                </Box>
              ) : (
                'נתח קבלה'
              )}
            </Button>
          </Box>
        </UploadContainer>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mt: 2,
              borderRadius: 2,
              maxWidth: '400px',
              margin: '8px auto 0',
              '& .MuiAlert-icon': {
                color: '#ef4444'
              }
            }}
          >
            {error}
          </Alert>
        )}

        {analysisResult && (
          <ResultContainer>
            <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600, color: 'primary.main' }}>
              תוצאות הניתוח
            </Typography>
            
            {typeof analysisResult === 'string' ? (
              <Typography variant="body2">{analysisResult}</Typography>
            ) : (
              <List dense>
                {analysisResult.cartItems.map((item, index) => (
                  <React.Fragment key={item._id}>
                    <ListItem>
                      <ListItemText
                        primary={`מוצר ${index + 1}`}
                        secondary={`מזהה: ${item._id}, כמות: ${item.quantity}`}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                    {index < analysisResult.cartItems.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </ResultContainer>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default ReceiptAnalyzer;