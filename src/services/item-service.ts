import apiClient, { CanceledError } from "./api-client";
import createHttpService from "./http-service";

export { CanceledError };

export interface Price {
  date: string; // תאריך בפורמט ISO
  price: number;
}

export interface StorePrice {
  storeId: string;
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
}

export interface CartItem extends Item {
  quantity: number;
  selectedStorePrice: { storeId: string; price: number };
}

const itemService = createHttpService<Item>("/items");

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
    const sortedPrices = [...storePrice.prices].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Extract just the price values for the chart
    const priceValues = sortedPrices.map((p) => p.price);

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
});
