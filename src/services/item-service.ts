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
  const request = apiClient.post<PricePredictionResponse>(
    `/items/${productId}/predict`,
    { storeId }, // Send storeId in the request body as JSON
    {
      signal: controller.signal,
    }
  );
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

  return item.storePrices.map((storePrice) => {
    // Sort prices by date (ascending)
    const sortedPrices = [...storePrice.prices].sort((a, b) => {
      const dateA = a.date || a.data || "1970-01-01"; // Provide a default date string
      const dateB = b.date || b.data || "1970-01-01";
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

    // Extract just the price values for the chart
    const priceValues = sortedPrices.map((p) =>
      typeof p.price === "string" ? parseFloat(p.price) : p.price
    );

    return {
      curve: "linear",
      data: priceValues,
      storeId: storePrice.storeId,
    };
  });
};

// Export using Object.assign instead of spread operator to ensure methods are properly included
export default Object.assign(itemService, {
  analyzeReceipt,
  formatPriceDataForChart,
  getItemById, // Add the new method to the exported object
  predictPriceChange, // Add the predictPriceChange method
});