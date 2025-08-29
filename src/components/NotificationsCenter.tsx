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
  Tabs,
  Tab,
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
import { ShoppingBag, MessageCircle } from "lucide-react";
import useItems from "../hooks/useItems";
import cartService from "../services/cart-service";

const NotificationItem = styled(ListItemButton)(({}) => ({
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
  const [mockNotifications, setMockNotifications] = useState<
    PriceDropNotification[]
  >([]);
  const { wishlist } = useWishlists(); 
  const { user } = useUsers();
  const { items: allProducts } = useItems();
  const [cartNames, setCartNames] = useState<Record<string, string>>({});
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "error"
  >("disconnected");
  const [activeTab, setActiveTab] = useState(0);


  const notifications = [...hookNotifications, ...mockNotifications];

  const cartNotifications = notifications.filter((n) => n.cartId);

  const filteredNotifications = React.useMemo(() => {
    if (!user || !user._id) return [];

    const userWishlistId = wishlist ? wishlist._id : null;

    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    console.log(`User ${user._id} has wishlist with ID: ${userWishlistId}`);
    console.log(
      `Total notifications before filtering: ${notifications.length}`
    );

    return notifications.filter((notification) => {
      if (notification.cartId) return false;

      const isRecent = new Date(notification.changeDate) >= oneDayAgo;
      if (!isRecent) {
        return false;
      }

      if (notification.userId && notification.userId !== user._id) {
        return false;
      }

      if (
        notification.wishlistId &&
        (!userWishlistId || notification.wishlistId !== userWishlistId)
      ) {
        return false;
      }

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

  const cartTabNotifications = React.useMemo(() => {
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    const filtered = notifications.filter(
      (n) => n.cartId && new Date(n.changeDate) >= oneDayAgo
    );
    console.log("🛒 [NotificationsCenter] Cart tab notifications:", filtered);
    if (filtered.length === 0) {
      console.warn(
        "🛒 [DEBUG] No cart notifications to display in NotificationsCenter. If you expect cart notifications, check useNotifications state and backend."
      );
    }
    return filtered;
  }, [notifications]);

  const totalNotificationCount =
    filteredNotifications.length + cartTabNotifications.length;

  useEffect(() => {
    if (user && user._id) {
      console.log(
        `Notifications filtered: ${notifications.length} → ${filteredNotifications.length}`
      );
    }
  }, [filteredNotifications.length, notifications.length, user]);

  useEffect(() => {
    localStorage.removeItem("lastPriceCheckTimestamp");

    const timer = setTimeout(() => {
      checkRecentChanges();
    }, 1000);

    return () => clearTimeout(timer);
  }, [checkRecentChanges]);

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

    console.log("Current socket connected status:", socket.connected);
    setConnectionStatus(socket.connected ? "connected" : "disconnected");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("error", onError);
    socket.on("connect_error", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("error", onError);
      socket.off("connect_error", onError);
    };
  }, []);

  useEffect(() => {
    const fetchCartNames = async () => {
      if (!user || !user._id) return;
      try {
        const { request } = cartService.getCartsByUser(user._id);
        const response = await request;
        const carts = response.data || [];
        const names: Record<string, string> = {};
        carts.forEach((cart: any) => {
          if (cart._id) names[cart._id] = cart.name || "עגלה ללא שם";
        });
        setCartNames(names);
      } catch (e) {
        setCartNames({});
      }
    };
    fetchCartNames();
  }, [user]);

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

  const handleRefresh = () => {
    setIsRefreshing(true);

    notificationService.reconnect();

    localStorage.removeItem("lastPriceCheckTimestamp");

    if (user && user._id && wishlist) {
      const allWishlistProductIds = wishlist.products;

      console.log(
        `Manually checking ${allWishlistProductIds.length} products from user's wishlist`
      );

      if (allWishlistProductIds.length > 0) {
        checkSpecificProducts(allWishlistProductIds);
      } else {
        import("../services/price-history-service").then(
          ({ getMockPriceDrops }) => {
            const mockDrops = getMockPriceDrops();
            const recentMockDrops = mockDrops.map((drop) => ({
              ...drop,
              changeDate: new Date(), 
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

            setMockNotifications((prev) => [...prev, ...newMockNotifications]);
          }
        );
      }
    }

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
        <Badge badgeContent={totalNotificationCount} color="error">
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
          <Typography variant="h6">התראות מחירים</Typography>
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
            {(filteredNotifications.length > 0 ||
              cartNotifications.length > 0) && (
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

        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{ mb: 1 }}
        >
          <Tab
            label={
              <Badge
                badgeContent={filteredNotifications.length}
                color="error"
                sx={{ pr: 1 }}
              >
                <Typography variant="body2">מועדפים</Typography>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge
                badgeContent={cartTabNotifications.length}
                color="error"
                sx={{ pr: 1 }}
              >
                <Typography variant="body2">עגלות</Typography>
              </Badge>
            }
          />
        </Tabs>

        {activeTab === 0 && (
          <>
            {filteredNotifications.length === 0 ? (
              <MenuItem disabled>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ py: 2 }}
                >
                  אין התראות חדשות במועדפים
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
          </>
        )}

        {activeTab === 1 && (
          <>
            {cartTabNotifications.length === 0 ? (
              <MenuItem disabled>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ py: 2 }}
                >
                  אין התראות חדשות בעגלות
                </Typography>
              </MenuItem>
            ) : (
              cartTabNotifications.map((notification) => {
                const product = allProducts?.find(
                  (p) => p._id === notification.productId
                );

                const cartName = notification.cartId
                  ? cartNames[notification.cartId] || notification.cartId
                  : "";

                if (notification.type === "chat") {
                  return (
                    <NotificationItem
                      key={notification.id}
                      sx={{ bgcolor: "rgba(25, 118, 210, 0.08)" }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: "#2563eb" }} variant="rounded">
                          <MessageCircle size={20} color="white" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={notification.productName}
                        secondary={
                          <React.Fragment>
                            {notification.message && (
                              <Typography
                                variant="body2"
                                sx={{
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  maxWidth: "200px",
                                }}
                              >
                                {notification.message}
                              </Typography>
                            )}
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              בעגלה: {cartName}
                            </Typography>
                          </React.Fragment>
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
                  );
                } else {
                  const discount =
                    notification.oldPrice && notification.newPrice
                      ? Math.round(
                          ((notification.oldPrice - notification.newPrice) /
                            notification.oldPrice) *
                            100
                        )
                      : null;

                  return (
                    <NotificationItem
                      key={notification.id}
                      sx={{ bgcolor: "rgba(25, 118, 210, 0.08)" }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={product?.image || notification.image}
                          alt={notification.productName}
                          sx={{ bgcolor: "primary.main" }}
                          variant="rounded"
                        >
                          <ShoppingBag size={20} color="white" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={notification.productName}
                        secondary={
                          <React.Fragment>
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
                            {discount !== null && (
                              <Typography
                                variant="body2"
                                color="primary.main"
                                sx={{ fontWeight: "bold" }}
                              >
                                חסכון: {discount}%
                              </Typography>
                            )}
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              בעגלה: {cartName}
                            </Typography>
                          </React.Fragment>
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
                  );
                }
              })
            )}
          </>
        )}
      </Menu>
    </Box>
  );
};

export default NotificationsCenter;
