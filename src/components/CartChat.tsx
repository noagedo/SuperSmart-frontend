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
import { useNotifications } from "../contexts/NotificationContext";

// Use dynamic URL that respects the protocol (HTTP/HTTPS)
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 
  (typeof window !== "undefined" && window.location.protocol === 'https:' ? 'https://' : 'http://') + 
  (typeof window !== "undefined" && window.location.hostname === 'localhost' ? 'localhost:3000' : 
   typeof window !== "undefined" ? window.location.host : "supersmart.cs.colman.ac.il");

// Socket singleton
let socket: Socket;

const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
      secure: window.location.protocol === "https:",
      forceNew: false, 
    });
  }
  return socket;
};

interface ChatMessage {
  sender: string;
  message: string;
  timestamp: string;
  clientId?: string;
  _id?: string;
}

interface CartChatProps {
  cartId: string;
  userName: string;
  isOpen: boolean;
}

const CartChat: React.FC<CartChatProps> = ({ cartId, userName, isOpen }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [_, setClientId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const [unreadMessages, setUnreadMessages] = useState<boolean>(false);
  const [userIsScrolling, setUserIsScrolling] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const prevCartIdRef = useRef<string>("");
  const prevIsOpenRef = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { markChatNotificationsAsRead } = useNotifications();

  const saveMessagesToLocalStorage = (messages: ChatMessage[]) => {
    if (!cartId) return;
    try {
      localStorage.setItem(`chat_messages_${cartId}`, JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to save messages to localStorage:", error);
    }
  };

  // Simple message comparison - two messages are the same if they have:
  // 1. Same _id (if both have _id)
  // 2. Same sender, message content, and timestamp (within 1 second)
  const areMessagesEqual = (msg1: ChatMessage, msg2: ChatMessage): boolean => {
    // If both have _id, compare by _id
    if (msg1._id && msg2._id) {
      return msg1._id === msg2._id;
    }
    
    // If one has _id and other doesn't, they could still be the same message
    // Compare by content and timestamp
    const time1 = new Date(msg1.timestamp).getTime();
    const time2 = new Date(msg2.timestamp).getTime();
    const timeDiff = Math.abs(time1 - time2);
    
    return (
      msg1.sender === msg2.sender &&
      msg1.message === msg2.message &&
      timeDiff < 2000 // Within 2 seconds
    );
  };

  // Socket connection setup
  useEffect(() => {
    socketRef.current = getSocket();

    socketRef.current.on("connect", () => {
      setClientId(socketRef.current?.id || "");
      setError("");
    });

    socketRef.current.on("connect_error", () => {
      setError("בעיית התחברות לשרת. מנסה להתחבר מחדש...");
    });

    socketRef.current.on("disconnect", (reason) => {
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

  // Socket message listeners - only when chat is open
   // Socket message listeners - only when chat is open
  useEffect(() => {
  if (!socketRef.current || !cartId || !isOpen) return;

  socketRef.current.off("receive-message");
  socketRef.current.off("new-chat-notification");

  const handleReceiveMessage = (msg: ChatMessage) => {
    if (msg.clientId === socketRef.current?.id) return;

    setMessages((prevMessages) => {
      const exists = prevMessages.some(existingMsg => 
        (existingMsg._id && msg._id && existingMsg._id === msg._id) ||
        (existingMsg.sender === msg.sender && 
         existingMsg.message === msg.message && 
         Math.abs(new Date(existingMsg.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 5000)
      );
      if (exists) return prevMessages;

      const updatedMessages = [...prevMessages, msg];
      saveMessagesToLocalStorage(updatedMessages);
      return updatedMessages;
    });
  };

  socketRef.current.on("receive-message", handleReceiveMessage);
  socketRef.current.on("new-chat-notification", (data) => {
    if (data.clientId === socketRef.current?.id) return;
    if (data.cartId === cartId) {
      handleReceiveMessage({
        sender: data.sender,
        message: data.message,
        timestamp: data.timestamp,
        clientId: data.clientId,
        _id: data._id
      });
    }
  });

  return () => {
    socketRef.current?.off("receive-message", handleReceiveMessage);
    socketRef.current?.off("new-chat-notification");
  };
}, [cartId, isOpen]);
  
  useEffect(() => {
    if (!cartId || !socketRef.current) return;

    if (prevCartIdRef.current && prevCartIdRef.current !== cartId) {
      socketRef.current.emit("leave-cart", prevCartIdRef.current);
    }
    socketRef.current.emit("join-cart", cartId);
    prevCartIdRef.current = cartId;
  }, [cartId]);

  
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setUserIsScrolling(true);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => setUserIsScrolling(false), 1000);
      const isScrolledToBottom =
        container.scrollHeight - container.clientHeight <= container.scrollTop + 20;
      setShowScrollButton(!isScrolledToBottom);
      if (isScrolledToBottom) setUnreadMessages(false);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!messages.length || !chatContainerRef.current) return;
    const container = chatContainerRef.current;
    const isNearBottom = 
      container.scrollHeight - container.clientHeight <= container.scrollTop + 100;
    if (isNearBottom && !userIsScrolling) {
      requestAnimationFrame(() => scrollToBottom());
    } else if (!isNearBottom && !userIsScrolling) {
      setUnreadMessages(true);
    }
  }, [messages, userIsScrolling]);

  
  useEffect(() => {
    setMessages([]);
  }, [cartId]);

  
  useEffect(() => {
  if (isOpen && !prevIsOpenRef.current && cartId) {
    // Clear messages first before fetching to prevent duplicates
    setMessages([]);  // Add this line
    fetchMessages();
    markChatNotificationsAsRead(cartId);
    setTimeout(() => scrollToBottom(), 200);
  } else if (!isOpen && prevIsOpenRef.current) {
    // Chat is being closed - clear messages to prevent duplicates
    setMessages([]);
  }
  prevIsOpenRef.current = isOpen;
}, [isOpen, cartId, markChatNotificationsAsRead]);

   // Fetch messages from server only - simpler approach
  const fetchMessages = async () => {
    if (!cartId) return;
    setIsLoading(true);
    setError("");

    try {
      const res = await axios.get(`/chat/${cartId}`);
      if (Array.isArray(res.data)) {
        const serverMessages = res.data.sort((a: ChatMessage, b: ChatMessage) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        // Compare with existing messages to avoid duplicates
        setMessages(prevMessages => {
  const safePrevMessages = prevMessages || [];  
  const uniqueMessages = serverMessages.filter(newMsg => 
    !safePrevMessages.some(existingMsg => areMessagesEqual(existingMsg, newMsg))
  );

  const mergedMessages = [...safePrevMessages, ...uniqueMessages];
  saveMessagesToLocalStorage(mergedMessages);
  return mergedMessages;
});
      } else {
        console.warn("Server returned non-array for chat messages:", res.data);
        setMessages([]);
      }
    } catch (err: any) {
      setError(`שגיאה בטעינת הודעות הצ'אט: ${err.message || "Unknown error"}`);
      // Try to load from localStorage as fallback
      try {
        const cachedMessages = localStorage.getItem(`chat_messages_${cartId}`);
        if (cachedMessages) {
          const localMessages = JSON.parse(cachedMessages);
          if (Array.isArray(localMessages)) {
            setMessages(localMessages);
          }
        }
      } catch (cacheErr) {
        console.error("Failed to load cached messages:", cacheErr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
      setUnreadMessages(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !cartId || !socketRef.current) return;
    
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const payload: ChatMessage = {
      sender: userName,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      clientId: socketRef.current.id,
      _id: tempId
    };

    try {
      setNewMessage("");
      
      // Add to local state immediately
      setMessages(prev => {
        const updatedMessages = [...prev, payload];
        return updatedMessages;
      });

      // Send via socket
      socketRef.current.emit("send-message", {
        ...payload,
        cartId,
        userName,
      });

      // Save to API
      try {
        const response = await axios.post(`/chat/${cartId}`, payload);
        if (response.data && response.data._id) {
          // Update with real ID from server
          setMessages(prev => {
            const updatedMessages = prev.map(msg =>
              msg._id === tempId ? { ...msg, _id: response.data._id } : msg
            );
            saveMessagesToLocalStorage(updatedMessages);
            return updatedMessages;
          });
        }
      } catch (apiErr) {
        console.error("Failed to save message to API:", apiErr);
        // Message is already in local state, so user can still see it
      }
    } catch (err) {
      setError("שגיאה בשליחת ההודעה");
    }
  };

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

      <Box sx={{ position: "relative" }}>
        <Box
          ref={chatContainerRef}
          sx={{
            height: 250,
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
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              אין הודעות עדיין. היה הראשון לכתוב!
            </Typography>
          ) : (
            messages.map((msg, i) => (
              <Box
                key={msg._id || `${msg.sender}-${msg.timestamp}-${i}`}
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
                <Typography
                  variant="body2"
                  sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
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
        <Slide
          direction="up"
          in={showScrollButton || unreadMessages}
          mountOnEnter
          unmountOnExit
        >
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