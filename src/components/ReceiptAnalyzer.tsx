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
  Checkbox,
  FormControlLabel,
  IconButton,
  Grid,
  Divider,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import {
  Upload,
  FileText,
  Check,
  ShoppingCart,
  X,
  Info,
  ExternalLink,
} from "lucide-react";
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
  const [selectedItems, setSelectedItems] = useState<{ [id: string]: boolean }>(
    {}
  );
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [productDetails, setProductDetails] = useState<{ [id: string]: any }>(
    {}
  );
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  // Track the current step in the process
  const [activeStep, setActiveStep] = useState<number>(0);

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

  // טעינת פרטי המוצרים כאשר מתקבלות תוצאות ניתוח הקבלה
  useEffect(() => {
    if (
      analysisResult &&
      typeof analysisResult !== "string" &&
      analysisResult.cartItems.length > 0
    ) {
      loadProductDetails(analysisResult.cartItems.map((item) => item._id));
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
        setActiveStep(1); // Move to selection step instead of opening a dialog
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
  };

  const resetToUpload = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    setActiveStep(0);
    setSelectedItems({});
  };

  const countSelectedItems = () => {
    return Object.values(selectedItems).filter((selected) => selected).length;
  };

  const handleExpandItem = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedItem(expandedItem === id ? null : id);
  };

  // טעינת פרטי המוצרים מה-DB לפי מזהה
  const loadProductDetails = async (productIds: string[]) => {
    if (!productIds.length) return;

    setLoadingProducts(true);
    try {
      const detailsPromises = productIds.map((id) => fetchProductDetails(id));
      const detailsResults = await Promise.allSettled(detailsPromises);

      const newProductDetails: { [id: string]: any } = {};

      detailsResults.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value) {
          newProductDetails[productIds[index]] = result.value;
        }
      });

      setProductDetails(newProductDetails);
    } catch (error) {
      console.error("Error loading product details:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchProductDetails = async (id: string) => {
    try {
      const { request } = itemService.getItemById(id);
      const response = await request;
      return response.data;
    } catch (error) {
      console.error(`Error fetching details for product ${id}:`, error);
      return null;
    }
  };

  // הפונקציה להצגת שם המוצר - משתמשת בנתונים מה-DB אם זמינים
  const getProductName = (item: any, index: number) => {
    if (productDetails[item._id]?.name) {
      return productDetails[item._id].name;
    }
    return item.name || `מוצר ${index + 1}`;
  };

  // הפונקציה להצגת תמונת המוצר - משתמשת בנתונים מה-DB אם זמינים
  const getProductImage = (item: any) => {
    if (productDetails[item._id]?.image) {
      return productDetails[item._id].image;
    }
    return item.image;
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3 }}>
        {/* Stepper to show progress */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>העלאת קבלה</StepLabel>
          </Step>
          <Step>
            <StepLabel>בחירת מוצרים</StepLabel>
          </Step>
        </Stepper>

        {activeStep === 0 ? (
          // Upload step
          <Box>
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
        ) : (
          // Product selection step
          <Box>
            <Typography
              variant="h6"
              sx={{
                mb: 3,
                fontWeight: 600,
                color: "primary.main",
                display: "flex",
                alignItems: "center",
                gap: 1,
                justifyContent: "center",
              }}
            >
              <ShoppingCart size={24} />
              בחרו מוצרים להוספה לעגלה
            </Typography>

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
              <>
                {loadingProducts && (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", my: 2 }}
                  >
                    <CircularProgress size={24} color="primary" />
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      טוען פרטי מוצרים...
                    </Typography>
                  </Box>
                )}

                <Grid
                  container
                  spacing={2}
                  sx={{ maxHeight: "50vh", overflow: "auto" }}
                >
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
                          position: "relative",
                          overflow: "hidden",
                        }}
                        onClick={() => handleToggleItem(item._id)}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                          }}
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
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                כמות: {item.quantity}
                              </Typography>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={(e) => handleExpandItem(item._id, e)}
                                sx={{ padding: 0 }}
                              >
                                <Info size={16} />
                              </IconButton>
                            </Box>
                          </Box>

                          {/* Product Image */}
                          {getProductImage(item) ? (
                            <Box
                              sx={{
                                width: "100%",
                                height: 120,
                                display: "flex",
                                justifyContent: "center",
                                mb: 1,
                              }}
                            >
                              <img
                                src={getProductImage(item)}
                                alt={getProductName(item, index)}
                                style={{
                                  maxWidth: "100%",
                                  maxHeight: "100%",
                                  objectFit: "contain",
                                }}
                              />
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                width: "100%",
                                height: 100,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                mb: 1,
                                bgcolor: "rgba(0,0,0,0.05)",
                                borderRadius: 1,
                              }}
                            >
                              {loadingProducts ? (
                                <CircularProgress size={20} />
                              ) : (
                                <Typography
                                  color="text.secondary"
                                  variant="caption"
                                >
                                  אין תמונה זמינה
                                </Typography>
                              )}
                            </Box>
                          )}

                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600 }}
                          >
                            {getProductName(item, index)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            מזהה: {item._id}
                          </Typography>

                          {expandedItem === item._id && (
                            <Box
                              sx={{
                                mt: 2,
                                pt: 2,
                                borderTop: "1px dashed rgba(0,0,0,0.1)",
                                display: "flex",
                                flexDirection: "column",
                                gap: 1,
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 600 }}
                              >
                                פרטים נוספים
                              </Typography>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<ExternalLink size={14} />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`/product/${item._id}`, "_blank");
                                }}
                                sx={{ alignSelf: "flex-start" }}
                              >
                                צפה בפרטי המוצר
                              </Button>
                            </Box>
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Button
                onClick={resetToUpload}
                color="inherit"
                variant="outlined"
                sx={{ fontWeight: 500 }}
              >
                חזרה לסריקה
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
            </Box>
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default ReceiptAnalyzer;
