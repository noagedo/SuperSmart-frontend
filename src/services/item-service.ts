import apiClient, { CanceledError } from "./api-client";
import createHttpService from "./http-service";

export { CanceledError };

export interface NutritionInfo {
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
  sodium: number;
  calcium: number | null;
  vitamin_c: number | null;
  cholesterol: number;
}

export interface Price {
  date?: string; // תאריך בפורמט ISO
  data?: string; // Alternative field name found in the database
  price: number;
}

export interface StorePrice {
  storeId: string;
  storeName?: string; // Add the storeName property here (optional)
  prices: Price[];
}

export interface Item {
  _id: string;
  name: string;
  category: string;
  storePrices: StorePrice[];
  image?: string;
  code?: string;
  barcode?: string;
  nutrition: NutritionInfo;
}

export interface CartItem extends Item {
  quantity: number;
  selectedStorePrice: { storeId: string; price: number };
}

export interface PricePredictionResponse {
  prediction: string; // Adjust the type based on your backend's response
}

const itemService = {
  ...createHttpService<Item>("/items"),
  getAll: () => apiClient.get<Item[]>("/items"),
};

const analyzeReceipt = (receiptImage: FormData) => {
  const controller = new AbortController();
  const request = apiClient.post("/items/analyze-receipt", receiptImage, {
    // Use the full endpoint
    headers: {
      "Content-Type": "multipart/form-data",
    },
    signal: controller.signal,
  });
  return { request, cancel: () => controller.abort() };
};

// Add getItemById method to fetch a single item by its ID
const getItemById = (id: string) => {
  const controller = new AbortController();
  const request = apiClient.get(`/items/${id}`, {
    signal: controller.signal,
  });
  return { request, cancel: () => controller.abort() };
};

const predictPriceChange = (productId: string, storeId: string) => {
  const controller = new AbortController();
  console.log("Predicting price change for productId:", productId, "and storeId:", storeId); // Log parameters

  // Encode the productId to handle special characters
  const encodedProductId = encodeURIComponent(productId);
  const endpoint = `/items/${encodedProductId}/predict`;
  console.log("Making POST request to:", endpoint);
  console.log("Original productId:", productId);
  console.log("Encoded productId:", encodedProductId);
  console.log("Request body:", { storeId, productId });

  const request = apiClient.post<PricePredictionResponse>(
    endpoint,
    { storeId, productId }, // Send both productId and storeId in the request body
    {
      signal: controller.signal,
    }
  ).catch(error => {
    console.error("Full error details:", error);
    console.error("Error response:", error.response);
    console.error("Error config:", error.config);
    throw error;
  });

  return { request, cancel: () => controller.abort() };
};

// Test function to verify routing works
const testRoute = (productId: string) => {
  const controller = new AbortController();
  const encodedProductId = encodeURIComponent(productId);
  const endpoint = `/items/${encodedProductId}/test`;
  console.log("Testing route:", endpoint);

  const request = apiClient.get(endpoint, {
    signal: controller.signal,
  });
  return { request, cancel: () => controller.abort() };
};

/**
 * Formats item price data for use with MUI LineChart component
 * @param item The item containing price history
 * @returns An array of series data ready for LineChart
 */
