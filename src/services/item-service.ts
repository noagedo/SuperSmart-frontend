import { CanceledError } from "./api-client";
import createHttpService from "./http-service";

export { CanceledError };

export interface Item {
  _id: string;
  name: string;
  category: string;
  storePrices: { storeId: string; price: number }[];
  suggestedAlternatives: { itemId: string }[];
}

const itemService = createHttpService<Item>("/items");

export default itemService;
