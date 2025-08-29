import { useState, useEffect, useRef, useCallback } from "react";
import notificationService, {
  PriceDropNotification,
} from "../services/notification-service";
import useUsers from "./useUsers";
import useWishlists from "./useWishlists";
import cartService from "../services/cart-service"; 

const useNotifications = () => {
  const [notifications, setNotifications] = useState<PriceDropNotification[]>(
    []
  );
  const { user } = useUsers();
  const { wishlist } = useWishlists(); 
  const checkIntervalRef = useRef<number | null>(null);
  const hasCheckedRecently = useRef<boolean>(false);

  

  function addUniqueNotifications<T extends PriceDropNotification>(
    prev: T[],
    newNotifs: T[]
  ): T[] {
    return [
      ...prev,
      ...newNotifs.filter(
        (newNotif) =>
          !prev.some(
            (n) =>
              n.productId === newNotif.productId &&
              n.cartId === newNotif.cartId &&
              n.wishlistId === newNotif.wishlistId &&
              n.storeId === newNotif.storeId &&
              Math.abs(n.newPrice - newNotif.newPrice) < 0.01
          )
      ),
    ];
  }

  
  useEffect(() => {
    console.log("Setting up unified notification listener");

    const handlePriceDrop = (notification: PriceDropNotification) => {
      if (!user || !user._id) {
        console.log("Ignoring notification - no user logged in");
        return;
      }

      
      console.log(
        "🔔 [handlePriceDrop] Received price-drop notification:",
        notification
      );

      setNotifications((prev) => {
        
        const isDuplicate = notification.cartId
          ? prev.some(
              (n) =>
                n.productId === notification.productId &&
                n.cartId === notification.cartId &&
                Math.abs(n.newPrice - notification.newPrice) < 0.01
            )
          : prev.some(
              (n) =>
                n.productId === notification.productId &&
                n.storeId === notification.storeId &&
                Math.abs(n.newPrice - notification.newPrice) < 0.01 &&
                n.wishlistId === notification.wishlistId
            );

        if (isDuplicate) {
          console.log(
            "🔔 [handlePriceDrop] Duplicate notification skipped:",
            notification
          );
          return prev;
        }
        console.log(
          "🔔 [handlePriceDrop] Adding notification to state:",
          notification
        );
        return [...prev, notification];
      });
    };

    notificationService.onPriceDrop(handlePriceDrop);

    return () => {
      if (checkIntervalRef.current) {
        window.clearInterval(checkIntervalRef.current);
      }
      notificationService.disconnect();
    };
  }, [user]);

  
  useEffect(() => {
    if (!user || !user._id) return;

    
    const fetchAndSubscribeToCarts = async () => {
      try {
        console.log("Fetching carts for user", user._id);
        const { request } = cartService.getCartsByUser(user._id!);
        const response = await request;
        const carts = response.data;

        console.log(`Fetched ${carts.length} carts for user`);

        
        carts.forEach((cart) => {
          if (cart._id) {
          
            if (cart.notifications !== false) {
              console.log(
                `Joining cart room for cart: ${cart._id} (notifications enabled)`
              );
              notificationService.joinCartRoom(cart._id);
            } else {
              console.log(
                `Skipping cart room for cart: ${cart._id} (notifications disabled)`
              );
            }
          }
        });

        
        localStorage.setItem(
          "userCarts",
          JSON.stringify(
            carts
              .filter((c) => c.notifications !== false && c._id) // Ensure _id exists
              .map((c) => c._id)
          )
        );
      } catch (error) {
        console.error("Failed to fetch and subscribe to carts:", error);
      }
    };

    fetchAndSubscribeToCarts();

    return () => {
      
      const cartIds = JSON.parse(localStorage.getItem("userCarts") || "[]");
      cartIds.forEach((cartId: string) => {
        if (cartId) {
          
          notificationService.leaveCartRoom(cartId);
        }
      });
    };
  }, [user]);

  useEffect(() => {
    const fetchCartPriceDrops = async () => {
      try {
        if (!user || !user._id) return;

        console.log(
          "🔔 [Cart Drops] Fetching cart price drops for user:",
          user._id
        );

        
        const { request } = cartService.getCartsByUser(user._id);
        const responseCarts = await request;
        const carts = responseCarts.data || [];
        console.log("🔔 [Cart Drops] User carts:", carts);

        
        carts.forEach((cart) => {
          if (Array.isArray(cart.items)) {
            console.log(
              `🛒 Cart "${cart.name || cart._id}" contains products:`,
              cart.items.map((i) => i.productId)
            );
          }
        });

        
        const productToCartIds: Record<string, string[]> = {};
        carts.forEach((cart) => {
          if (
            Array.isArray(cart.items) &&
            typeof cart._id === "string" &&
            cart._id
          ) {
            cart.items.forEach((item) => {
              if (!item || !item.productId) {
                console.warn(
                  "🔔 [Cart Drops] Skipping invalid cart item:",
                  item,
                  "in cart",
                  cart
                );
                return;
              }
              if (!productToCartIds[item.productId]) {
                productToCartIds[item.productId] = [];
              }
              productToCartIds[item.productId].push(cart._id as string);
            });
          } else {
            console.warn(
              "🔔 [Cart Drops] Cart has no items or invalid _id:",
              cart
            );
          }
        });
        console.log("🔔 [Cart Drops] productToCartIds:", productToCartIds);

        
        const response = await notificationService.getCartPriceDrops();
        const drops = Array.isArray(response.data) ? response.data : [];
        console.log("🔔 [Cart Drops] Raw drops from API:", drops);

        
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);

        
        const cartLevelDrops: PriceDropNotification[] = [];
        carts.forEach((cart) => {
          if (!Array.isArray(cart.items) || !cart._id) return;
          
          const dropsForCart = drops.filter((drop: any) =>
            cart.items.some((item: any) => item.productId === drop.productId)
          );
          
          if (dropsForCart.length <= 1) return;
          const products = dropsForCart
            .map((drop: any) => drop.productName)
            .join(", ");
          const notification: PriceDropNotification = {
            id:
              new Date().getTime().toString() +
              Math.random().toString(36).substring(2, 9),
            cartId: cart._id,
            productId: "",
            productName: `ירידת מחיר ב-${dropsForCart.length} מוצרים: ${products}`,
            oldPrice: 0,
            newPrice: 0,
            storeId: "",
            changeDate: new Date(),
            image: "",
            wishlistId: "",
            wishlistName: "",
          };
          cartLevelDrops.push(notification);
        });

        
        setNotifications((prev) =>
          addUniqueNotifications(prev, cartLevelDrops)
        );
      } catch (error) {
        console.error(
          "❌ [Cart Drops] Failed to fetch cart price drops:",
          error
        );
      }
    };

    fetchCartPriceDrops();
  }, [user]);

  
  useEffect(() => {
    const fetchCartPriceDrops = async () => {
      try {
        if (!user || !user._id) return;

        console.log(
          "🔔 [Cart Drops] Fetching cart price drops for user:",
          user._id
        );

        
        const { request } = cartService.getCartsByUser(user._id);
        const responseCarts = await request;
        const carts = responseCarts.data || [];
        console.log("🔔 [Cart Drops] User carts:", carts);

        
        const productToCartIds: Record<string, string[]> = {};
        carts.forEach((cart) => {
          if (
            Array.isArray(cart.items) &&
            typeof cart._id === "string" &&
            cart._id
          ) {
            cart.items.forEach((item) => {
              if (!item || !item.productId) {
                console.warn(
                  "🔔 [Cart Drops] Skipping invalid cart item:",
                  item,
                  "in cart",
                  cart
                );
                return;
              }
              if (!productToCartIds[item.productId]) {
                productToCartIds[item.productId] = [];
              }
              productToCartIds[item.productId].push(cart._id as string);
            });
          } else {
            console.warn(
              "🔔 [Cart Drops] Cart has no items or invalid _id:",
              cart
            );
          }
        });
        console.log("🔔 [Cart Drops] productToCartIds:", productToCartIds);

        
        const response = await notificationService.getCartPriceDrops();
        const drops = Array.isArray(response.data) ? response.data : [];
        console.log("🔔 [Cart Drops] Raw drops from API:", drops);

        
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);

        
        const cartDrops: PriceDropNotification[] = [];
        drops.forEach((drop: any) => {
          const cartIds = productToCartIds[drop.productId] || [];
          if (cartIds.length === 0) {
            console.log("🔔 [Cart Drops] Drop with no matching cart:", drop);
            return;
          }
          cartIds.forEach((cartId) => {
            if (drop.changeDate && new Date(drop.changeDate) < oneDayAgo) {
              console.log("🔔 [Cart Drops] Drop too old:", drop);
              return;
            }
            
            const cartNotification: PriceDropNotification = {
              ...drop,
              cartId,
              id:
                new Date().getTime().toString() +
                Math.random().toString(36).substring(2, 9),
              wishlistId: "", 
              wishlistName: "", 
            };
            console.log(
              "🔔 [Cart Drops] Creating cart notification:",
              cartNotification
            );
            cartDrops.push(cartNotification);
          });
        });

        console.log(
          "🔔 [Cart Drops] Final cartDrops notifications:",
          cartDrops
        );

        
        setNotifications((prev) => addUniqueNotifications(prev, cartDrops));
      } catch (error) {
        console.error(
          "❌ [Cart Drops] Failed to fetch cart price drops:",
          error
        );
      }
    };

    fetchCartPriceDrops();
  }, [user]);

  
  const checkRecentChanges = useCallback(() => {
    if (!user || !user._id || !wishlist || !wishlist.products.length) return;

    console.log("Checking recent price changes (last 24 hours)");

    notificationService
      .checkRecentPriceChanges()
      .then((response) => {
        try {
          if (response.data) {
            console.log("Response from price check:", response.data);

            
            const parsePriceChanges = (data: any) => {
              if (!data || typeof data !== "object") return [];

              
              const items = Array.isArray(data)
                ? data
                : data.items || data.priceChanges || [];

              if (items.length === 0) {
                console.log("No recent price changes found in data");
                return [];
              }

              console.log("Processing price changes from:", items);

              return items
                .filter((change: any) => !!change)
                .map((change: any) => {
                  
                  const oldPrice = parseFloat(
                    change.oldPrice || change.previousPrice || 0
                  );
                  const newPrice = parseFloat(
                    change.newPrice || change.currentPrice || 0
                  );

                  
                  if (newPrice >= oldPrice) return null;

                  return {
                    id:
                      new Date().getTime() +
                      Math.random().toString(36).substring(2, 9),
                    productId: change.productId || change._id || "",
                    productName: change.productName || change.name || "מוצר",
                    oldPrice: oldPrice,
                    newPrice: newPrice,
                    storeId: change.storeId || "",
                    changeDate: new Date(
                      change.changeDate || change.date || new Date()
                    ),
                    image: change.image,
                    wishlistId: change.wishlistId || "",
                    wishlistName: change.wishlistName || "רשימת מועדפים",
                  };
                })
                .filter(Boolean); 
            };

            
            const userWishlists = [wishlist].filter(
              (w) => w && w.userId === user?._id
            );
            const userWishlistIds = userWishlists
              .map((w) => w?._id)
              .filter((id) => id !== null && id !== undefined);

            const priceChanges = parsePriceChanges(response.data);
            
            const userPriceChanges = priceChanges.filter(
              (change: PriceDropNotification) =>
                change.wishlistId && userWishlistIds.includes(change.wishlistId)
            );

            if (userPriceChanges.length > 0) {
              console.log(
                "Found valid price changes for current user:",
                userPriceChanges
              );
              setNotifications((prev) => {
                
                const newChanges = userPriceChanges.filter(
                  (newChange: PriceDropNotification) =>
                    !prev.some(
                      (existingNotif: PriceDropNotification) =>
                        existingNotif.productId === newChange.productId &&
                        existingNotif.storeId === newChange.storeId &&
                        Math.abs(existingNotif.newPrice - newChange.newPrice) <
                          0.01
                    )
                );

                return addUniqueNotifications(prev, newChanges);
              });
            }
          } else {
            console.log("No recent price changes found (empty response)");
          }
        } catch (parseError) {
          console.error("Error parsing price changes:", parseError);
        }
      })
      .catch((error) => {
        console.error("Failed to check recent price changes:", error);
      });
  }, [user, wishlist]);

  
  useEffect(() => {
    if (user && user._id) {
      console.log(
        "User logged in, subscribing to wishlist updates with ID:",
        user._id
      );

      
      localStorage.setItem("userId", user._id);

      
      notificationService.reconnect();

      
      setTimeout(() => {
        if (user._id) {
          notificationService.subscribeToWishlistUpdates(user._id);
        }
      }, 1000);

      
      startPeriodicChecks();

      
      localStorage.removeItem("lastPriceCheckTimestamp");
      checkRecentChanges();

      
      cleanOldNotifications();
    }
    
    if (!user || !user._id) {
      if (checkIntervalRef.current) {
        window.clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      hasCheckedRecently.current = false;

      
      setNotifications([]);
    }

    return () => {
      if (checkIntervalRef.current) {
        window.clearInterval(checkIntervalRef.current);
      }
    };
  }, [user, checkRecentChanges]);

  
  useEffect(() => {
    if (user && user._id && wishlist) {
      console.log(
        `Checking ${wishlist.products.length} products in user's wishlist`
      );

      
      const allProductIds = wishlist.products;

      
      const productWishlistMap: { [key: string]: string } = {};
      allProductIds.forEach((productId) => {
        productWishlistMap[productId] = "המועדפים שלי";
      });

      
      localStorage.setItem(
        "productWishlistMap",
        JSON.stringify(productWishlistMap)
      );

      
      if (allProductIds.length > 0) {
        console.log(`Checking ${allProductIds.length} products from wishlist`);
        checkSpecificProducts(allProductIds);
      }

      
      cleanOldNotifications();
    }
  }, [user, wishlist]);

  
  const cleanOldNotifications = useCallback(() => {
    console.log("Cleaning old notifications (older than 24 hours)");
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    setNotifications((prevNotifications) =>
      prevNotifications.filter(
        (notification) => new Date(notification.changeDate) >= oneDayAgo
      )
    );
  }, []);

  
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      cleanOldNotifications();
    }, 60 * 60 * 1000); 

    return () => clearInterval(cleanupInterval);
  }, [cleanOldNotifications]);

  const startPeriodicChecks = () => {
    if (checkIntervalRef.current) {
      window.clearInterval(checkIntervalRef.current);
    }

    
    checkIntervalRef.current = window.setInterval(() => {
      console.log("Running periodic price check");
      checkPriceChanges();
    }, 300000);
  };

  const checkPriceChanges = () => {
    if (!user || !user._id) return;

    
    const lastCheckedStr = localStorage.getItem("lastPriceCheckTimestamp");
    const lastChecked = lastCheckedStr ? new Date(lastCheckedStr) : new Date(0);

    console.log("Checking price changes since", lastChecked.toISOString());

    notificationService
      .checkPriceChanges(lastChecked)
      .then((response) => {
        if (response.data && response.data.length > 0) {
          console.log("Found price changes:", response.data);

          const priceChanges: PriceDropNotification[] = response.data.map(
            (change: any) => ({
              id:
                new Date().getTime() +
                Math.random().toString(36).substring(2, 9),
              productId: change.productId,
              productName: change.productName,
              oldPrice: parseFloat(change.oldPrice),
              newPrice: parseFloat(change.newPrice),
              storeId: change.storeId,
              changeDate: new Date(change.changeDate),
              image: change.image,
              wishlistId: change.wishlistId || "",
              wishlistName: change.wishlistName || "רשימת מועדפים",
            })
          );

          if (priceChanges.length > 0) {
            setNotifications((prev) => {
              // Filter out duplicates
              const newChanges = priceChanges.filter(
                (newChange) =>
                  !prev.some(
                    (existingNotif) =>
                      existingNotif.productId === newChange.productId &&
                      existingNotif.storeId === newChange.storeId &&
                      Math.abs(existingNotif.newPrice - newChange.newPrice) <
                        0.01
                  )
              );

              return addUniqueNotifications(prev, newChanges);
            });
          }
        } else {
          console.log("No price changes found");
        }

        
        localStorage.setItem(
          "lastPriceCheckTimestamp",
          new Date().toISOString()
        );
      })
      .catch((error) => {
        console.error("Failed to check price changes:", error);
      });
  };

  
  const checkSpecificProducts = (productIds: string[]) => {
    if (!productIds.length || !user || !user._id) return;

    
    const userProductIds = wishlist ? wishlist.products : [];

    
    const filteredProductIds = productIds.filter((id) =>
      userProductIds.includes(id)
    );

    if (filteredProductIds.length === 0) {
      console.log("No products to check in user wishlist");
      return;
    }

    console.log(
      `Checking ${filteredProductIds.length} products from user's wishlist`
    );

    notificationService
      .checkProductPrices(filteredProductIds)
      .then((response) => {
        if (response.data && Array.isArray(response.data)) {
          
          console.log("Items retrieved from wishlists:", response.data);

          
          const priceChanges: PriceDropNotification[] = [];

          
          let productWishlistMap: { [key: string]: string } = {};
          try {
            const mapString = localStorage.getItem("productWishlistMap");
            if (mapString) {
              productWishlistMap = JSON.parse(mapString);
            }
          } catch (e) {
            console.error("Error parsing productWishlistMap:", e);
          }

          response.data.forEach((item: any) => {
            if (!item.storePrices || item.storePrices.length === 0) return;

            for (const storePrice of item.storePrices) {
              if (!storePrice.prices || storePrice.prices.length < 2) continue;

              
              const sortedPrices = [...storePrice.prices].sort((a, b) => {
                const dateA = new Date(a.date || a.data || "1970-01-01");
                const dateB = new Date(b.date || b.data || "1970-01-01");
                return dateB.getTime() - dateA.getTime();
              });

              
              const latestPrice = sortedPrices[0];
              const previousPrice = sortedPrices[1];

              
              if (
                !latestPrice ||
                !previousPrice ||
                latestPrice.price >= previousPrice.price
              )
                continue;

              
              const wishlistName =
                productWishlistMap[item._id] || "רשימת מועדפים";

              
              priceChanges.push({
                id:
                  new Date().getTime() +
                  Math.random().toString(36).substring(2, 9),
                productId: item._id,
                productName: item.name,
                oldPrice: parseFloat(previousPrice.price),
                newPrice: parseFloat(latestPrice.price),
                storeId: storePrice.storeId,
                changeDate: new Date(
                  latestPrice.date || latestPrice.data || new Date()
                ),
                image: item.image,
                wishlistId: "", 
                wishlistName: wishlistName, 
              });
            }
          });

          if (priceChanges.length > 0) {
            console.log(
              `Found ${priceChanges.length} price drops in wishlist products:`,
              priceChanges
            );
            addNewNotifications(priceChanges);
          }
        }
      })
      .catch((error) => {
        console.error("Failed to check specific product prices:", error);
      });
  };

  
  const addNewNotifications = (newNotifications: PriceDropNotification[]) => {
    
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const recentNotifications = newNotifications.filter(
      (notif) => new Date(notif.changeDate) >= oneDayAgo
    );

    if (recentNotifications.length === 0) {
      console.log("No recent notifications to add (all older than 24 hours)");
      return;
    }

    setNotifications((prev) => {
      
      const uniqueNewChanges = recentNotifications.filter(
        (newChange) =>
          !prev.some(
            (existingNotif) =>
              existingNotif.productId === newChange.productId &&
              existingNotif.storeId === newChange.storeId &&
              Math.abs(existingNotif.newPrice - newChange.newPrice) < 0.01
          )
      );

      return addUniqueNotifications(prev, uniqueNewChanges);
    });
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  const dismissAllNotifications = () => {
    setNotifications([]);
  };

  
  useEffect(() => {
    const wishlistNotifs = notifications.filter(
      (n) => n.wishlistId && !n.cartId
    );
    const cartNotifs = notifications.filter((n) => n.cartId);
    console.log("🔔 [All Notifications in useNotifications]:", notifications);
    console.log("⭐ [Wishlist Notifications]:", wishlistNotifs);
    console.log("🛒 [Cart Notifications]:", cartNotifs);
    
    if (cartNotifs.length === 0) {
      console.warn(
        "🛒 [DEBUG] No cart notifications in state. If you expect cart notifications, check that:"
      );
      console.warn("- The backend sends notifications with cartId");
      console.warn(
        "- The frontend receives and stores notifications with cartId"
      );
      console.warn("- The cartId matches your user's carts");
    }
  }, [notifications]);

  
  useEffect(() => {
    const handleChatNotification = (notification: PriceDropNotification) => {
      console.log("🔔 [handleChatNotification]", notification);
      if (!notification.cartId) return;

      
      const currentUserName = user?.userName;
      
      const senderName = notification.productName?.replace(
        "הודעה חדשה מעגלה: ",
        ""
      );

      if (currentUserName && senderName === currentUserName) {
        console.log("Ignoring own chat message notification from:", senderName);
        return; 
      }

      setNotifications((prev) => {
        
        const isDuplicate = prev.some(
          (n) =>
            n.type === "chat" &&
            n.cartId === notification.cartId &&
            n.changeDate?.toString() === notification.changeDate?.toString()
        );
        if (isDuplicate) return prev;
        return [...prev, notification];
      });

      
      try {
        
        const localStorageKey = `chat_messages_${notification.cartId}`;
        const existingMessagesStr = localStorage.getItem(localStorageKey);

        
        const senderName = notification.productName
          ? notification.productName.replace("הודעה חדשה מעגלה: ", "")
          : "Unknown User";

        
        const chatMessage = {
          sender: senderName,
          message: notification.message || "",
          timestamp:
            notification.changeDate?.toISOString() || new Date().toISOString(),
          clientId: "",
          _id: notification.id,
        };

        
        if (existingMessagesStr) {
          try {
            const existingMessages = JSON.parse(existingMessagesStr);

            
            const isDuplicate = existingMessages.some(
              (msg: any) =>
                msg.sender === chatMessage.sender &&
                msg.message === chatMessage.message &&
                msg.timestamp === chatMessage.timestamp
            );

            if (!isDuplicate) {
              const updatedMessages = [...existingMessages, chatMessage];
              localStorage.setItem(
                localStorageKey,
                JSON.stringify(updatedMessages)
              );
              console.log(
                `[handleChatNotification] Saved notification to localStorage for cart ${notification.cartId} (total: ${updatedMessages.length} messages)`
              );
            }
          } catch (error) {
            console.error(
              "[handleChatNotification] Error parsing chat messages:",
              error
            );
          }
        } else {
          
          localStorage.setItem(localStorageKey, JSON.stringify([chatMessage]));
          console.log(
            `[handleChatNotification] Created new chat cache for cart ${notification.cartId}`
          );
        }
      } catch (error) {
        console.error(
          "[handleChatNotification] Error saving chat to localStorage:",
          error
        );
      }
    };

    notificationService.onChatMessage(handleChatNotification);

    return () => {
      notificationService.onChatMessage(() => {});
    };
  }, [user?.userName]); 

  
  const markChatNotificationsAsRead = (cartId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.type === "chat" && n.cartId === cartId ? { ...n, isRead: true } : n
      )
    );
  };

  return {
    notifications,
    dismissNotification,
    dismissAllNotifications,
    checkPriceChanges,
    checkRecentChanges,
    checkSpecificProducts,
    markChatNotificationsAsRead, 
  };
};

export default useNotifications;
