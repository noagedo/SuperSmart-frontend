import { CanceledError } from "./api-client";
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

export default itemService;