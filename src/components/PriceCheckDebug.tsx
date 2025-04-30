import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import useNotifications from "../hooks/useNotifications";
import notificationService from "../services/notification-service";
import useWishlists from "../hooks/useWishlists"; // Add this import

const PriceCheckDebug: React.FC = () => {
  const [productId, setProductId] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { checkPriceChanges, checkSpecificProducts, checkRecentChanges } =
    useNotifications();
  const { wishlists } = useWishlists(); // Add this hook usage

  const handleResetTimestamp = () => {
    localStorage.removeItem("lastPriceCheckTimestamp");
    setResponse({ message: "Timestamp reset successfully" });
  };

  const handleFullCheck = () => {
    checkPriceChanges();
    setResponse({ message: "Manual price check triggered" });
  };

  const handleCheckProduct = () => {
    if (!productId) {
      setError("Please enter a product ID");
      return;
    }

    setError(null);
    checkSpecificProducts([productId]);
    setResponse({ message: `Checking price for product ID: ${productId}` });
  };

  const handleDirectApiCall = () => {
    if (!productId) {
      setError("Please enter a product ID");
      return;
    }

    setError(null);
    setResponse({ message: "Loading..." });

    const timestamp = new Date(0).toISOString(); // Check from beginning of time

    notificationService
      .checkPriceChanges(new Date(0))
      .then((res) => {
        setResponse(res.data);
      })
      .catch((err) => {
        setError(err.message);
        setResponse(null);
      });
  };

  const handleCheckRecent = () => {
    setError(null);
    setResponse({ message: "Checking price changes in last 24 hours..." });

    notificationService
      .checkRecentPriceChanges()
      .then((res) => {
        setResponse(res.data);
      })
      .catch((err) => {
        setError(err.message);
        setResponse(null);
      });
  };

  const handleMockData = () => {
    setError(null);
    setResponse({ message: "Loading mock data..." });

    import("../services/price-history-service").then(
      ({ getMockPriceDrops }) => {
        setResponse(getMockPriceDrops());
      }
    );
  };

  const handleCheckWishlistProducts = () => {
    setError(null);
    setResponse({
      message: "Checking price changes for all wishlist products...",
    });

    const allProductIds = wishlists.flatMap((w) => w.products);
    if (allProductIds.length === 0) {
      setResponse({ message: "No products in wishlists to check" });
      return;
    }

    checkSpecificProducts(allProductIds);
    setResponse({
      message: `Checking prices for ${allProductIds.length} products across ${wishlists.length} wishlists`,
    });
  };

  return (
    <Paper sx={{ p: 3, m: 3, maxWidth: 800 }}>
      <Typography variant="h6" gutterBottom>
        Price Check Debug Tools
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleResetTimestamp}
        >
          Reset Last Check Timestamp
        </Button>

        <Button variant="contained" color="primary" onClick={handleFullCheck}>
          Trigger Full Price Check
        </Button>

        <Button
          variant="contained"
          color="secondary"
          onClick={handleCheckRecent}
        >
          Check Last 24 Hours
        </Button>

        <Button variant="contained" color="info" onClick={handleMockData}>
          Use Mock Data
        </Button>

        <Button
          variant="contained"
          color="success"
          onClick={handleCheckWishlistProducts}
        >
          Check Wishlist Products
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
        <TextField
          label="Product ID"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          size="small"
          sx={{ flexGrow: 1 }}
        />

        <Button variant="outlined" color="primary" onClick={handleCheckProduct}>
          Check Product
        </Button>

        <Button
          variant="outlined"
          color="secondary"
          onClick={handleDirectApiCall}
        >
          Direct API Call
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          Error: {error}
        </Typography>
      )}

      {response && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Response:
          </Typography>

          {typeof response === "string" || response.message ? (
            <Typography>{response.message || response}</Typography>
          ) : Array.isArray(response) ? (
            <List>
              {response.length === 0 ? (
                <Typography>No price changes found</Typography>
              ) : (
                response.map((item, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <Divider />}
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={item.productName || item.productId}
                        secondary={
                          <React.Fragment>
                            <Typography component="span" variant="body2">
                              Old price: {item.oldPrice}, New price:{" "}
                              {item.newPrice}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2">
                              Store: {item.storeId}, Date:{" "}
                              {new Date(item.changeDate).toLocaleString()}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))
              )}
            </List>
          ) : (
            <pre>{JSON.stringify(response, null, 2)}</pre>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default PriceCheckDebug;
