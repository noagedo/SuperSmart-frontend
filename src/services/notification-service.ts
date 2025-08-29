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
  userId?: string; 
  cartId?: string; 
  type?: "price-drop" | "chat"; 
  isRead?: boolean; 
  message?: string; 
}

class NotificationService {
  public socket: Socket | null = null; 
  private onPriceDropCallback:
    | ((notification: PriceDropNotification) => void)
    | null = null;
  private onChatMessageCallback:
    | ((notification: PriceDropNotification) => void)
    | null = null;

  constructor() {
    this.connectSocket();
    
    if (typeof window !== "undefined") {
      (window as any).socket = this.socket;
    }
  }

  private connectSocket() {
    
    const apiUrl = apiClient.defaults.baseURL || "https://supersmart.cs.colman.ac.il";
    console.log("Attempting to connect socket to:", apiUrl);

    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    
    this.socket = io(apiUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000, 
      autoConnect: true,
    });

    
    this.socket.on("connect", () => {
      console.log("Socket connected successfully to:", apiUrl);
      if (typeof window !== "undefined") {
        (window as any).socketConnected = true;
      }
      
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

    
    this.setupNotificationListener();
    this.setupChatNotificationListener();
  }

  public subscribeToWishlistUpdates(userId: string) {
    if (this.socket) {
      console.log("Subscribing to wishlist updates for user:", userId);
      localStorage.setItem("userId", userId);
      this.socket.emit("subscribe-to-wishlists", {
        userId: userId,
        onlyUserWishlists: true,
      });
      
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

  
  private setupNotificationListener() {
    if (!this.socket) return;

    this.socket.on("price-drop", (data) => {
      console.log("Received price-drop event:", data);
      
      const notification: PriceDropNotification = {
        id:
          new Date().getTime().toString() +
          Math.random().toString(36).substring(2, 9),
        ...data,
        changeDate: new Date(data.changeDate || new Date()),
        wishlistId: data.wishlistId || "", 
        wishlistName: data.wishlistName || "רשימת מועדפים",
        type: "price-drop", 
        isRead: false,
      };

      console.log("Processed notification:", notification);
      if (this.onPriceDropCallback) {
        this.onPriceDropCallback(notification);
      }
    });
  }

  
  private setupChatNotificationListener() {
    if (!this.socket) return;

    this.socket.on("new-chat-notification", (data) => {
      console.log("Received new-chat-notification", data);

      
      const currentSocketId = this.socket?.id;
      if (data.clientId === currentSocketId) {
        console.log("Ignoring own chat message notification", data);
        return; 
      }

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
        message: data.message || "", 
      };

      if (this.onChatMessageCallback) {
        this.onChatMessageCallback(notification);
      }
    });
  }

  public checkPriceChanges(lastCheckedTimestamp?: Date) {
    
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setHours(yesterday.getHours() - 24);

    let validTimestamp: Date;

    if (lastCheckedTimestamp && lastCheckedTimestamp < now) {
      validTimestamp = lastCheckedTimestamp;
    } else {
      validTimestamp = yesterday;
    }

    
    const timestamp = validTimestamp.toISOString();

    
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
        return { data: [] }; 
      });
  }

  
  public checkRecentPriceChanges() {
    
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.warn(
        "No userId found for recent price check. User might not be logged in."
      );
      return Promise.resolve({ data: [] });
    }

    console.log(`Checking price changes in last 24 hours for user: ${userId}`);
    console.log(`Using fixed timestamp: ${yesterday.toISOString()}`);

    
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
        return { data: [] }; 
      });
  }

  
  public checkProductPrices(productIds: string[]) {
    if (!productIds.length) return Promise.resolve({ data: [] });

    
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
        userId: userId, 
      },
    });
  }

  
  public reconnect() {
    console.log("Manually triggering socket reconnection");
    try {
      if (this.socket) {
        this.socket.disconnect();
      }
      this.connectSocket();

      
      const userId = localStorage.getItem("userId");
      if (userId) {
        setTimeout(() => {
          this.subscribeToWishlistUpdates(userId);

        
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

  
  public joinCartRoom(cartId: string) {
    if (!this.socket || !cartId) {
      console.error(
        "Cannot join cart room: socket is not connected or cartId is empty"
      );
      return;
    }
    console.log(`Joining cart room: cart-${cartId}`);
    this.socket.emit("join-cart", cartId);

    
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

    
    const cartIds = JSON.parse(localStorage.getItem("userCarts") || "[]");
    const updatedCartIds = cartIds.filter((id: string) => id !== cartId);
    localStorage.setItem("userCarts", JSON.stringify(updatedCartIds));
  }

  
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
      storeId: "1", 
      changeDate: new Date(),
    };

    console.log("Sending test cart notification:", testData);
    this.socket.emit("testCartNotification", testData);
    return true;
  }

  
  public getCartPriceDrops() {
    
    const token = localStorage.getItem("token");
    
    return apiClient.get("/carts/price-drops", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }
}

export default new NotificationService();
