import React, { useEffect, useState } from "react";
import {
  Box,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Divider,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Button,
  ListItemButton,
  styled,
  Tooltip,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import useNotifications from "../hooks/useNotifications";
import useWishlists from "../hooks/useWishlists";
import useUsers from "../hooks/useUsers";
import notificationService, {
  PriceDropNotification,
} from "../services/notification-service";
import { getStoreName } from "../utils/storeUtils";

const NotificationItem = styled(ListItemButton)(({ theme }) => ({
  borderRadius: "8px",
  margin: "4px 0",
  padding: "8px 12px",
  backgroundColor: "rgba(22, 163, 74, 0.08)",
  "&:hover": {
    backgroundColor: "rgba(22, 163, 74, 0.12)",
  },
}));

const NotificationsCenter: React.FC = () => {
  const {
    dismissNotification,
    dismissAllNotifications,
    checkRecentChanges,
    checkSpecificProducts,
    notifications: hookNotifications,
  } = useNotifications();
  // Properly type the notifications state with PriceDropNotification type
  const [mockNotifications, setMockNotifications] = useState<
    PriceDropNotification[]
  >([]);
  const { wishlist } = useWishlists(); // Get the single wishlist
  const { user } = useUsers();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "error"
  >("disconnected");

  // Combine notifications from the hook and mock notifications
  const notifications = [...hookNotifications, ...mockNotifications];

  // Filter notifications for current user's wishlist with multiple criteria
  const filteredNotifications = React.useMemo(() => {
    if (!user || !user._id) return [];

    // Get user's wishlist ID
    const userWishlistId = wishlist ? wishlist._id : null;

    // Calculate date 24 hours ago
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    console.log(`User ${user._id} has wishlist with ID: ${userWishlistId}`);
    console.log(
      `Total notifications before filtering: ${notifications.length}`
    );

    // Multi-level filtering:
    return notifications.filter((notification) => {
      // Check if notification is recent (within last 24 hours)
      const isRecent = new Date(notification.changeDate) >= oneDayAgo;
      if (!isRecent) {
        return false;
      }

      // 1. Check explicit userId if present
      if (notification.userId && notification.userId !== user._id) {
        return false;
      }

      // 2. Check wishlistId ownership
      if (
        notification.wishlistId &&
        (!userWishlistId || notification.wishlistId !== userWishlistId)
      ) {
        return false;
      }

      // 3. We can also check the product - only show drops for products in user's wishlist
      if (notification.productId && wishlist) {
        const productInUserWishlist = wishlist.products.includes(
          notification.productId
        );
        if (!productInUserWishlist) {
          return false;
        }
      }

      return true;
    });
  }, [notifications, user, wishlist]);

  // Add debugging to see filtering results
  useEffect(() => {
    if (user && user._id) {
      console.log(
        `Notifications filtered: ${notifications.length} → ${filteredNotifications.length}`
      );
    }
  }, [filteredNotifications.length, notifications.length, user]);

  // Check for price changes on component mount with a forced refresh
  useEffect(() => {
    // Force a check by removing the timestamp
    localStorage.removeItem("lastPriceCheckTimestamp");

    const timer = setTimeout(() => {
      checkRecentChanges();
    }, 1000);

    return () => clearTimeout(timer);
  }, [checkRecentChanges]);

  // Better socket connection status monitoring
  useEffect(() => {
    const socket = (window as any).socket;
    if (!socket) {
      console.log("Socket not found, attempting to reconnect");
      notificationService.reconnect();
      return;
    }

    const onConnect = () => {
      console.log("Socket connected event in NotificationsCenter");
      setConnectionStatus("connected");
    };

    const onDisconnect = () => {
      console.log("Socket disconnected event in NotificationsCenter");
      setConnectionStatus("disconnected");
    };

    const onError = (error: any) => {
      console.error("Socket error in NotificationsCenter:", error);
      setConnectionStatus("error");
    };

    // Check current connection status immediately
    console.log("Current socket connected status:", socket.connected);
    setConnectionStatus(socket.connected ? "connected" : "disconnected");

    // Set up event listeners
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("error", onError);
    socket.on("connect_error", onError);

    // Clean up event listeners
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("error", onError);
      socket.off("connect_error", onError);
    };
  }, []);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
    }).format(price);
  };

  const calculateDiscount = (oldPrice: number, newPrice: number) => {
    return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
  };

  // Add manual reconnect functionality to refresh button
  const handleRefresh = () => {
    setIsRefreshing(true);

    // Force reconnect the socket
    notificationService.reconnect();

    // Force refresh by removing the timestamp
    localStorage.removeItem("lastPriceCheckTimestamp");

    if (user && user._id && wishlist) {
      // Check for recent price drops in current user's wishlist products
      const allWishlistProductIds = wishlist.products;

      console.log(
        `Manually checking ${allWishlistProductIds.length} products from user's wishlist`
      );

      // If user has wishlist products, check them specifically
      if (allWishlistProductIds.length > 0) {
        checkSpecificProducts(allWishlistProductIds);
      } else {
        // For testing: If no wishlist products, add mock data that are within 24 hours
        import("../services/price-history-service").then(
          ({ getMockPriceDrops }) => {
            const mockDrops = getMockPriceDrops();
            // Make sure mock drops have recent dates (within last 24 hours)
            const recentMockDrops = mockDrops.map((drop) => ({
              ...drop,
              changeDate: new Date(), // Set to current time to ensure they're recent
            }));

            console.log(
              "Adding mock notifications for testing (no wishlist products found):",
              recentMockDrops
            );

            const newMockNotifications = recentMockDrops.map((drop) => ({
              ...drop,
              id:
                new Date().getTime().toString() +
                Math.random().toString(36).substring(2, 9),
              wishlistId: "mock-wishlist-id",
              wishlistName: drop.wishlistName || "רשימת מועדפים לדוגמא",
            }));

            // Use properly typed state update
            setMockNotifications((prev) => [...prev, ...newMockNotifications]);
          }
        );
      }
    }

    // Check for recent changes
    setTimeout(() => {
      checkRecentChanges();
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <Box>
      <IconButton
        onClick={handleOpenMenu}
        sx={{
          color:
            connectionStatus === "connected"
              ? "#16a34a"
              : connectionStatus === "error"
              ? "error.main"
              : "text.secondary",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: "#22c55e",
            color: "white",
            transform: "scale(1.1)",
          },
        }}
      >
        <Badge badgeContent={filteredNotifications.length} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            width: 320,
            maxHeight: 400,
            overflow: "auto",
            padding: 1,
            direction: "rtl",
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">התראות מחירים מרשימות מועדפים</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="רענן התראות">
              <IconButton
                size="small"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {filteredNotifications.length > 0 && (
              <Button
                size="small"
                onClick={() => {
                  dismissAllNotifications();
                  handleCloseMenu();
                }}
              >
                נקה הכל
              </Button>
            )}
          </Box>
        </Box>

        <Divider />

        {filteredNotifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              אין התראות חדשות
            </Typography>
          </MenuItem>
        ) : (
          filteredNotifications.map((notification) => (
            <NotificationItem key={notification.id}>
              <ListItemAvatar>
                <Avatar
                  src={notification.image}
                  alt={notification.productName}
                  variant="rounded"
                />
              </ListItemAvatar>
              <ListItemText
                primary={notification.productName}
                secondary={
                  <Box sx={{ direction: "rtl" }}>
                    <Typography variant="body2" display="block">
                      מחיר חדש: {formatPrice(notification.newPrice)}
                    </Typography>
                    <Typography
                      variant="body2"
                      display="block"
                      sx={{
                        textDecoration: "line-through",
                        color: "text.secondary",
                      }}
                    >
                      מחיר קודם: {formatPrice(notification.oldPrice)}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="primary.main"
                      sx={{ fontWeight: "bold" }}
                    >
                      חסכון:{" "}
                      {calculateDiscount(
                        notification.oldPrice,
                        notification.newPrice
                      )}
                      %
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      בחנות: {getStoreName(notification.storeId)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ברשימה: {notification.wishlistName}
                    </Typography>
                  </Box>
                }
              />
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissNotification(notification.id);
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </NotificationItem>
          ))
        )}
      </Menu>
    </Box>
  );
};

export default NotificationsCenter;
