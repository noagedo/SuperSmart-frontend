import React, { useState, useEffect } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  IconButton,
  Grid,
} from "@mui/material";
import { Upload, FileText, Check, ShoppingCart, X } from "lucide-react";
import itemService from "../services/item-service";

const theme = createTheme({
  palette: {
    primary: {
      main: "#16a34a",
      light: "#22c55e",
      dark: "#15803d",
    },
  },
});

const UploadContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
  border: "2px dashed rgba(22, 163, 74, 0.2)",
  transition: "all 0.3s ease-in-out",
  maxWidth: "400px",
  margin: "0 auto",
  "&:hover": {
    borderColor: theme.palette.primary.main,
    transform: "translateY(-4px)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
  },
}));

const ResultContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  marginTop: theme.spacing(3),
  background: "#ffffff",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
  maxWidth: "400px",
  margin: "16px auto 0",
}));

interface ReceiptAnalyzerProps {
  onAddToCart?: (items: { _id: string; quantity: number }[]) => void;
}

const ReceiptAnalyzer: React.FC<ReceiptAnalyzerProps> = ({ onAddToCart }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<
    | string
    | {
        cartItems: {
          _id: string;
          quantity: number;
          name?: string;
          image?: string;
        }[];
      }
    | null
  >(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [openSelectionDialog, setOpenSelectionDialog] =
    useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<{ [id: string]: boolean }>(
    {}
  );

  // Reset selected items when analysis result changes
  useEffect(() => {
    if (
      analysisResult &&
      typeof analysisResult !== "string" &&
      analysisResult.cartItems
    ) {
      const initialSelection = analysisResult.cartItems.reduce((acc, item) => {
        acc[item._id] = true; // All items selected by default
        return acc;
      }, {} as { [id: string]: boolean });
      setSelectedItems(initialSelection);
    }
  }, [analysisResult]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedImage(event.target.files[0]);
      setAnalysisResult(null);
      setError("");
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) {
      setError("אנא בחר תמונה תחילה");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append("receiptImage", selectedImage);

    try {
      const { request } = itemService.analyzeReceipt(formData);
      const response = await request;

      if (response.data?.cartItems) {
        const cartItems = response.data.cartItems;
        setAnalysisResult({ cartItems });
        setOpenSelectionDialog(true); // Open the selection dialog instead of adding directly
      } else if (response.data?.message) {
        setAnalysisResult(response.data.message);
      } else {
        setAnalysisResult("לא ניתן לעבד את הקבלה");
      }
    } catch (err: any) {
      setError(err.message || "שגיאה בניתוח הקבלה");
      console.error("Error analyzing receipt:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = (id: string, event?: React.SyntheticEvent) => {
    // Stop propagation if the event exists
    if (event) {
      event.stopPropagation();
    }

    setSelectedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleToggleAll = (checked: boolean) => {
    if (analysisResult && typeof analysisResult !== "string") {
      const newSelection = analysisResult.cartItems.reduce((acc, item) => {
        acc[item._id] = checked;
        return acc;
      }, {} as { [id: string]: boolean });
      setSelectedItems(newSelection);
    }
  };

  const handleConfirmSelection = () => {
    if (analysisResult && typeof analysisResult !== "string" && onAddToCart) {
      const selectedCartItems = analysisResult.cartItems
        .filter((item) => selectedItems[item._id])
        .map((item) => ({
          _id: item._id,
          quantity: item.quantity,
        }));

      if (selectedCartItems.length > 0) {
        onAddToCart(selectedCartItems);
      }
    }
    setOpenSelectionDialog(false);
  };

  const handleCloseDialog = () => {
    setOpenSelectionDialog(false);
  };

  const countSelectedItems = () => {
    return Object.values(selectedItems).filter((selected) => selected).length;
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          mt: 8,
          mb: 4,
          pt: 4,
          pb: 4,
          px: 2,
          borderTop: "1px solid rgba(22, 163, 74, 0.1)",
          borderBottom: "1px solid rgba(22, 163, 74, 0.1)",
          bgcolor: "rgba(22, 163, 74, 0.02)",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            fontWeight: 700,
            color: "primary.main",
            display: "flex",
            alignItems: "center",
            gap: 1,
            justifyContent: "center",
          }}
        >
          <FileText size={24} />
          ניתוח קבלות באמצעות AI
        </Typography>

        <UploadContainer>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Upload size={32} color={theme.palette.primary.main} />
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, color: "text.primary" }}
            >
              העלה תמונת קבלה
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ fontSize: "0.875rem" }}
            >
              התמונה תנותח באמצעות AI כדי לזהות את המוצרים והכמויות
            </Typography>

            <input
              accept="image/*"
              style={{ display: "none" }}
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
                  padding: "8px 24px",
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "0.875rem",
                  boxShadow: "none",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 4px 12px rgba(22, 163, 74, 0.15)",
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
                  color: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  fontSize: "0.875rem",
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
                padding: "8px 24px",
                fontWeight: 600,
                textTransform: "none",
                fontSize: "0.875rem",
                boxShadow: "none",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 12px rgba(22, 163, 74, 0.15)",
                },
              }}
            >
              {loading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={16} color="inherit" />
                  מנתח...
                </Box>
              ) : (
                "נתח קבלה"
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
              maxWidth: "400px",
              margin: "8px auto 0",
              "& .MuiAlert-icon": {
                color: "#ef4444",
              },
            }}
          >
            {error}
          </Alert>
        )}

        {analysisResult && typeof analysisResult === "string" && (
          <ResultContainer>
            <Typography
              variant="subtitle1"
              sx={{ mb: 1.5, fontWeight: 600, color: "primary.main" }}
            >
              תוצאות הניתוח
            </Typography>
            <Typography variant="body2">{analysisResult}</Typography>
          </ResultContainer>
        )}
      </Box>

      {/* Product Selection Dialog */}
      <Dialog
        open={openSelectionDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "primary.main",
            color: "white",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ShoppingCart size={20} />
            בחירת מוצרים להוספה לעגלה
          </Box>
          <IconButton onClick={handleCloseDialog} sx={{ color: "white" }}>
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(
                    analysisResult &&
                      typeof analysisResult !== "string" &&
                      analysisResult.cartItems.length > 0 &&
                      analysisResult.cartItems.every(
                        (item) => selectedItems[item._id]
                      )
                  )}
                  indeterminate={Boolean(
                    analysisResult &&
                      typeof analysisResult !== "string" &&
                      countSelectedItems() > 0 &&
                      countSelectedItems() < analysisResult.cartItems.length
                  )}
                  onChange={(e) => handleToggleAll(e.target.checked)}
                  color="primary"
                />
              }
              label={`בחר הכל (${countSelectedItems()} / ${
                analysisResult && typeof analysisResult !== "string"
                  ? analysisResult.cartItems.length
                  : 0
              })`}
            />
          </Box>

          {analysisResult && typeof analysisResult !== "string" && (
            <Grid container spacing={2}>
              {analysisResult.cartItems.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={item._id}>
                  <Paper
                    elevation={selectedItems[item._id] ? 3 : 1}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: selectedItems[item._id]
                        ? "2px solid #16a34a"
                        : "1px solid rgba(0,0,0,0.12)",
                      transition: "all 0.2s",
                      cursor: "pointer",
                      "&:hover": {
                        borderColor: "#16a34a",
                        transform: "translateY(-4px)",
                      },
                    }}
                    onClick={() => handleToggleItem(item._id)}
                  >
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <Checkbox
                          checked={Boolean(selectedItems[item._id])}
                          onChange={(e) => handleToggleItem(item._id, e)}
                          onClick={(e) => e.stopPropagation()}
                          color="primary"
                        />
                        <Typography variant="body2" color="text.secondary">
                          כמות: {item.quantity}
                        </Typography>
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {item.name || `מוצר ${index + 1}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        מזהה: {item._id}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "#f8fafc" }}>
          <Button
            onClick={handleCloseDialog}
            color="inherit"
            sx={{ fontWeight: 500 }}
          >
            ביטול
          </Button>
          <Button
            onClick={handleConfirmSelection}
            variant="contained"
            color="primary"
            startIcon={<ShoppingCart size={18} />}
            disabled={countSelectedItems() === 0}
            sx={{
              fontWeight: 600,
              boxShadow: "none",
              "&:hover": {
                boxShadow: "0 4px 12px rgba(22, 163, 74, 0.15)",
              },
            }}
          >
            הוסף {countSelectedItems()} פריטים לעגלה
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default ReceiptAnalyzer;
