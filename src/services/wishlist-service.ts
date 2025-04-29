import createHttpService from "./http-service";
import { Wishlist } from "../types/wishlist";
import apiClient from "./api-client";

const wishlistService = createHttpService<Wishlist>("/wishlists");

// Additional methods not covered by the base HttpService
export const addProductToWishlist = (wishlistId: string, productId: string) => {
  const controller = new AbortController();
  const request = apiClient.post(
    `/wishlists/${wishlistId}/products`,
    { productId },
    { signal: controller.signal }
  );
  return { request, cancel: () => controller.abort() };
};

export const removeProductFromWishlist = (
  wishlistId: string,
  productId: string
) => {
  const controller = new AbortController();
  const request = apiClient.delete(`/wishlists/${wishlistId}/products`, {
    data: { productId },
    signal: controller.signal,
  });
  return { request, cancel: () => controller.abort() };
};

export const getWishlistsByUser = (userId: string) => {
  const controller = new AbortController();
  const request = apiClient.get(`/wishlists?userId=${userId}`, {
    signal: controller.signal,
  });
  return { request, cancel: () => controller.abort() };
};

export default wishlistService;
