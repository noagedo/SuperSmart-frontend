import { io, Socket } from "socket.io-client";
import apiClient from "./api-client";

export interface PriceDropNotification {
  id: string;
  productId: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  storeId: string;
  changeDate: Date;
  image?: string;
  wishlistId: string;
  wishlistName: string;
  userId?: string; // Add userId field for client-side filtering
  cartId?: string; // Ensure cartId field is included for cart-specific notifications
  type?: "price-drop" | "chat"; // Add type for notification
  isRead?: boolean; // For chat notifications
}

class NotificationService {
  public socket: Socket | null = null; // Changed to public for debugging
  private onPriceDropCallback:
    | ((notification: PriceDropNotification) => void)
    | null = null;
  private onChatMessageCallback:
    | ((notification: PriceDropNotification) => void)
    | null = null;
  private currentUserId: string | null = null;

  constructor() {
    this.connectSocket();
    // Expose socket for debugging
    if (typeof window !== "undefined") {
      (window as any).socket = this.socket;
    }
  }

  private connectSocket() {
    // Get the base URL from the API client or use a fallback
    const apiUrl = apiClient.defaults.baseURL || "http://localhost:3000";
    console.log("Attempting to connect socket to:", apiUrl);

    // Make sure to disconnect any existing socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // Create socket connection with proper settings
    this.socket = io(apiUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000, // Increased timeout
      autoConnect: true,
    });

    // Setup event listeners
    this.socket.on("connect", () => {
      console.log("Socket connected successfully to:", apiUrl);
      if (typeof window !== "undefined") {
        (window as any).socketConnected = true;
      }

      // Resubscribe with user ID after reconnection
      const userId = localStorage.getItem("userId");
      if (userId) {
        this.subscribeToWishlistUpdates(userId);
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    // Replace direct event binding with our custom method
    this.setupNotificationListener();
    this.setupChatNotificationListener(); // <-- Add this
  }

  public subscribeToWishlistUpdates(userId: string) {
    if (this.socket) {
      console.log("Subscribing to wishlist updates for user:", userId);
      this.currentUserId = userId; // Store current user ID
      localStorage.setItem("userId", userId);

      // Explicitly request to only get events for this user's wishlists
      this.socket.emit("subscribe-to-wishlists", {
        userId: userId,
        onlyUserWishlists: true,
      });

      // Send a separate message to ensure backward compatibility
      this.socket.emit("set-user-filter", userId);
    }
  }

  public onPriceDrop(callback: (notification: PriceDropNotification) => void) {
    this.onPriceDropCallback = callback;
  }

  public onChatMessage(
    callback: (notification: PriceDropNotification) => void
  ) {
    this.onChatMessageCallback = callback;
  }

  // Listen for price drop notifications
  private setupNotificationListener() {
    if (!this.socket) return;

    this.socket.on("price-drop", (data) => {
      console.log("Received price-drop event:", data); // <-- ודא שאתה רואה כאן cartId

      // Create a properly formatted notification
      const notification: PriceDropNotification = {
        id:
          new Date().getTime().toString() +
          Math.random().toString(36).substring(2, 9),
        ...data,
        changeDate: new Date(data.changeDate || new Date()),
        wishlistId: data.wishlistId || "", // Ensure these fields always exist
        wishlistName: data.wishlistName || "רשימת מועדפים",
        type: "price-drop", // <-- Add type
        isRead: false,
      };

      console.log("Processed notification:", notification);

      if (this.onPriceDropCallback) {
        this.onPriceDropCallback(notification);
      }
    });
  }

  // Listen for chat notifications
  private setupChatNotificationListener() {
    if (!this.socket) return;
    this.socket.on("new-chat-notification", (data) => {
      console.log("Received new-chat-notification", data); // הוסף לוג
      const notification: PriceDropNotification = {
        id:
          new Date().getTime().toString() +
          Math.random().toString(36).substring(2, 9),
        cartId: data.cartId,
        productId: "",
        productName: `הודעה חדשה מעגלה: ${data.sender}`,
        oldPrice: 0,
        newPrice: 0,
        storeId: "",
        changeDate: new Date(data.timestamp || new Date()),
        image: "",
        wishlistId: "",
        wishlistName: "",
        type: "chat",
        isRead: false,
      };
      if (this.onChatMessageCallback) {
        this.onChatMessageCallback(notification);
      }
    });
  }

  public checkPriceChanges(lastCheckedTimestamp?: Date) {
    // Ensure the timestamp is never in the future by using either:
    // 1. The provided timestamp if it's in the past
    // 2. A timestamp from 24 hours ago if the provided one is in the future or invalid
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setHours(yesterday.getHours() - 24);

    let validTimestamp: Date;

    if (lastCheckedTimestamp && lastCheckedTimestamp < now) {
      validTimestamp = lastCheckedTimestamp;
    } else {
      validTimestamp = yesterday;
    }

    // Format as ISO string
    const timestamp = validTimestamp.toISOString();

    // Get the current user ID from localStorage
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.warn(
        "No userId found for price check. User might not be logged in."
      );
      return Promise.resolve({ data: [] });
    }

    console.log(
      `Checking price changes since ${timestamp} for user: ${userId}`
    );

    return apiClient
      .get("/items/wishlist-price-changes", {
        params: {
          lastCheckedTimestamp: timestamp,
          onlyWishlistItems: true,
          userId: userId,
        },
      })
      .catch((error) => {
        console.error(
          "Error checking price changes:",
          error.response?.data || error.message
        );
        return { data: [] }; // Return empty data on error
      });
  }

  // Method to check specifically for last 24 hours
  public checkRecentPriceChanges() {
    // Always use a timestamp that's exactly 24 hours ago from the current time
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    // Get the current user ID from localStorage
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.warn(
        "No userId found for recent price check. User might not be logged in."
      );
      return Promise.resolve({ data: [] });
    }

    console.log(`Checking price changes in last 24 hours for user: ${userId}`);
    console.log(`Using fixed timestamp: ${yesterday.toISOString()}`);

    // Always use 24 hours as the timeframe and make sure we only get this user's wishlist products
    return apiClient
      .get("/items/wishlist-price-changes", {
        params: {
          lastCheckedTimestamp: yesterday.toISOString(),
          onlyWishlistItems: true,
          userId: userId,
        },
      })
      .catch((error) => {
        console.error(
          "Error checking price changes:",
          error.response?.data || error.message
        );
        return { data: [] }; // Return empty data on error
      });
  }

