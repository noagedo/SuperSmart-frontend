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
}

class NotificationService {
  private socket: Socket | null = null;
  private onPriceDropCallback:
    | ((notification: PriceDropNotification) => void)
    | null = null;

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
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    // Listen for price drop notifications
    this.socket.on("price-drop", (data) => {
      console.log("Received price-drop event:", data);
      if (this.onPriceDropCallback) {
        const notification: PriceDropNotification = {
          id:
            new Date().getTime().toString() +
            Math.random().toString(36).substring(2, 9),
          ...data,
          changeDate: new Date(data.changeDate),
        };
        this.onPriceDropCallback(notification);
      }
    });
  }

  public subscribeToWishlistUpdates(userId: string) {
    if (this.socket) {
      console.log("Subscribing to wishlist updates for user:", userId);
      this.socket.emit("subscribe-to-wishlists", userId);
    }
  }

  public onPriceDrop(callback: (notification: PriceDropNotification) => void) {
    this.onPriceDropCallback = callback;
  }

  public checkPriceChanges(lastCheckedTimestamp?: Date) {
    // Format the timestamp as ISO string or use empty string if undefined
    const timestamp = lastCheckedTimestamp?.toISOString() || "";

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

    // Add userId parameter to only get this user's wishlist products
    return apiClient.get("/items/wishlist-price-changes", {
      params: {
        lastCheckedTimestamp: timestamp,
        onlyWishlistItems: true,
        userId: userId, // Add user ID parameter
      },
    });
  }

  // Method to check specifically for last 24 hours
  public checkRecentPriceChanges() {
    // Calculate timestamp for 24 hours ago
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Get the current user ID from localStorage
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.warn(
        "No userId found for recent price check. User might not be logged in."
      );
      return Promise.resolve({ data: [] });
    }

    console.log(`Checking price changes in last 24 hours for user: ${userId}`);

    // Add userId parameter to only get this user's wishlist products
    return apiClient.get("/items/wishlist-price-changes", {
      params: {
        lastCheckedTimestamp: yesterday.toISOString(),
        onlyWishlistItems: true,
        userId: userId, // Add user ID parameter
      },
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
}

export default new NotificationService();
