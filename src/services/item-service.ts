import { CanceledError } from "./api-client";
import createHttpService from "./http-service";

export { CanceledError };

export interface Item {
  _id: string;
  name: string;
  description?: string;
  category: string;
  storePrices: { storeId: string; price: number }[];
  suggestedAlternatives: { itemId: string }[];
  image?: string;
}

export interface CartItem extends Item {
  quantity: number;
  selectedStorePrice: { storeId: string; price: number };
}

const itemService = createHttpService<Item>("/items");

export default itemService;