import React, { useState, useEffect } from "react";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
} from "@mui/material";
import useNotifications from "../hooks/useNotifications";
import notificationService from "../services/notification-service";
import useWishlists from "../hooks/useWishlists";
import useUsers from "../hooks/useUsers";
import cartService from "../services/cart-service";
import apiClient from "../services/api-client";

const PriceCheckDebug: React.FC = () => {
  const [productId, setProductId] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { checkPriceChanges, checkSpecificProducts, checkRecentChanges } =
    useNotifications();
  const { wishlist } = useWishlists();
  const { user } = useUsers();

  // Add state for cart notifications testing
  const [carts, setCarts] = useState<any[]>([]);
  const [selectedCartId, setSelectedCartId] = useState("");
  const [oldPrice, setOldPrice] = useState("100");
  const [newPrice, setNewPrice] = useState("80");
  const [socketRooms, setSocketRooms] = useState<string[]>([]);
  const [productName, setProductName] = useState("מוצר לדוגמה");

  // Fetch user's carts
  useEffect(() => {
    if (user && user._id) {
      const fetchCarts = async () => {
        try {
          if (!user._id) {
            throw new Error("User ID is undefined");
          }
          const { request } = cartService.getCartsByUser(user._id);
          const response = await request;
          setCarts(response.data);
          // Ensure cartId is a string before setting it
          if (response.data.length > 0 && response.data[0]._id) {
            setSelectedCartId(response.data[0]._id);
          }
        } catch (err) {
          console.error("Failed to fetch carts:", err);
        }
      };

      fetchCarts();
    }
  }, [user]);

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

    // Fix: Handle wishlist correctly based on type
    const allProductIds = wishlist ? wishlist.products : [];

    if (allProductIds.length === 0) {
      setResponse({ message: "No products in wishlists to check" });
      return;
    }

    checkSpecificProducts(allProductIds);
    setResponse({
      message: `Checking prices for ${allProductIds.length} products from wishlist`,
    });
  };

  // New handlers for cart notifications
  const handleGetActiveRooms = () => {
    setError(null);
    setResponse({ message: "Getting active socket rooms..." });

    if (!notificationService.socket) {
      setError("Socket is not connected");
      return;
    }

    notificationService.socket.emit("get-active-rooms");
    notificationService.socket.once("active-rooms", (rooms: string[]) => {
      setSocketRooms(rooms);
      setResponse({ message: "Retrieved active socket rooms", rooms });
    });
  };

  const handleSendCartNotification = () => {
    if (!selectedCartId) {
      setError("Please select a cart");
      return;
    }

    if (!productId) {
      setError("Please enter a product ID");
      return;
    }

    setError(null);
    setResponse({ message: "Sending test cart notification..." });

    const testNotification = {
      cartId: selectedCartId,
      productId,
      productName: productName || "מוצר לדוגמה",
      oldPrice: parseFloat(oldPrice),
      newPrice: parseFloat(newPrice),
      storeId: "1", // Using a dummy store ID
      changeDate: new Date(),
    };

    // Using the socket directly to send a test notification
    if (notificationService.socket) {
      notificationService.socket.emit("testCartNotification", testNotification);
      setResponse({
        message: "Test notification sent to cart",
        testNotification,
      });
    } else {
      setError("Socket is not connected");
    }
  };

  const handleRejoinCartRooms = () => {
    setError(null);
    setResponse({ message: "Rejoining cart rooms..." });

    carts.forEach((cart) => {
      if (cart._id) {
        notificationService.joinCartRoom(cart._id);
      }
    });

    setResponse({ message: `Rejoined ${carts.length} cart rooms` });

    // Update the list of joined rooms
    setTimeout(handleGetActiveRooms, 1000);
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

      {/* New Cart Notifications Testing Section */}
      <Paper
        elevation={3}
        sx={{ p: 2, mb: 3, bgcolor: "rgba(0, 128, 128, 0.05)" }}
      >
        <Typography variant="h6" gutterBottom color="primary">
          Cart Notifications Debug
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Cart</InputLabel>
              <Select
                value={selectedCartId}
                onChange={(e) => setSelectedCartId(e.target.value as string)}
                label="Select Cart"
              >
                {carts.length > 0 ? (
                  carts.map((cart) => (
                    <MenuItem key={cart._id} value={cart._id}>
                      {cart.name || `Cart ${cart._id.substring(0, 8)}`}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled value="">
                    No carts available
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Product Name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              size="small"
              fullWidth
            />
          </Grid>

          <Grid item xs={6} sm={3}>
            <TextField
              label="Old Price"
              value={oldPrice}
              onChange={(e) => setOldPrice(e.target.value)}
              size="small"
              fullWidth
              type="number"
            />
          </Grid>

          <Grid item xs={6} sm={3}>
            <TextField
              label="New Price"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              size="small"
              fullWidth
              type="number"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleSendCartNotification}
            >
              Send Test Cart Notification
            </Button>
          </Grid>
        </Grid>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            color="info"
            onClick={handleGetActiveRooms}
          >
            Check Active Socket Rooms
          </Button>

          <Button
            variant="outlined"
            color="warning"
            onClick={handleRejoinCartRooms}
          >
            Rejoin Cart Rooms
          </Button>
        </Box>

        {socketRooms.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Active Socket Rooms:</Typography>
            <Box
              sx={{
                maxHeight: 100,
                overflow: "auto",
                bgcolor: "#f5f5f5",
                p: 1,
                borderRadius: 1,
              }}
            >
              {socketRooms.map((room, index) => (
                <Typography key={index} variant="caption" display="block">
                  {room}
                  {room.startsWith("cart-") &&
                    selectedCartId &&
                    room.includes(selectedCartId) &&
                    " ✓"}
                </Typography>
              ))}
            </Box>
          </Box>
        )}

        {carts.length > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            You have {carts.length} cart(s) that can receive notifications. Make
            sure each cart has the notifications field set to true.
          </Alert>
        )}
      </Paper>

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