const formatPriceDataForChart = (item: Item) => {
  if (!item.storePrices || item.storePrices.length === 0) {
    return [];
  }

  // Get complete date range from first price to today
  const getAllDates = () => {
    const allDates: Date[] = [];
    item.storePrices.forEach(storePrice => {
      if (storePrice.prices) {
        storePrice.prices.forEach(price => {
          const dateString = price.date || price.data || "";
          if (dateString) {
            allDates.push(new Date(dateString));
          }
        });
      }
    });

    if (allDates.length === 0) return [];

    allDates.sort((a, b) => a.getTime() - b.getTime());
    const startDate = allDates[0];
    const endDate = new Date(); // Today

    const dateRange: Date[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      dateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dateRange;
  };

  const completeDateRange = getAllDates();
  if (completeDateRange.length === 0) return [];

  // Group store prices by storeId to handle duplicates
  const storeMap = new Map<string, any>();

  item.storePrices
    .filter(storePrice => storePrice && storePrice.prices && Array.isArray(storePrice.prices))
    .forEach((storePrice) => {
      const storeId = storePrice.storeId;
      if (!storeMap.has(storeId)) {
        storeMap.set(storeId, storePrice);
      } else {
        // Merge prices if we have duplicate store entries
        const existing = storeMap.get(storeId);
        existing.prices = [...existing.prices, ...storePrice.prices];
        storeMap.set(storeId, existing);
      }
    });

  return Array.from(storeMap.values())
    .map((storePrice) => {
      try {
        // Sort prices by date (ascending) and remove duplicates
        const sortedPrices = [...storePrice.prices]
          .sort((a, b) => {
            const dateA = a.date || a.data || "1970-01-01";
            const dateB = b.date || b.data || "1970-01-01";
            return new Date(dateA).getTime() - new Date(dateB).getTime();
          })
          // Remove duplicate prices on the same date
          .filter((price, index, array) => {
            if (index === 0) return true;
            const currentDate = price.date || price.data || "1970-01-01";
            const prevDate = array[index - 1].date || array[index - 1].data || "1970-01-01";
            return currentDate !== prevDate;
          });

        // Create price array aligned with complete date range
        const priceValues: (number | null)[] = [];
        let priceIndex = 0;
        let lastKnownPrice: number | null = null;
        let hasAnyPrice = false;

        completeDateRange.forEach(targetDate => {
          // Check if we have a price for this date
          let foundPrice = false;

          while (priceIndex < sortedPrices.length) {
            const priceDate = new Date(sortedPrices[priceIndex].date || sortedPrices[priceIndex].data || "1970-01-01");
            const targetDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
            const priceDateOnly = new Date(priceDate.getFullYear(), priceDate.getMonth(), priceDate.getDate());

            if (priceDateOnly.getTime() === targetDateOnly.getTime()) {
              // Found exact date match
              const price = typeof sortedPrices[priceIndex].price === "string"
                ? parseFloat(sortedPrices[priceIndex].price)
                : sortedPrices[priceIndex].price;
              if (!isNaN(price) && price > 0) {
                lastKnownPrice = price;
                hasAnyPrice = true;
                priceValues.push(price);
              } else {
                priceValues.push(lastKnownPrice);
              }
              priceIndex++;
              foundPrice = true;
              break;
            } else if (priceDateOnly < targetDateOnly) {
              // This price is for an earlier date, update last known price and continue
              const price = typeof sortedPrices[priceIndex].price === "string"
                ? parseFloat(sortedPrices[priceIndex].price)
                : sortedPrices[priceIndex].price;
              if (!isNaN(price) && price > 0) {
                lastKnownPrice = price;
                hasAnyPrice = true;
              }
              priceIndex++;
            } else {
              // This price is for a future date, break
              break;
            }
          }

          if (!foundPrice) {
            // No price for this date
            if (hasAnyPrice && lastKnownPrice !== null) {
              // Use last known price only if we have had at least one real price
              priceValues.push(lastKnownPrice);
            } else {
              // No price data available yet, use null
              priceValues.push(null);
            }
          }
        });

        return {
          curve: "linear",
          data: priceValues,
          storeId: storePrice.storeId,
        };
      } catch (error) {
        console.error(`Error processing prices for store ${storePrice.storeId}:`, error);
        return {
          curve: "linear",
          data: [],
          storeId: storePrice.storeId,
        };
      }
    })
    .filter(series => series.data.length > 0);
};


export default Object.assign(itemService, {
  analyzeReceipt,
  formatPriceDataForChart,
  getItemById, // Add the new method to the exported object
  predictPriceChange, // Add the predictPriceChange method
  testRoute, // Add the testRoute method
});