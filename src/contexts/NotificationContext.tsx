import React, { createContext, useState, useContext, useEffect } from "react";
import notificationService, {
  PriceDropNotification,
} from "../services/notification-service";
import useUsers from "../hooks/useUsers";

interface NotificationContextType {
  unreadChatCount: number;
  chatNotifications: PriceDropNotification[];
  markChatNotificationsAsRead: (cartId: string) => void;
  addChatNotification: (notification: PriceDropNotification) => void;
  getUnreadChatCountForCart: (cartId: string) => number; // הוספת פונקציה חדשה
  getChatNotificationsForCart: (cartId: string) => PriceDropNotification[]; // הוספת פונקציה חדשה
}

const NotificationContext = createContext<NotificationContextType>({
  unreadChatCount: 0,
  chatNotifications: [],
  markChatNotificationsAsRead: () => {},
  addChatNotification: () => {},
  getUnreadChatCountForCart: () => 0,
  getChatNotificationsForCart: () => [],
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [chatNotifications, setChatNotifications] = useState<
    PriceDropNotification[]
  >([]);
  const { user } = useUsers();

  // חישוב של מספר ההודעות שלא נקראו
  const unreadChatCount = chatNotifications.filter(
    (n) => n.type === "chat" && !n.isRead
  ).length;

  // להוסיף התראת צ'אט חדשה
  const addChatNotification = (notification: PriceDropNotification) => {
    setChatNotifications((prev) => {
      // בדוק אם ההתראה כבר קיימת
      const isDuplicate = prev.some(
        (n) =>
          n.cartId === notification.cartId &&
          n.changeDate?.toString() === notification.changeDate?.toString()
      );

      if (isDuplicate) return prev;
      return [...prev, notification];
    });
  };

  // סימון של התראות צ'אט כנקראו עבור עגלה מסוימת
  const markChatNotificationsAsRead = (cartId: string) => {
    setChatNotifications((prev) =>
      prev.map((n) =>
        n.type === "chat" && n.cartId === cartId ? { ...n, isRead: true } : n
      )
    );

    // שמירה ב-localStorage למקרה של רענון הדף
    try {
      const lastReadData = JSON.parse(
        localStorage.getItem("lastReadChatNotifications") || "{}"
      );
      lastReadData[cartId] = new Date().toISOString();
      localStorage.setItem(
        "lastReadChatNotifications",
        JSON.stringify(lastReadData)
      );
    } catch (err) {
      console.error("Failed to save read status to localStorage:", err);
    }
  };

  // האזנה להודעות צ'אט חדשות
  useEffect(() => {
    if (!user) return;

    const handleChatNotification = (notification: PriceDropNotification) => {
      console.log("🔔 [Global Chat Notification]", notification);

      // בדיקה אם ההודעה היא מהמשתמש הנוכחי
      const currentUserName = user?.userName;
      const senderName = notification.productName?.replace(
        "הודעה חדשה מעגלה: ",
        ""
      );

      if (currentUserName && senderName === currentUserName) {
        console.log("Ignoring own chat notification in global context");
        return;
      }

      addChatNotification(notification);
    };

    // רישום להתראות חדשות
    notificationService.onChatMessage(handleChatNotification);

    return () => {
      notificationService.onChatMessage(() => {});
    };
  }, [user]);

  // טעינת מצב התראות שמורות מ-localStorage בעת טעינת האפליקציה
  useEffect(() => {
    try {
      const lastReadData = localStorage.getItem("lastReadChatNotifications");
      const savedNotifications = localStorage.getItem("chatNotifications");

      if (savedNotifications) {
        const parsedNotifications = JSON.parse(savedNotifications);
        setChatNotifications(parsedNotifications);
      }

      // סימון הודעות כנקראות על בסיס מידע שמור
      if (lastReadData) {
        const lastReadMap = JSON.parse(lastReadData);

        setChatNotifications((prev) =>
          prev.map((n) => {
            if (n.type === "chat" && n.cartId && lastReadMap[n.cartId]) {
              const lastReadTime = new Date(lastReadMap[n.cartId]);
              const msgTime = new Date(n.changeDate);
              if (msgTime < lastReadTime) {
                return { ...n, isRead: true };
              }
            }
            return n;
          })
        );
      }
    } catch (err) {
      console.error("Error loading notification data from localStorage:", err);
    }
  }, []);

  // שמירת התראות ב-localStorage כשהן משתנות
  useEffect(() => {
    if (chatNotifications.length > 0) {
      localStorage.setItem(
        "chatNotifications",
        JSON.stringify(chatNotifications)
      );
    }
  }, [chatNotifications]);

  // פונקציה חדשה לקבלת מספר התראות צ'אט שלא נקראו עבור עגלה ספציפית
  const getUnreadChatCountForCart = (cartId: string): number => {
    return chatNotifications.filter(
      (n) => n.type === "chat" && n.cartId === cartId && !n.isRead
    ).length;
  };

  // פונקציה חדשה לקבלת כל התראות הצ'אט עבור עגלה ספציפית
  const getChatNotificationsForCart = (
    cartId: string
  ): PriceDropNotification[] => {
    return chatNotifications.filter(
      (n) => n.type === "chat" && n.cartId === cartId
    );
  };

  const value = {
    unreadChatCount,
    chatNotifications,
    markChatNotificationsAsRead,
    addChatNotification,
    getUnreadChatCountForCart,
    getChatNotificationsForCart,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
