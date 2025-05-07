import { useState, useEffect, useRef, useCallback } from "react";
import notificationService, {
  PriceDropNotification,
} from "../services/notification-service";
import useUsers from "./useUsers";
import useWishlists from "./useWishlists";

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

  // Setup notification listener for real-time updates
  useEffect(() => {
    console.log("Setting up notification listener");

    notificationService.onPriceDrop((notification) => {
      console.log("Received price drop notification:", notification);

      // Only process notifications if user is logged in
      if (!user || !user._id) {
        console.log("Ignoring notification - no user logged in");
        return;
      }

      // Multiple filtering criteria to ensure we only show relevant notifications

      // 1. Filter by userId if it exists in the notification
      if (notification.userId && notification.userId !== user._id) {
        console.log(
          `Ignoring notification - user mismatch: ${notification.userId} vs ${user._id}`
        );
        return;
      }

      // 2. Filter by wishlist ownership
      if (!user || !user._id) return;

      // Only accept notification if:
      // - It doesn't have a wishlistId (general notification) OR
      // - The wishlistId belongs to the current user's wishlist
      if (
        notification.wishlistId &&
        (!wishlist || notification.wishlistId !== wishlist._id)
      ) {
        console.log(
          `Ignoring notification - wishlist ${notification.wishlistId} doesn't belong to user's wishlist: ${wishlist?._id}`
        );
        return;
      }

      // 3. Filter by time - only accept notifications from the last 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      if (new Date(notification.changeDate) < oneDayAgo) {
        console.log(
          `Ignoring notification - too old: ${notification.changeDate}`
        );
        return;
      }

      // At this point, we've verified the notification belongs to this user
      setNotifications((prev) => {
        // Avoid duplicates
        const isDuplicate = prev.some(
          (n) =>
            n.productId === notification.productId &&
            n.storeId === notification.storeId &&
            Math.abs(n.newPrice - notification.newPrice) < 0.01
        );

        if (isDuplicate) return prev;
        return [...prev, notification];
      });
    });

    // Cleanup
    return () => {
      if (checkIntervalRef.current) {
        window.clearInterval(checkIntervalRef.current);
      }
      notificationService.disconnect();
    };
  }, [user, wishlist]);

  // Create a stable checkRecentChanges function with useCallback
  const checkRecentChanges = useCallback(() => {
    if (!user || !user._id) return;

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

                return [...prev, ...newChanges];
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

              return [...prev, ...newChanges];
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

      return [...prev, ...uniqueNewChanges];
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

  return {
    notifications,
    dismissNotification,
    dismissAllNotifications,
    checkPriceChanges,
    checkRecentChanges,
    checkSpecificProducts,
  };
};

export default useNotifications;