  // Check for specific products from wishlists
  public checkProductPrices(productIds: string[]) {
    if (!productIds.length) return Promise.resolve({ data: [] });

    // Get the current user ID from localStorage
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.warn(
        "No userId found for product check. User might not be logged in."
      );
      return Promise.resolve({ data: [] });
    }

    console.log(
      `Manually checking prices for ${productIds.length} products in user ${userId}'s wishlists`
    );

    return apiClient.get("/items", {
      params: {
        ids: productIds.join(","),
        includeRecentPrices: true,
        fromWishlists: true,
        userId: userId, // Add user ID parameter
      },
    });
  }

  // Improved reconnection method
  public reconnect() {
    console.log("Manually triggering socket reconnection");
    try {
      if (this.socket) {
        this.socket.disconnect();
      }
      this.connectSocket();

      // Re-subscribe for the current user if available
      const userId = localStorage.getItem("userId");
      if (userId) {
        setTimeout(() => {
          this.subscribeToWishlistUpdates(userId);

          // Rejoin cart rooms
          const cartIds = JSON.parse(localStorage.getItem("userCarts") || "[]");
          cartIds.forEach((cartId: string) => {
            this.joinCartRoom(cartId);
          });
        }, 1000);
      }

      return true;
    } catch (error) {
      console.error("Socket reconnection failed:", error);
      return false;
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Add these methods to join and leave cart rooms with better logging
  public joinCartRoom(cartId: string) {
    if (!this.socket || !cartId) {
      console.error(
        "Cannot join cart room: socket is not connected or cartId is empty"
      );
      return;
    }
    console.log(`Joining cart room: cart-${cartId}`);
    this.socket.emit("join-cart", cartId);

    // Store cart ID in localStorage for reconnection
    const cartIds = JSON.parse(localStorage.getItem("userCarts") || "[]");
    if (!cartIds.includes(cartId)) {
      cartIds.push(cartId);
      localStorage.setItem("userCarts", JSON.stringify(cartIds));
    }
  }

  public leaveCartRoom(cartId: string) {
    if (!this.socket || !cartId) {
      console.error(
        "Cannot leave cart room: socket is not connected or cartId is empty"
      );
      return;
    }
    console.log(`Leaving cart room: cart-${cartId}`);
    this.socket.emit("leave-cart", cartId);

    // Remove cart ID from localStorage
    const cartIds = JSON.parse(localStorage.getItem("userCarts") || "[]");
    const updatedCartIds = cartIds.filter((id: string) => id !== cartId);
    localStorage.setItem("userCarts", JSON.stringify(updatedCartIds));
  }

  // Test method for sending cart notifications directly
  public sendTestCartNotification(
    cartId: string,
    productId: string,
    productName: string,
    oldPrice: number,
    newPrice: number
  ) {
    if (!this.socket) {
      console.error("Cannot send test notification: socket is not connected");
      return false;
    }

    const testData = {
      cartId,
      productId,
      productName,
      oldPrice,
      newPrice,
      storeId: "1", // Using dummy storeId
      changeDate: new Date(),
    };

    console.log("Sending test cart notification:", testData);
    this.socket.emit("testCartNotification", testData);
    return true;
  }

  // Add this method to fetch cart price drops via API
  public getCartPriceDrops() {
    // Get token from localStorage
    const token = localStorage.getItem("token");
    // Pass Authorization header if token exists
    return apiClient.get("/carts/price-drops", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }
}

export default new NotificationService();
