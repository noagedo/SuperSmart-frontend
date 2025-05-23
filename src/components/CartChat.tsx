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
import { useNotifications } from "../contexts/NotificationContext"; // ייבוא ה-context החדש

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

  // שימוש ב-context להתראות
  const { markChatNotificationsAsRead } = useNotifications();

  // הוספת פונקציית עזר לשמירה בלוקל סטורג'
  const saveMessagesToLocalStorage = (messages: ChatMessage[]) => {
    if (!cartId) return;

    try {
      localStorage.setItem(`chat_messages_${cartId}`, JSON.stringify(messages));
      console.log(
        `Saved ${messages.length} messages to localStorage for cart ${cartId}`
      );
    } catch (error) {
      console.error("Failed to save messages to localStorage:", error);
    }
  };

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
        saveMessagesToLocalStorage(messages);
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
        // בדיקת כפילויות
        if (msg._id && prevMessages.some((m) => m._id === msg._id)) {
          return prevMessages;
        }

        // עדכון סט ההודעות
        const updatedMessages = [...prevMessages, msg];

        // שמירת ההודעות המעודכנות ב-localStorage
        if (cartId) {
          try {
            saveMessagesToLocalStorage(updatedMessages);
          } catch (error) {
            console.error("Failed to save messages to localStorage:", error);
          }
        }

        return updatedMessages;
      });
    };

    socketRef.current.on("receive-message", handleReceiveMessage);

    return () => {
      socketRef.current?.off("receive-message", handleReceiveMessage);
    };
  }, [cartId]); // הוספת cartId לרשימת התלויות כדי שההודעות יישמרו לעגלה הנכונה

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

  // עדכון useEffect כדי לסמן הודעות כנקראו כאשר הצ'אט נפתח
  useEffect(() => {
    // סמן הודעות צ'אט כנקראו כשהצ'אט פתוח
    if (isOpen && cartId) {
      markChatNotificationsAsRead(cartId);

      // גם נגלול לתחתית הצ'אט כשהוא נפתח כדי לראות הודעות חדשות
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [isOpen, cartId, markChatNotificationsAsRead]);

  // Load messages from localStorage on mount and when cartId changes
  useEffect(() => {
    if (!cartId) return;

    // נסה לטעון מ-localStorage לפני פנייה לשרת
    try {
      const cachedMessages = localStorage.getItem(`chat_messages_${cartId}`);
      if (cachedMessages) {
        const parsedMessages = JSON.parse(cachedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          console.log(
            `Loaded ${parsedMessages.length} messages from localStorage for cart ${cartId}`
          );
          setMessages(parsedMessages);
          // אל תבטל את הטעינה כי אנחנו רוצים לוודא שאנחנו מסונכרנים עם השרת
        }
      }
    } catch (error) {
      console.error("Failed to load messages from localStorage:", error);
    }

    // טען הודעות מהשרת בכל מקרה כדי לקבל את ההודעות העדכניות ביותר
    fetchMessages();
  }, [cartId]);

  // הוספת האזנה לשינויי localStorage מחלונות/טאבים אחרים
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!cartId) return;

      const key = `chat_messages_${cartId}`;
      if (e.key === key && e.newValue) {
        try {
          const storedMessages = JSON.parse(e.newValue);
          if (Array.isArray(storedMessages)) {
            console.log(
              `Syncing ${storedMessages.length} messages from another tab/window for cart ${cartId}`
            );

            // בדוק אם יש הודעות חדשות שלא קיימות אצלנו
            setMessages((currentMessages) => {
              // יצירת set של ID הודעות קיימות לבדיקת כפילויות מהירה יותר
              const existingIds = new Set(
                currentMessages
                  .filter((m) => m._id) // רק הודעות עם ID
                  .map((m) => m._id)
              );

              // בדיקת הודעות חדשות שאין לנו
              const newMessages = storedMessages.filter(
                (storedMsg) => storedMsg._id && !existingIds.has(storedMsg._id)
              );

              if (newMessages.length === 0) {
                return currentMessages; // אין הודעות חדשות
              }

              console.log(
                `Found ${newMessages.length} new messages from other tab/window`
              );
              return [...currentMessages, ...newMessages];
            });
          }
        } catch (error) {
          console.error(
            "Error processing stored messages from another tab:",
            error
          );
        }
      }
    };

    // הוספת מאזין לשינויים ב-localStorage
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [cartId]);

  // שיפור ה-fetchMessages כדי לשמור הודעות ב-localStorage גם אם הצ'אט לא פתוח
  const fetchMessages = async () => {
    if (!cartId) {
      console.warn("Cannot fetch messages: No cartId provided");
      return;
    }

    setIsLoading(true);
    setError("");

    console.log(`Fetching messages for cart ${cartId}...`);

    try {
      // קודם כל ננסה לטעון מהזיכרון המקומי כדי להציג משהו מהר
      const cachedMessages = localStorage.getItem(`chat_messages_${cartId}`);
      let localMessages: ChatMessage[] = [];

      if (cachedMessages) {
        try {
          localMessages = JSON.parse(cachedMessages);
          if (Array.isArray(localMessages) && localMessages.length > 0) {
            console.log(
              `Loaded ${localMessages.length} messages from localStorage for cart ${cartId}`
            );
            setMessages(localMessages);
            setError("");
          }
        } catch (e) {
          console.error("Failed to parse cached messages:", e);
        }
      }

      // שליפה מהשרת
      const res = await axios.get(`/chat/${cartId}`);
      console.log("Chat API response:", res);

      if (Array.isArray(res.data)) {
        console.log(
          `Successfully loaded ${res.data.length} messages for cart ${cartId} from server`
        );

        // סינכרון - מזג את ההודעות מהשרת עם ההודעות המקומיות
        const serverMessages = res.data;

        // אם יש הודעות מהשרת, מזג אותן עם ההודעות המקומיות
        if (serverMessages.length > 0) {
          // מזג את ההודעות מהשרת עם ההודעות המקומיות (הסר כפילויות)
          const mergedMessages = mergeMessages(localMessages, serverMessages);

          // שמור את התוצאה ב-localStorage
          localStorage.setItem(
            `chat_messages_${cartId}`,
            JSON.stringify(mergedMessages)
          );

          // עדכן את המצב
          setMessages(mergedMessages);
        }
        // אם אין הודעות מהשרת אבל יש הודעות מקומיות, השתמש בהודעות המקומיות
        else if (localMessages.length > 0) {
          setMessages(localMessages);
        }
        // אין הודעות בכלל
        else {
          setMessages([]);
        }
      } else {
        console.warn("Server returned non-array for chat messages:", res.data);

        // אם יש לנו כבר הודעות מהזיכרון המקומי, השאר אותן
        if (localMessages.length === 0) {
          setMessages([]);
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch chat messages:", err);
      setError(`שגיאה בטעינת הודעות הצ'אט: ${err.message || "Unknown error"}`);

      // השתמש בהודעות מהזיכרון המקומי אם יש שגיאה
      const cachedMessages = localStorage.getItem(`chat_messages_${cartId}`);
      if (cachedMessages) {
        try {
          const parsedMessages = JSON.parse(cachedMessages);
          if (Array.isArray(parsedMessages)) {
            console.log(
              `Using ${parsedMessages.length} cached messages as fallback`
            );
            setMessages(parsedMessages);
            setError(""); // נקה את השגיאה כי נמצאו הודעות מטמון
          }
        } catch (e) {
          console.error("Failed to parse cached messages:", e);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Debug the API endpoint being used
  useEffect(() => {
    console.log("Current API endpoint for chat:", `/chat/${cartId}`);

    // This will help debug if the correct API is being called
    if (process.env.NODE_ENV === "development") {
      const baseURL = axios.defaults.baseURL || window.location.origin;
      console.log("Full chat API URL:", `${baseURL}/chat/${cartId}`);
    }
  }, [cartId]);

  // Add useEffect to check if socket is connected and messages are empty
  useEffect(() => {
    // If we have a socket connection but no messages, try fetching
    if (
      socketRef.current?.connected &&
      messages.length === 0 &&
      cartId &&
      !isLoading
    ) {
      console.log("Connected with 0 messages, fetching messages");
      fetchMessages();
    }
  }, [socketRef.current?.connected, cartId, messages.length, isLoading]);

  // Modify the useEffect for scrolling to handle unread messages
  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      const isScrolledToBottom =
        container.scrollHeight - container.clientHeight <=
        container.scrollTop + 20;

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
          container.scrollHeight - container.clientHeight <=
          container.scrollTop + 20;

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
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
      setUnreadMessages(false);
    }
  };

  // עדכון פונקציית שליחת ההודעה להוספת שם המשתמש למידע שנשלח
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
      setMessages((prev) => {
        const updatedMessages = [...prev, payload];
        saveMessagesToLocalStorage(updatedMessages);
        return updatedMessages;
      });

      setNewMessage("");

      // Emit to socket server - שליחת שם המשתמש בנוסף למזהה
      socketRef.current.emit("send-message", {
        ...payload,
        cartId,
        userName, // שליחת שם המשתמש כדי לעזור בסינון הודעות
      });

      // Save to API with retry logic
      const saveToAPI = async (retries = 3) => {
        try {
          const response = await axios.post(`/chat/${cartId}`, payload);
          console.log("Message saved via API, response:", response.data);

          // אם יש ID בתשובה מהשרת, עדכן את ההודעה במצב המקומי כדי למנוע כפילויות בעתיד
          if (response.data && response.data._id) {
            setMessages((prev) => {
              const updatedMessages = prev.map((msg) =>
                // החלף את ההודעה המקומית הזמנית בהודעה עם ID מהשרת
                msg.timestamp === payload.timestamp &&
                msg.message === payload.message &&
                msg.sender === payload.sender
                  ? { ...msg, _id: response.data._id }
                  : msg
              );

              saveMessagesToLocalStorage(updatedMessages);
              return updatedMessages;
            });
          }
        } catch (apiErr) {
          console.error(
            `Failed to save message via API (attempt ${4 - retries}/3):`,
            apiErr
          );
          if (retries > 0) {
            console.log(
              `Retrying API save in 1 second... (${retries} retries left)`
            );
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

  // הוספת מאזין להודעות חדשות גם כשהצ'אט לא פתוח
  useEffect(() => {
    if (!socketRef.current) return;

    const handleReceiveMessage = (msg: ChatMessage) => {
      console.log(`Received message for cart ${cartId}:`, msg);
      if (msg.clientId === socketRef.current?.id) return;

      // שמירת ההודעה במצב המקומי ובלוקל סטורג' גם כשהצ'אט לא פתוח
      setMessages((prevMessages) => {
        // בדיקת כפילויות
        if (msg._id && prevMessages.some((m) => m._id === msg._id)) {
          return prevMessages;
        }

        // עדכון סט ההודעות
        const updatedMessages = [...prevMessages, msg];

        // שמירת ההודעות המעודכנות ב-localStorage
        if (cartId) {
          try {
            localStorage.setItem(
              `chat_messages_${cartId}`,
              JSON.stringify(updatedMessages)
            );
            console.log(
              `Saved ${updatedMessages.length} messages to localStorage after receiving new message`
            );
          } catch (error) {
            console.error("Failed to save messages to localStorage:", error);
          }
        }

        return updatedMessages;
      });
    };

    socketRef.current.on("receive-message", handleReceiveMessage);

    return () => {
      socketRef.current?.off("receive-message", handleReceiveMessage);
    };
  }, [cartId]); // הוספת cartId לרשימת התלויות

  // שיפור useEffect כדי להצטרף לחדר הצ'אט מיד עם טעינת הקומפוננטה ולא רק כאשר הוא נפתח
  useEffect(() => {
    if (!cartId || !socketRef.current) return;

    console.log(`Joining cart room ${cartId} regardless of visibility`);

    if (prevCartIdRef.current && prevCartIdRef.current !== cartId) {
      console.log(`Leaving previous cart room: ${prevCartIdRef.current}`);
      socketRef.current.emit("leave-cart", prevCartIdRef.current);
    }

    socketRef.current.emit("join-cart", cartId);
    prevCartIdRef.current = cartId;

    // טען הודעות גם כשרכיב הצ'אט נטען (לא רק כשהוא נפתח)
    fetchMessages();

    // בעת עזיבת החדר (כאשר הקומפוננטה מתפרקת)
    return () => {
      if (socketRef.current && cartId) {
        console.log(`Leaving cart room ${cartId} on component unmount`);
        socketRef.current.emit("leave-cart", cartId);
      }
    };
  }, [cartId]);

  // הוספת סנכרון הודעות כאשר הצ'אט נפתח/נסגר
  useEffect(() => {
    console.log(`Chat isOpen changed to: ${isOpen} for cart: ${cartId}`);

    // אם הצ'אט נפתח, טען הודעות מחדש
    if (isOpen && cartId) {
      console.log(`Chat opened for cart ${cartId}, fetching messages...`);
      fetchMessages();
    }

    // אם הצ'אט נסגר, שמור את ההודעות
    if (!isOpen && cartId && messages.length > 0) {
      console.log(
        `Chat closed for cart ${cartId}, saving ${messages.length} messages to localStorage`
      );
      try {
        localStorage.setItem(
          `chat_messages_${cartId}`,
          JSON.stringify(messages)
        );
      } catch (error) {
        console.error(
          "Failed to save messages to localStorage on chat close:",
          error
        );
      }
    }
  }, [isOpen, cartId]);

  // נוסיף מאזין להודעות צ'אט חדשות כאשר הצ'אט לא פתוח
  useEffect(() => {
    if (!socketRef.current || !cartId) return;

    // האזנה לאירוע new-chat-notification ושמירה בלוקל סטורג'
    const handleNewChatNotification = (data: any) => {
      // וודא שההודעה שייכת לעגלה שלנו
      if (data.cartId !== cartId) return;

      // בדוק אם ההודעה היא מהמשתמש הנוכחי (אין צורך להתריע על הודעות משלך)
      if (data.sender === userName || data.clientId === socketRef.current?.id) {
        console.log("Ignoring own chat notification in CartChat component");
        return;
      }

      console.log("Received new-chat-notification for cart", cartId, ":", data);

      // המר את נתוני הצ'אט למבנה הודעה
      const chatMessage: ChatMessage = {
        sender: data.sender,
        message: data.message,
        timestamp: data.timestamp,
        clientId: data.clientId || "",
        _id:
          data._id ||
          new Date().getTime().toString() +
            Math.random().toString(36).substring(2, 9), // יצירת ID ייחודי אם אין
      };

      try {
        const localStorageKey = `chat_messages_${cartId}`;
        const existingMessagesStr = localStorage.getItem(localStorageKey);
        let existingMessages: ChatMessage[] = [];

        if (existingMessagesStr) {
          existingMessages = JSON.parse(existingMessagesStr);
        }

        // בדוק אם ההודעה כבר קיימת (לפי תוכן והשולח)
        const isDuplicate = existingMessages.some(
          (msg) =>
            msg.sender === chatMessage.sender &&
            msg.message === chatMessage.message &&
            msg.timestamp === chatMessage.timestamp
        );

        if (!isDuplicate) {
          // הוסף את ההודעה החדשה ושמור ב-localStorage תמיד
          const updatedMessages = [...existingMessages, chatMessage];
          localStorage.setItem(
            localStorageKey,
            JSON.stringify(updatedMessages)
          );
          console.log(
            `Saved new chat message to localStorage for cart ${cartId} (total: ${updatedMessages.length} messages)`
          );

          // עדכן את מצב הקומפוננטה רק אם הצ'אט פתוח
          if (isOpen) {
            setMessages(updatedMessages);
          }
        }
      } catch (error) {
        console.error("Error processing new chat notification:", error);
      }
    };

    // רישום לאירוע חדש
    socketRef.current.on("new-chat-notification", handleNewChatNotification);

    return () => {
      socketRef.current?.off(
        "new-chat-notification",
        handleNewChatNotification
      );
    };
  }, [cartId, isOpen, userName]); // הוסף את userName כתלות

  // פונקציית עזר למיזוג הודעות ללא כפילויות
  const mergeMessages = (
    localMessages: ChatMessage[],
    serverMessages: ChatMessage[]
  ): ChatMessage[] => {
    // צור מיפוי של הודעות מקומיות לפי ID או לפי תוכן+שולח+זמן
    const existingMessageMap = new Map<string, ChatMessage>();

    localMessages.forEach((msg) => {
      const key = msg._id || `${msg.sender}-${msg.message}-${msg.timestamp}`;
      existingMessageMap.set(key, msg);
    });

    // הוסף את ההודעות מהשרת שאינן קיימות כבר
    serverMessages.forEach((serverMsg) => {
      const serverKey =
        serverMsg._id ||
        `${serverMsg.sender}-${serverMsg.message}-${serverMsg.timestamp}`;
      if (!existingMessageMap.has(serverKey)) {
        existingMessageMap.set(serverKey, serverMsg);
      }
    });

    // המר בחזרה למערך ומיין לפי זמן
    const mergedMessages = Array.from(existingMessageMap.values());
    return mergedMessages.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateA - dateB;
    });
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
