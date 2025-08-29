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
  prediction: string; 
}

const itemService = {
  ...createHttpService<Item>("/items"),
  getAll: () => apiClient.get<Item[]>("/items"),
};

const analyzeReceipt = (receiptImage: FormData) => {
  const controller = new AbortController();
  const request = apiClient.post("/items/analyze-receipt", receiptImage, {
    
    headers: {
      "Content-Type": "multipart/form-data",
    },
    signal: controller.signal,
  });
  return { request, cancel: () => controller.abort() };
};


const getItemById = (id: string) => {
  const controller = new AbortController();
  const request = apiClient.get(`/items/${id}`, {
    signal: controller.signal,
  });
  return { request, cancel: () => controller.abort() };
};

const predictPriceChange = (productId: string, storeId: string) => {
  const controller = new AbortController();
  console.log("Predicting price change for productId:", productId, "and storeId:", storeId); 
  
  const encodedProductId = encodeURIComponent(productId);
  const endpoint = `/items/${encodedProductId}/predict`;
  console.log("Making POST request to:", endpoint);
  console.log("Original productId:", productId);
  console.log("Encoded productId:", encodedProductId);
  console.log("Request body:", { storeId, productId });

  const request = apiClient.post<PricePredictionResponse>(
    endpoint,
    { storeId, productId }, 
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

  
  const storeMap = new Map<string, any>();

  item.storePrices
    .filter(storePrice => storePrice && storePrice.prices && Array.isArray(storePrice.prices))
    .forEach((storePrice) => {
      const storeId = storePrice.storeId;
      if (!storeMap.has(storeId)) {
        storeMap.set(storeId, storePrice);
      } else {
        
        const existing = storeMap.get(storeId);
        existing.prices = [...existing.prices, ...storePrice.prices];
        storeMap.set(storeId, existing);
      }
    });

  return Array.from(storeMap.values())
    .map((storePrice) => {
      try {
        
        const sortedPrices = [...storePrice.prices]
          .sort((a, b) => {
            const dateA = a.date || a.data || "1970-01-01";
            const dateB = b.date || b.data || "1970-01-01";
            return new Date(dateA).getTime() - new Date(dateB).getTime();
          })
          
          .filter((price, index, array) => {
            if (index === 0) return true;
            const currentDate = price.date || price.data || "1970-01-01";
            const prevDate = array[index - 1].date || array[index - 1].data || "1970-01-01";
            return currentDate !== prevDate;
          });

        
        const priceValues: (number | null)[] = [];
        let priceIndex = 0;
        let lastKnownPrice: number | null = null;
        let hasAnyPrice = false;

        completeDateRange.forEach(targetDate => {
          
          let foundPrice = false;

          while (priceIndex < sortedPrices.length) {
            const priceDate = new Date(sortedPrices[priceIndex].date || sortedPrices[priceIndex].data || "1970-01-01");
            const targetDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
            const priceDateOnly = new Date(priceDate.getFullYear(), priceDate.getMonth(), priceDate.getDate());

            if (priceDateOnly.getTime() === targetDateOnly.getTime()) {
              
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
              
              const price = typeof sortedPrices[priceIndex].price === "string"
                ? parseFloat(sortedPrices[priceIndex].price)
                : sortedPrices[priceIndex].price;
              if (!isNaN(price) && price > 0) {
                lastKnownPrice = price;
                hasAnyPrice = true;
              }
              priceIndex++;
            } else {
              
              break;
            }
          }

          if (!foundPrice) {
            
            if (hasAnyPrice && lastKnownPrice !== null) {
              
              priceValues.push(lastKnownPrice);
            } else {
              
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
  getItemById, 
  predictPriceChange, 
  testRoute, 
});