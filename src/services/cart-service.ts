// 📁 services/cart-service.ts
import apiClient from "./api-client";
import { CartItem } from "./item-service";

export interface Cart {
  _id?: string;
  name?: string;
  ownerId: string;
  participants: string[];
  items: CartItem[];
}

const getUserCarts = (userId: string) => {
  return apiClient.get<Cart[]>(`/cart?userId=${userId}`);
};

const createCart = (cart: Partial<Cart>) => {
  return apiClient.post<Cart>("/cart", cart);
};

const updateCart = (cartId: string, cart: Partial<Cart>) => {
  return apiClient.put<Cart>(`/cart/${cartId}`, cart);
};

const deleteCart = (cartId: string) => {
  return apiClient.delete(`/cart/${cartId}`);
};

const getCartById = (cartId: string) => {
  return apiClient.get<Cart>(`/cart/${cartId}`);
};

export default { getUserCarts, createCart, updateCart, deleteCart, getCartById };