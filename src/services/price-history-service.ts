import apiClient from "./api-client";
import { Item } from "./item-service";

export interface PriceChange {
  productId: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  storeId: string;
  changeDate: Date;
  image?: string;
  wishlistName?: string; // Add wishlist name to PriceChange interface
}

/**
 * Checks if a product has a price drop in its most recent prices
 */
export const checkForPriceDrops = (item: Item): PriceChange[] => {
  const priceChanges: PriceChange[] = [];

  if (!item.storePrices || item.storePrices.length === 0) return priceChanges;

  for (const storePrice of item.storePrices) {
    if (!storePrice.prices || storePrice.prices.length < 2) continue;

    // Sort by date descending (newest first)
    const sortedPrices = [...storePrice.prices].sort((a, b) => {
      const dateA = new Date(a.date || a.data || "1970-01-01").getTime();
      const dateB = new Date(b.date || b.data || "1970-01-01").getTime();
      return dateB - dateA;
    });

    // Get the latest two prices
    const latestPrice = sortedPrices[0];
    const previousPrice = sortedPrices[1];

    if (!latestPrice || !previousPrice) continue;

    // Check if it's a price drop
    const latest =
      typeof latestPrice.price === "string"
        ? parseFloat(latestPrice.price)
        : latestPrice.price;
    const previous =
      typeof previousPrice.price === "string"
        ? parseFloat(previousPrice.price)
        : previousPrice.price;

    if (latest < previous) {
      priceChanges.push({
        productId: item._id,
        productName: item.name,
        oldPrice: previous,
        newPrice: latest,
        storeId: storePrice.storeId,
        changeDate: new Date(
          latestPrice.date || latestPrice.data || new Date()
        ),
        image: item.image,
      });
    }
  }

  return priceChanges;
};

/**
 * Gets items with their price history from the backend
 */
export const getProductsWithPriceHistory = (productIds: string[]) => {
  if (!productIds.length) return Promise.resolve({ data: [] });

  return apiClient.get("/items", {
    params: {
      ids: productIds.join(","),
    },
  });
};

/**
 * Uses mock data to show price drops (for testing without backend)
 */
export const getMockPriceDrops = (): PriceChange[] => {
  return [
    {
      productId: "67e3c6ffe978543305230109",
      productName: "לחם אחיד כהה פרוס",
      oldPrice: 8.3,
      newPrice: 5.0,
      storeId: "65a4e1e1e1e1e1e1e1e1e1e1",
      changeDate: new Date(),
      image:
        "https://hazihinamprod01.blob.core.windows.net/images/Items/Medium/497112.jpg",
      wishlistName: "רשימת מועדפים למכולת", // Add wishlist name to mock data
    },
  ];
};

/**
 * Gets items with price drops for specific wishlist products
 */
export const getWishlistProductPriceChanges = (productIds: string[]) => {
  if (!productIds.length) return Promise.resolve({ data: [] });

  return apiClient.get("/items/price-changes", {
    params: {
      productIds: productIds.join(","),
      onlyDrops: true,
      lastHours: 24,
    },
  });
};

export default {
  checkForPriceDrops,
  getProductsWithPriceHistory,
  getMockPriceDrops,
  getWishlistProductPriceChanges,
};
