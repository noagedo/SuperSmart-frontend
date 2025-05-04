import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import  useNotifications  from "../hooks/useNotifications";
import notificationService from "../services/notification-service";
import useWishlists from "../hooks/useWishlists";
import useUsers from "../hooks/useUsers";

const NotificationDebug: React.FC = () => {
  const { user } = useUsers();
  const { wishlists } = useWishlists();
  const { notifications, checkRecentChanges } = useNotifications();
  const [socketStatus, setSocketStatus] = useState<
    "connected" | "disconnected"
  >("disconnected");
  const [logs, setLogs] = useState<string[]>([]);
  const [manualUserId, setManualUserId] = useState("");

  useEffect(() => {
    const socket = (window as any).socket;
    if (socket) {
      const updateStatus = () => {
        setSocketStatus(socket.connected ? "connected" : "disconnected");
        addLog(
          `Socket status: ${socket.connected ? "connected" : "disconnected"}`
        );
      };

      socket.on("connect", updateStatus);
      socket.on("disconnect", updateStatus);
      socket.on("price-drop", (data: any) => {
        addLog(`Received price-drop event: ${JSON.stringify(data)}`);
      });

      updateStatus();

      return () => {
        socket.off("connect", updateStatus);
        socket.off("disconnect", updateStatus);
        socket.off("price-drop");
      };
    }
  }, []);

  const addLog = (message: string) => {
    setLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${message}`,
      ...prev.slice(0, 49),
    ]);
  };

  const handleCheckRecentChanges = () => {
    addLog("Manually checking recent price changes");
    localStorage.removeItem("lastPriceCheckTimestamp");
    checkRecentChanges();
  };

  const handleReconnectSocket = () => {
    addLog("Reconnecting socket");
    notificationService.reconnect();
  };

  const handleManualSubscribe = () => {
    const userId = manualUserId || (user?._id as string);
    if (userId) {
      addLog(`Manually subscribing to updates for user: ${userId}`);
      notificationService.subscribeToWishlistUpdates(userId);
    } else {
      addLog("No user ID provided");
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <Paper sx={{ p: 3, m: 3 }}>
      <Typography variant="h5" gutterBottom>
        Notification Debug Panel
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1">Connection Status</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor:
                socketStatus === "connected" ? "success.main" : "error.main",
            }}
          />
          <Typography>
            {socketStatus === "connected" ? "Connected" : "Disconnected"}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={handleReconnectSocket}
          >
            Reconnect
          </Button>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          User & Wishlists
        </Typography>
        <Typography variant="body2">
          User ID: {user?._id || "Not logged in"}
        </Typography>
        <Typography variant="body2">Wishlists: {wishlists.length}</Typography>
        <Typography variant="body2">
          Active Notifications: {notifications.length}
        </Typography>

        <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
          <Button variant="contained" onClick={handleCheckRecentChanges}>
            Force Check Recent Changes
          </Button>

          <Button
            variant="outlined"
            onClick={() => localStorage.removeItem("lastPriceCheckTimestamp")}
          >
            Reset Check Timestamp
          </Button>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Manual Subscription
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
          <TextField
            label="User ID"
            size="small"
            value={manualUserId}
            onChange={(e) => setManualUserId(e.target.value)}
            placeholder={user?._id}
            sx={{ flexGrow: 1 }}
          />
          <Button variant="contained" onClick={handleManualSubscribe}>
            Subscribe
          </Button>
        </Box>
      </Box>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Activity Logs ({logs.length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <Button size="small" onClick={handleClearLogs}>
              Clear Logs
            </Button>
          </Box>
          <List
            sx={{
              maxHeight: 300,
              overflow: "auto",
              bgcolor: "#f5f5f5",
              borderRadius: 1,
            }}
          >
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <ListItem key={index} dense divider={index < logs.length - 1}>
                  <ListItemText
                    primary={log}
                    primaryTypographyProps={{ sx: { fontSize: "0.8rem" } }}
                  />
                </ListItem>
              ))
            ) : (
              <ListItem dense>
                <ListItemText primary="No logs yet" />
              </ListItem>
            )}
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>
            Current Notifications ({notifications.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List sx={{ maxHeight: 300, overflow: "auto" }}>
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <ListItem
                  key={notification.id}
                  dense
                  divider={index < notifications.length - 1}
                >
                  <ListItemText
                    primary={notification.productName}
                    secondary={`Old: ₪${notification.oldPrice} → New: ₪${
                      notification.newPrice
                    } (${Math.round(
                      ((notification.oldPrice - notification.newPrice) /
                        notification.oldPrice) *
                        100
                    )}% off)`}
                  />
                </ListItem>
              ))
            ) : (
              <ListItem dense>
                <ListItemText primary="No notifications yet" />
              </ListItem>
            )}
          </List>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default NotificationDebug;
