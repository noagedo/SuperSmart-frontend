import { useState, useEffect, useRef, useCallback } from "react";
import notificationService, {
  PriceDropNotification,
} from "../services/notification-service";
import useUsers from "./useUsers";
import useWishlists from "./useWishlists";
import cartService from "../services/cart-service"; // Import cartService

const useNotifications = () => {
  const [notifications, setNotifications] = useState<PriceDropNotification[]>(
    []
  );
  const { user } = useUsers();
  const { wishlist } = useWishlists(); // Correctly get the single wishlist
  const checkIntervalRef = useRef<number | null>(null);
  const hasCheckedRecently = useRef<boolean>(false);

  // Helper function to filter notifications by time and user's wishlist
  const filterRecentNotifications = useCallback(
    (notifs: PriceDropNotification[]): PriceDropNotification[] => {
      if (!user || !user._id) return [];

      // Get 24 hours ago timestamp
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      // Get user's wishlist ID if available
      const userWishlistId = wishlist ? wishlist._id : null;

      // Filter by both time and wishlist ownership
      return notifs.filter((notif) => {
        // Check if notification is recent (last 24 hours)
        const isRecent = new Date(notif.changeDate) >= oneDayAgo;

        // Check if belongs to user's wishlist
        const isUsersWishlist =
          !notif.wishlistId ||
          (userWishlistId && notif.wishlistId === userWishlistId);

        return isRecent && isUsersWishlist;
      });
    },
    [user, wishlist]
  );

  // Helper: Add only unique notifications (by productId+cartId+wishlistId+storeId+newPrice)
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

  // Setup notification listener for real-time updates (wishlist + cart)
  useEffect(() => {
    console.log("Setting up unified notification listener");

    const handlePriceDrop = (notification: PriceDropNotification) => {
      if (!user || !user._id) {
        console.log("Ignoring notification - no user logged in");
        return;
      }

      // Log every incoming notification for debugging
      console.log(
        "🔔 [handlePriceDrop] Received price-drop notification:",
        notification
      );

      setNotifications((prev) => {
        // Wishlist notification (wishlistId) or cart notification (cartId)
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

  // Add this new effect to subscribe to cart updates with improved reconnection
  useEffect(() => {
    if (!user || !user._id) return;

    // Get cart IDs from localStorage or fetch them
    const fetchAndSubscribeToCarts = async () => {
      try {
        console.log("Fetching carts for user", user._id);
        const { request } = cartService.getCartsByUser(user._id!);
        const response = await request;
        const carts = response.data;

        console.log(`Fetched ${carts.length} carts for user`);

        // Join all cart rooms with notification enabled
        carts.forEach((cart) => {
          if (cart._id) {
            // Only subscribe if notifications are enabled for this cart
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

        // Store cart IDs in localStorage for reconnection
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
      // Clean up cart subscriptions if needed
      const cartIds = JSON.parse(localStorage.getItem("userCarts") || "[]");
      cartIds.forEach((cartId: string) => {
        if (cartId) {
          // Ensure cartId is not undefined
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

        // Fetch all carts for the user to map productId -> cartId(s)
        const { request } = cartService.getCartsByUser(user._id);
        const responseCarts = await request;
        const carts = responseCarts.data || [];
        console.log("🔔 [Cart Drops] User carts:", carts);

        // Log all products in all carts
        carts.forEach((cart) => {
          if (Array.isArray(cart.items)) {
            console.log(
              `🛒 Cart "${cart.name || cart._id}" contains products:`,
              cart.items.map((i) => i.productId)
            );
          }
        });

        // Map productId -> cartId(s)
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

        // Fetch cart price drops from the API
        const response = await notificationService.getCartPriceDrops();
        const drops = Array.isArray(response.data) ? response.data : [];
        console.log("🔔 [Cart Drops] Raw drops from API:", drops);

        // Only keep drops from last 24 hours
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);

        // For each cart, check if any of its products had a price drop and create a cart-level notification
        const cartLevelDrops: PriceDropNotification[] = [];
        carts.forEach((cart) => {
          if (!Array.isArray(cart.items) || !cart._id) return;
          // Find all drops for products in this cart
          const dropsForCart = drops.filter((drop: any) =>
            cart.items.some((item: any) => item.productId === drop.productId)
          );
          // אל תיצור התראת סכימה אם יש רק מוצר אחד
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

        // Add cart-level notifications to state (avoid duplicates)
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

  // Fetch cart price drops via API on mount (for persistence after refresh)
  useEffect(() => {
    const fetchCartPriceDrops = async () => {
      try {
        if (!user || !user._id) return;

        console.log(
          "🔔 [Cart Drops] Fetching cart price drops for user:",
          user._id
        );

        // Fetch all carts for the user to map productId -> cartId(s)
        const { request } = cartService.getCartsByUser(user._id);
        const responseCarts = await request;
        const carts = responseCarts.data || [];
        console.log("🔔 [Cart Drops] User carts:", carts);

        // Map productId -> cartId(s)
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

        // Fetch cart price drops from the API
        const response = await notificationService.getCartPriceDrops();
        const drops = Array.isArray(response.data) ? response.data : [];
        console.log("🔔 [Cart Drops] Raw drops from API:", drops);

        // Only keep drops from last 24 hours
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);

        // For each drop, create a notification for each cart it belongs to
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
            // Always set wishlistId and wishlistName to empty for cart notifications
            const cartNotification: PriceDropNotification = {
              ...drop,
              cartId,
              id:
                new Date().getTime().toString() +
                Math.random().toString(36).substring(2, 9),
              wishlistId: "", // <-- force empty for cart notifications
              wishlistName: "", // <-- force empty for cart notifications
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

        // Avoid duplicates
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

  // Create a stable checkRecentChanges function with useCallback
  const checkRecentChanges = useCallback(() => {
    if (!user || !user._id || !wishlist || !wishlist.products.length) return;

    console.log("Checking recent price changes (last 24 hours)");

    notificationService
      .checkRecentPriceChanges()
      .then((response) => {
        try {
          if (response.data) {
            console.log("Response from price check:", response.data);

            // Create a safer parsing function
            const parsePriceChanges = (data: any) => {
              if (!data || typeof data !== "object") return [];

              // Handle array or object response
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
                  // Create a notification with required fields or defaults
                  const oldPrice = parseFloat(
                    change.oldPrice || change.previousPrice || 0
                  );
                  const newPrice = parseFloat(
                    change.newPrice || change.currentPrice || 0
                  );

                  // Skip if not a price drop
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
                .filter(Boolean); // Remove null items
            };

            // Get user's wishlist IDs for filtering
            const userWishlists = [wishlist].filter(
              (w) => w && w.userId === user?._id
            );
            const userWishlistIds = userWishlists
              .map((w) => w?._id)
              .filter((id) => id !== null && id !== undefined);

            const priceChanges = parsePriceChanges(response.data);
            // Filter changes to only include user's wishlists
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
                // Filter out duplicates
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

  // Subscribe to updates when user is available
  useEffect(() => {
    if (user && user._id) {
      console.log(
        "User logged in, subscribing to wishlist updates with ID:",
        user._id
      );

      // Store userId in localStorage for reconnection purposes
      localStorage.setItem("userId", user._id);

      // Force reconnect the socket to ensure fresh connection
      notificationService.reconnect();

      // Subscribe to user's wishlist updates after a small delay to ensure connection
      setTimeout(() => {
        if (user._id) {
          notificationService.subscribeToWishlistUpdates(user._id);
        }
      }, 1000);

      // Start periodic checks
      startPeriodicChecks();

      // Force check recent changes immediately on login
      localStorage.removeItem("lastPriceCheckTimestamp");
      checkRecentChanges();

      // Clear old notifications when user logs in
      cleanOldNotifications();
    }
    // Stop checks if user logs out
    if (!user || !user._id) {
      if (checkIntervalRef.current) {
        window.clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      hasCheckedRecently.current = false;

      // Clear all notifications when user logs out
      setNotifications([]);
    }

    return () => {
      if (checkIntervalRef.current) {
        window.clearInterval(checkIntervalRef.current);
      }
    };
  }, [user, checkRecentChanges]);

  // Check for price changes when wishlist changes
  useEffect(() => {
    if (user && user._id && wishlist) {
      console.log(
        `Checking ${wishlist.products.length} products in user's wishlist`
      );

      // Extract all product IDs from user wishlist
      const allProductIds = wishlist.products;

      // Create a map of product ID to wishlist name for notification display
      const productWishlistMap: { [key: string]: string } = {};
      allProductIds.forEach((productId) => {
        productWishlistMap[productId] = "המועדפים שלי";
      });

      // Store the map in localStorage for reference
      localStorage.setItem(
        "productWishlistMap",
        JSON.stringify(productWishlistMap)
      );

      // Check at once
      if (allProductIds.length > 0) {
        console.log(`Checking ${allProductIds.length} products from wishlist`);
        checkSpecificProducts(allProductIds);
      }

      // Cleanup old notifications when wishlist changes
      cleanOldNotifications();
    }
  }, [user, wishlist]);

  // Function to clean old notifications (older than 24 hours)
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

  // Periodically clean old notifications (every hour)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      cleanOldNotifications();
    }, 60 * 60 * 1000); // Every hour

    return () => clearInterval(cleanupInterval);
  }, [cleanOldNotifications]);

  const startPeriodicChecks = () => {
    if (checkIntervalRef.current) {
      window.clearInterval(checkIntervalRef.current);
    }

    // Check every 5 minutes (300000 ms)
    checkIntervalRef.current = window.setInterval(() => {
      console.log("Running periodic price check");
      checkPriceChanges();
    }, 300000);
  };

  const checkPriceChanges = () => {
    if (!user || !user._id) return;

    // Get last checked timestamp from localStorage or use a very old date
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

        // Update last checked timestamp
        localStorage.setItem(
          "lastPriceCheckTimestamp",
          new Date().toISOString()
        );
      })
      .catch((error) => {
        console.error("Failed to check price changes:", error);
      });
  };

  // Filter to make sure we only process products from current user's wishlist
  const checkSpecificProducts = (productIds: string[]) => {
    if (!productIds.length || !user || !user._id) return;

    // Get all products that are in the user's wishlist
    const userProductIds = wishlist ? wishlist.products : [];

    // Only check products that are in the user's wishlist
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
          // Process the items differently since we're using a different endpoint
          console.log("Items retrieved from wishlists:", response.data);

          // Get items with their latest prices
          const priceChanges: PriceDropNotification[] = [];

          // Get the wishlist map from localStorage
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

              // Sort by date descending
              const sortedPrices = [...storePrice.prices].sort((a, b) => {
                const dateA = new Date(a.date || a.data || "1970-01-01");
                const dateB = new Date(b.date || b.data || "1970-01-01");
                return dateB.getTime() - dateA.getTime();
              });

              // Get the latest two prices
              const latestPrice = sortedPrices[0];
              const previousPrice = sortedPrices[1];

              // Skip if not a price drop
              if (
                !latestPrice ||
                !previousPrice ||
                latestPrice.price >= previousPrice.price
              )
                continue;

              // Find which wishlist this product belongs to
              const wishlistName =
                productWishlistMap[item._id] || "רשימת מועדפים";

              // It's a price drop in a wishlist product! Add to notifications
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
                wishlistId: "", // We don't have the exact wishlist ID
                wishlistName: wishlistName, // But we do have the name
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

  // Helper function to add new notifications while avoiding duplicates
  const addNewNotifications = (newNotifications: PriceDropNotification[]) => {
    // First filter to keep only recent notifications (last 24 hours)
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
      // Filter out duplicates
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

  // Add log to see all notifications in state, and split by type
  useEffect(() => {
    const wishlistNotifs = notifications.filter(
      (n) => n.wishlistId && !n.cartId
    );
    const cartNotifs = notifications.filter((n) => n.cartId);
    console.log("🔔 [All Notifications in useNotifications]:", notifications);
    console.log("⭐ [Wishlist Notifications]:", wishlistNotifs);
    console.log("🛒 [Cart Notifications]:", cartNotifs);
    // Extra: log cart notifications for debugging NotificationsCenter
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

  // --- FIX: Filter out cart notifications from wishlist tab and prevent duplicates ---
  // Helper: Add only unique notifications (by productId+cartId+wishlistId+storeId+newPrice)

  // Replace all setNotifications([...prev, ...newNotifs]) with addUniqueNotifications(prev, newNotifs)
  // Example for cart notifications:
  // setNotifications((prev) => [
  //   ...prev,
  //   ...cartDrops.filter(...),
  // ]);
  // =>
  // setNotifications((prev) => addUniqueNotifications(prev, cartDrops));

  // --- Replace in both cart-level and drop-level notifications ---
  // In all setNotifications for cart drops:
  // ...existing code...
  // ...existing code...
  // ...existing code...

  // --- When filtering for wishlist notifications, exclude those with cartId ---
  // (This is already done in NotificationsCenter, but if you use filteredNotifications elsewhere, ensure this logic)
  // ...existing code...

  // Listen for chat notifications (new-chat-notification)
  useEffect(() => {
    const handleChatNotification = (notification: PriceDropNotification) => {
      console.log("🔔 [handleChatNotification]", notification);
      if (!notification.cartId) return;

      // בדוק אם ההודעה היא מהמשתמש הנוכחי לפי השם (אין צורך להתריע על הודעות משלך)
      const currentUserName = user?.userName;
      // הסר את "הודעה חדשה מעגלה: " מתחילת השם
      const senderName = notification.productName?.replace(
        "הודעה חדשה מעגלה: ",
        ""
      );

      if (currentUserName && senderName === currentUserName) {
        console.log("Ignoring own chat message notification from:", senderName);
        return; // דלג על התראות להודעות שנשלחו מהמשתמש הנוכחי
      }

      setNotifications((prev) => {
        // Avoid duplicates (by cartId, type, timestamp)
        const isDuplicate = prev.some(
          (n) =>
            n.type === "chat" &&
            n.cartId === notification.cartId &&
            n.changeDate?.toString() === notification.changeDate?.toString()
        );
        if (isDuplicate) return prev;
        return [...prev, notification];
      });

      // שמירת הודעת צ'אט בלוקל סטורג'
      try {
        // קריאה להודעות קיימות מהמטמון
        const localStorageKey = `chat_messages_${notification.cartId}`;
        const existingMessagesStr = localStorage.getItem(localStorageKey);

        // Extract sender name from the notification
        const senderName = notification.productName
          ? notification.productName.replace("הודעה חדשה מעגלה: ", "")
          : "Unknown User";

        // המרת ההתראה להודעת צ'אט
        const chatMessage = {
          sender: senderName,
          message: notification.message || "",
          timestamp:
            notification.changeDate?.toISOString() || new Date().toISOString(),
          clientId: "",
          _id: notification.id,
        };

        // אם יש הודעות קיימות, הוסף את ההודעה החדשה
        if (existingMessagesStr) {
          try {
            const existingMessages = JSON.parse(existingMessagesStr);

            // בדוק אם ההודעה כבר קיימת
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
          // אין הודעות קיימות, צור מערך חדש עם ההודעה הנוכחית
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
  }, [user?.userName]); // הוסף את שם המשתמש כתלות

  // Mark all chat notifications for a cart as read
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
    markChatNotificationsAsRead, // <-- expose this
  };
};

export default useNotifications;
