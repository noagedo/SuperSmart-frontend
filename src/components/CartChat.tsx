import React, { useEffect, useState, useRef } from "react";
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
import notificationService from "../services/notification-service";

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const [unreadMessages, setUnreadMessages] = useState<boolean>(false);
  const [userIsScrolling, setUserIsScrolling] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
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

  
  const areMessagesEqual = (msg1: ChatMessage, msg2: ChatMessage): boolean => {
    
    if (msg1._id && msg2._id) {
      return msg1._id === msg2._id;
    }

    
    const time1 = new Date(msg1.timestamp).getTime();
    const time2 = new Date(msg2.timestamp).getTime();
    const timeDiff = Math.abs(time1 - time2);

    return (
      msg1.sender === msg2.sender &&
      msg1.message === msg2.message &&
      timeDiff < 2000 // Within 2 seconds
    );
  };

  
  useEffect(() => {
    const socket = notificationService.socket;
    if (!socket) {
      setError("בעיית התחברות לשרת");
      return;
    }

    const handleConnect = () => {
      setError("");
    };

    const handleConnectError = () => {
      setError("בעיית התחברות לשרת. מנסה להתחבר מחדש...");
    };

    const handleDisconnect = (reason: string) => {
      if (reason === "io server disconnect") {
        socket.connect();
      }
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  useEffect(() => {
    const socket = notificationService.socket;
    if (!socket || !cartId || !isOpen) return;

    socket.off("receive-message");
    socket.off("new-chat-notification");

    const handleReceiveMessage = (msg: ChatMessage) => {
      if (msg.clientId === socket.id) return;

      setMessages((prevMessages) => {
        
        const isDuplicate = prevMessages.some(existingMsg => areMessagesEqual(existingMsg, msg));

        if (isDuplicate) return prevMessages;

        const updatedMessages = [...prevMessages, msg];
        saveMessagesToLocalStorage(updatedMessages);
        return updatedMessages;
      });
    };

    socket.on("receive-message", handleReceiveMessage);
    socket.on("new-chat-notification", (data: any) => {
      if (data.clientId === socket.id) return;
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
      socket.off("receive-message", handleReceiveMessage);
      socket.off("new-chat-notification");
    };
  }, [cartId, isOpen]);

  useEffect(() => {
    const socket = notificationService.socket;
    if (!cartId || !socket) return;

    if (prevCartIdRef.current && prevCartIdRef.current !== cartId) {
      socket.emit("leave-cart", prevCartIdRef.current);
    }
    socket.emit("join-cart", cartId);
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
      
      setMessages([]);  
      fetchMessages();
      markChatNotificationsAsRead(cartId);
      setTimeout(() => scrollToBottom(), 200);
    } else if (!isOpen && prevIsOpenRef.current) {
      
      setMessages([]);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, cartId, markChatNotificationsAsRead]);

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

        
        const uniqueMessages = [];
        const messageIds = new Set();

        
        for (const msg of serverMessages) {
          if (msg._id && !messageIds.has(msg._id)) {
            uniqueMessages.push(msg);
            messageIds.add(msg._id);
          }
        }

        
        for (const msg of serverMessages) {
          if (!msg._id && !uniqueMessages.some(existingMsg => areMessagesEqual(existingMsg, msg))) {
            uniqueMessages.push(msg);
          }
        }

        setMessages(uniqueMessages);
        saveMessagesToLocalStorage(uniqueMessages);
      } else {
        console.warn("Server returned non-array for chat messages:", res.data);
        setMessages([]);
      }
    } catch (err: any) {
      setError(`שגיאה בטעינת הודעות הצ'אט: ${err.message || "Unknown error"}`);
      
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
    const socket = notificationService.socket;
    if (!newMessage.trim() || !cartId || !socket) return;

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const payload: ChatMessage = {
      sender: userName,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      clientId: socket.id,
      _id: tempId
    };

    try {
      setNewMessage("");

      
      setMessages(prev => {
        const updatedMessages = [...prev, payload];
        return updatedMessages;
      });

      
      socket.emit("send-message", {
        ...payload,
        cartId,
        userName,
      });

      
      try {
        const response = await axios.post(`/chat/${cartId}`, payload);
        if (response.data && response.data._id) {
          
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
          disabled={!notificationService.socket?.connected}
          multiline
          maxRows={3}
          sx={{ direction: "rtl" }}
        />
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={!newMessage.trim() || !notificationService.socket?.connected}
        >
          שלח
        </Button>
      </Box>
    </Paper>
  );
};

export default CartChat;