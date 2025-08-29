import apiClient, { CanceledError } from "./api-client";
import { CartItem } from "./item-service";

export { CanceledError };

export interface CartParticipant {
  _id: string;
  email: string;
  userName: string;
  profilePicture?: string;
}

export interface Cart {
  _id?: string;
  name?: string;
  ownerId: string;
  participants: CartParticipant[];
  items: { productId: string; quantity: number }[];
  createdAt?: Date;
  updatedAt?: Date;
  notifications?: boolean;
}

const createCart = (cart: Omit<Cart, "_id">) => {
  const controller = new AbortController();
  const request = apiClient.post<Cart>("/carts", cart, {
    signal: controller.signal,
  });
  return { request, cancel: () => controller.abort() };
};

const getCartsByUser = (userId: string) => {
  const controller = new AbortController();
  const request = apiClient.get<Cart[]>(`/carts?userId=${userId}`, {
    signal: controller.signal,
  });
  return { request, cancel: () => controller.abort() };
};

const getCartById = (cartId: string) => {
  const controller = new AbortController();
  const request = apiClient.get<Cart>(`/carts/${cartId}`, {
    signal: controller.signal,
  });
  return { request, cancel: () => controller.abort() };
};

const updateCart = (id: string, cart: Partial<Cart>) => {
  const request = apiClient.put(`/carts/${id}`, cart);
  return { request };
};

const deleteCart = (cartId: string) => {
  const controller = new AbortController();
  const request = apiClient.delete(`/carts/${cartId}`, {
    signal: controller.signal,
  });
  return { request, cancel: () => controller.abort() };
};

const addParticipant = (cartId: string, email: string) => {
  const controller = new AbortController();
  const request = apiClient.put(
    `/carts/${cartId}/participants`,
    { email },
    { signal: controller.signal }
  );
  return { request, cancel: () => controller.abort() };
};

const removeParticipant = (cartId: string, userIdToRemove: string) => {
  const controller = new AbortController();
  const request = apiClient.put(
    `/carts/${cartId}/participants/remove`,
    { userIdToRemove },
    { signal: controller.signal }
  );
  return { request, cancel: () => controller.abort() };
};


const transformCartItems = (items: CartItem[]) => {
  return items.map((item) => ({
    productId: item._id,
    quantity: item.quantity || 1,
  }));
};

export default {
  createCart,
  getCartsByUser,
  getCartById,
  updateCart,
  deleteCart,
  transformCartItems,
  addParticipant,
  removeParticipant,
};