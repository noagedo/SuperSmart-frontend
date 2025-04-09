import apiClient,{ CanceledError } from "./api-client";
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

const itemService = {
  ...createHttpService<Item>("/items"),
  getAll: () => apiClient.get<Item[]>("/items"),
};



const analyzeReceipt = (receiptImage: FormData) => {
  const controller = new AbortController();
  const request = apiClient.post("/items/analyze-receipt", receiptImage, { // Use the full endpoint
      headers: {
          'Content-Type': 'multipart/form-data',
      },
      signal: controller.signal,
  });
  return { request, cancel: () => controller.abort() };
};

export default { ...itemService, analyzeReceipt };