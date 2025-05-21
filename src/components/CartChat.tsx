import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Slide,
} from "@mui/material";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

// יצירת חיבור Socket.IO אחד לכל האפליקציה במקום בכל רנדור של הקומפוננטה
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:3000";
// Socket singleton
let socket: Socket;

// וודא שיש לנו רק חיבור אחד של Socket
const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

interface ChatMessage {
  sender: string;
  message: string;
  timestamp: string;
  clientId?: string;
  _id?: string; // הוספנו ID מהמסד נתונים
}

interface CartChatProps {
  cartId: string;
  userName: string;
  isOpen: boolean;
}

const CartChat: React.FC<CartChatProps> = ({ cartId, userName, isOpen }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [clientId, setClientId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const [unreadMessages, setUnreadMessages] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const prevCartIdRef = useRef<string>("");
  const prevIsOpenRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(false);

  // Add component lifecycle logging
  useEffect(() => {
    console.log(`CartChat mounted with cartId: ${cartId}, isOpen: ${isOpen}`);
    mountedRef.current = true;

    // Try to fetch messages immediately on mount
    if (cartId) {
      console.log("Fetching messages on component mount");
      fetchMessages();
    }

    return () => {
      console.log("CartChat unmounting");
      mountedRef.current = false;
      // Save messages to localStorage before unmounting
      if (messages.length > 0 && cartId) {
        localStorage.setItem(`chat_messages_${cartId}`, JSON.stringify(messages));
        console.log(`Saved ${messages.length} messages to local storage for cart ${cartId}`);
      }
    };
  }, []);

  useEffect(() => {
    socketRef.current = getSocket();

    socketRef.current.on("connect", () => {
      console.log("Connected to socket server with ID:", socketRef.current?.id);
      setClientId(socketRef.current?.id || "");
      setError("");
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setError("בעיית התחברות לשרת. מנסה להתחבר מחדש...");
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        socketRef.current?.connect();
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("connect_error");
        socketRef.current.off("disconnect");
      }
    };
  }, []);

  useEffect(() => {
    if (!socketRef.current) return;

    const handleReceiveMessage = (msg: ChatMessage) => {
      console.log("Received message:", msg);
      if (msg.clientId === socketRef.current?.id) return;

      setMessages((prevMessages) => {
        if (msg._id && prevMessages.some((m) => m._id === msg._id)) {
          return prevMessages;
        }
        return [...prevMessages, msg];
      });
    };

    socketRef.current.on("receive-message", handleReceiveMessage);

    return () => {
      socketRef.current?.off("receive-message", handleReceiveMessage);
    };
  }, []);

  useEffect(() => {
    if (!cartId || !socketRef.current) return;

    if (prevCartIdRef.current && prevCartIdRef.current !== cartId) {
      socketRef.current.emit("leave-cart", prevCartIdRef.current);
    }

    socketRef.current.emit("join-cart", cartId);
    prevCartIdRef.current = cartId;

    fetchMessages(); // Always fetch when cartId changes
  }, [cartId]);

  // Add effect to handle isOpen changes
  useEffect(() => {
    // Check if isOpen changed from false to true
    if (isOpen && !prevIsOpenRef.current && cartId) {
      console.log("Chat became visible, fetching messages for cart:", cartId);
      fetchMessages();
    }

    // Update previous isOpen state
    prevIsOpenRef.current = isOpen;
  }, [isOpen, cartId]);

  // Modify the fetchMessages function to add more logging and error handling
  const fetchMessages = async () => {
    if (!cartId) {
      console.warn("Cannot fetch messages: No cartId provided");
      return;
    }

    setIsLoading(true);
    setError("");

    console.log(`Fetching messages for cart ${cartId}...`);

    try {
      // First try to get from API
      const res = await axios.get(`/chat/${cartId}`);
      console.log("Chat API response:", res);

      if (Array.isArray(res.data)) {
        console.log(`Successfully loaded ${res.data.length} messages for cart ${cartId}`);
        setMessages(res.data);

        // Update localStorage cache
        localStorage.setItem(`chat_messages_${cartId}`, JSON.stringify(res.data));
      } else {
        console.warn("Server returned non-array for chat messages:", res.data);
        setMessages([]);

        // Try localStorage as fallback
        const cachedMessages = localStorage.getItem(`chat_messages_${cartId}`);
        if (cachedMessages) {
          try {
            const parsedMessages = JSON.parse(cachedMessages);
            if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
              console.log(`Loaded ${parsedMessages.length} messages from localStorage for cart ${cartId}`);
              setMessages(parsedMessages);
              return;
            }
          } catch (e) {
            console.error('Failed to parse cached messages:', e);
          }
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch chat messages:", err);
      setError(`שגיאה בטעינת הודעות הצ'אט: ${err.message || "Unknown error"}`);

      // Try localStorage as fallback
      const cachedMessages = localStorage.getItem(`chat_messages_${cartId}`);
      if (cachedMessages) {
        try {
          const parsedMessages = JSON.parse(cachedMessages);
          if (Array.isArray(parsedMessages)) {
            console.log(`Loaded ${parsedMessages.length} messages from localStorage for cart ${cartId}`);
            setMessages(parsedMessages);
            setError(""); // Clear error since we found cached messages
            return;
          }
        } catch (e) {
          console.error('Failed to parse cached messages:', e);
        }
      }

      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debug the API endpoint being used
  useEffect(() => {
    console.log("Current API endpoint for chat:", `/chat/${cartId}`);

    // This will help debug if the correct API is being called
    if (process.env.NODE_ENV === 'development') {
      const baseURL = axios.defaults.baseURL || window.location.origin;
      console.log("Full chat API URL:", `${baseURL}/chat/${cartId}`);
    }
  }, [cartId]);

  // Add useEffect to check if socket is connected and messages are empty
  useEffect(() => {
    // If we have a socket connection but no messages, try fetching
    if (socketRef.current?.connected && messages.length === 0 && cartId && !isLoading) {
      console.log("Connected with 0 messages, fetching messages");
      fetchMessages();
    }
  }, [socketRef.current?.connected, cartId, messages.length]);

  // Modify the useEffect for scrolling to handle unread messages
  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      const isScrolledToBottom =
        container.scrollHeight - container.clientHeight <= container.scrollTop + 20;

      if (isScrolledToBottom) {
        container.scrollTop = container.scrollHeight;
        setUnreadMessages(false);
      } else if (messages.length > 0) {
        setUnreadMessages(true);
      }
    }
  }, [messages]);

  // Add scroll event listener to show/hide scroll button
  useEffect(() => {
    const handleScroll = () => {
      if (chatContainerRef.current) {
        const container = chatContainerRef.current;
        const isScrolledToBottom =
          container.scrollHeight - container.clientHeight <= container.scrollTop + 20;

        setShowScrollButton(!isScrolledToBottom);
        if (isScrolledToBottom) {
          setUnreadMessages(false);
        }
      }
    };

    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Add a function to scroll to the bottom
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      setUnreadMessages(false);
    }
  };

  // Modify handleSend to ensure message persistence with retries
  const handleSend = async () => {
    if (!newMessage.trim() || !cartId || !socketRef.current) return;

    const payload: ChatMessage = {
      sender: userName,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      clientId: socketRef.current.id,
    };

    try {
      // Add message to local state first
      setMessages((prev) => [...prev, payload]);
      setNewMessage("");

      // Update localStorage cache
      const updatedMessages = [...messages, payload];
      localStorage.setItem(`chat_messages_${cartId}`, JSON.stringify(updatedMessages));

      // Emit to socket server
      socketRef.current.emit("send-message", { ...payload, cartId });

      // Save to API with retry logic
      const saveToAPI = async (retries = 3) => {
        try {
          await axios.post(`/chat/${cartId}`, payload);
          console.log("Message saved via API");
        } catch (apiErr) {
          console.error(`Failed to save message via API (attempt ${4 - retries}/3):`, apiErr);
          if (retries > 0) {
            console.log(`Retrying API save in 1 second... (${retries} retries left)`);
            setTimeout(() => saveToAPI(retries - 1), 1000);
          }
        }
      };

      saveToAPI();
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("שגיאה בשליחת ההודעה");
    }
  };

  // לחיצה על Enter לשליחת הודעה
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 2, mt: 3, bgcolor: "#f8fafc" }}>
      <Typography variant="h6" gutterBottom>
        🗨 צ'אט קבוצתי לעגלה
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Increase maximum height for better visibility */}
      <Box sx={{ position: "relative" }}>
        <Box
          ref={chatContainerRef}
          sx={{
            height: 250, // Increased from maxHeight: 250
            overflowY: "auto",
            mb: 2,
            bgcolor: "#ffffff",
            p: 1,
            borderRadius: 1,
            border: "1px solid #e2e8f0",
            direction: "rtl",
          }}
        >
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : messages.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center">
              אין הודעות עדיין. היה הראשון לכתוב!
            </Typography>
          ) : (
            messages.map((msg, i) => (
              <Box
                key={msg._id || i}
                sx={{
                  mb: 1.5,
                  p: 1,
                  borderRadius: 1,
                  bgcolor: msg.sender === userName ? "#e6f7ff" : "#f9f9f9",
                  ml: msg.sender === userName ? 2 : 0,
                  mr: msg.sender === userName ? 0 : 2,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: msg.sender === userName ? "#16a34a" : "primary.main",
                    fontWeight: "bold",
                  }}
                >
                  {msg.sender}
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {msg.message}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(msg.timestamp).toLocaleTimeString("he-IL", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              </Box>
            ))
          )}
        </Box>

        {/* Scroll to bottom button */}
        <Slide direction="up" in={showScrollButton || unreadMessages} mountOnEnter unmountOnExit>
          <IconButton
            onClick={scrollToBottom}
            sx={{
              position: "absolute",
              bottom: 10,
              right: 10,
              backgroundColor: unreadMessages ? "#1976d2" : "rgba(0,0,0,0.3)",
              color: "white",
              "&:hover": {
                backgroundColor: unreadMessages ? "#1565c0" : "rgba(0,0,0,0.5)",
              },
              zIndex: 2,
            }}
          >
            <ArrowDownwardIcon />
          </IconButton>
        </Slide>
      </Box>

      <Box sx={{ display: "flex", gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="כתוב הודעה..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!socketRef.current?.connected}
          multiline
          maxRows={3}
          sx={{ direction: "rtl" }}
        />
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={!newMessage.trim() || !socketRef.current?.connected}
        >
          שלח
        </Button>
      </Box>
    </Paper>
  );
};

export default CartChat;